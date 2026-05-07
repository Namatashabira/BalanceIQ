import { useEffect, useRef, useState } from 'react';
import { X, User, Camera, Loader2, CheckCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

/**
 * Compress + resize an image File to WebP using Canvas.
 * @param {File} file - original image file
 * @param {number} maxPx - max width/height in pixels (default 400)
 * @param {number} quality - WebP quality 0-1 (default 0.82)
 * @returns {Promise<File>} compressed WebP File
 */
function compressToWebP(file, maxPx = 400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round((height / width) * maxPx); width = maxPx; }
        else                { width  = Math.round((width / height) * maxPx); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          resolve(new File([blob], 'avatar.webp', { type: 'image/webp' }));
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}

export default function AccountPopup({ open, onClose, onSave, onLogout, initialProfile }) {
  const [username, setUsername]       = useState('');
  const [fullName, setFullName]       = useState('');
  const [preview, setPreview]         = useState('');
  const [uploading, setUploading]     = useState(false);
  const [uploadDone, setUploadDone]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setUsername(initialProfile?.username || '');
    setFullName(initialProfile?.fullName || '');
    setPreview(initialProfile?.avatar || initialProfile?.avatarUrl || '');
    setUploadDone(false);
    setUploadError('');
    setConfirmingLogout(false);
  }, [initialProfile, open]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadDone(false);

    try {
      // Compress + convert to WebP before uploading
      const compressed = await compressToWebP(file);

      // Show compressed preview immediately
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result || '');
      reader.readAsDataURL(compressed);

      // Upload compressed WebP to backend → Cloudinary
      const fd = new FormData();
      fd.append('profile_picture', compressed);
      const res = await fetch(`${API}/users/profile/upload-picture/`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const url = data.profile_picture_url;
      setPreview(url);
      setUploadDone(true);
      const stored = JSON.parse(localStorage.getItem('userProfile') || '{}');
      stored.avatar = url;
      localStorage.setItem('userProfile', JSON.stringify(stored));
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => setUploadDone(false), 2500);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const p = {
      username: username || initialProfile?.username,
      fullName: fullName || initialProfile?.fullName,
      avatar: preview,
    };
    localStorage.setItem('userProfile', JSON.stringify(p));
    window.dispatchEvent(new Event('storage'));
    onSave?.({ username, fullName, avatarUrl: preview, preview });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-start bg-black/60 p-4">
      <div className="bg-white w-60 sm:w-64 rounded-xl shadow-2xl border border-gray-200 z-[71] ml-1">

        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="text-base font-semibold text-gray-800">
            {confirmingLogout ? 'Confirm Logout' : 'My Account'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>

        {!confirmingLogout ? (
          <div className="p-4 space-y-3">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  {preview
                    ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                    : <User size={28} className="text-gray-400" />}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow disabled:opacity-60"
                  title="Upload photo"
                >
                  {uploading
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Camera size={12} />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {uploadDone && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle size={12} /> Photo saved
                </span>
              )}
              {uploadError && (
                <span className="text-xs text-red-500">{uploadError}</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs bg-white text-gray-900"
                placeholder="your.username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs bg-white text-gray-900"
                placeholder="Your full name"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-3 text-center">
            <p className="text-base font-semibold text-gray-900">Are you sure you want to log out?</p>
            <p className="text-sm text-gray-600">You will need to sign in again.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
          {!confirmingLogout && onLogout && (
            <button
              onClick={() => setConfirmingLogout(true)}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
            >
              Logout
            </button>
          )}
          {confirmingLogout && (
            <>
              <button
                onClick={() => setConfirmingLogout(false)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => { onLogout?.(); setConfirmingLogout(false); onClose?.(); }}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
              >
                Yes, Logout
              </button>
            </>
          )}
          {!confirmingLogout && (
            <>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
