import React, { useEffect, useRef, useState } from 'react';
import { X, User, Image as ImageIcon } from 'lucide-react';

export default function AccountPopup({ open, onClose, onSave, onLogout, initialProfile }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setUsername(initialProfile.username || '');
      setFullName(initialProfile.fullName || '');
      const startingAvatar = initialProfile.avatar || initialProfile.avatarUrl || '';
      setAvatarUrl(initialProfile.avatarUrl || startingAvatar || '');
      setPreview(startingAvatar || '');
    }
    setConfirmingLogout(false);
  }, [initialProfile, open]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result || '');
    reader.readAsDataURL(file);
  };

  const handleClearAvatar = () => {
    setAvatarFile(null);
    setAvatarUrl('');
    setPreview('');
  };

  const handleSave = () => {
    onSave({ username, fullName, avatarUrl, avatarFile, preview });
  };

  const handleConfirmLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setConfirmingLogout(false);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-start bg-black/60 p-4">
      <div className="bg-white w-[15rem] sm:w-[16rem] rounded-xl shadow-2xl border border-gray-200 z-[71] ml-1">

        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="text-base font-semibold text-gray-800">{confirmingLogout ? 'Confirm Logout' : 'My Account'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {!confirmingLogout ? (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="focus:outline-none"
              aria-label="Upload avatar"
            >
              {preview ? (
                <img src={preview} alt="Avatar preview" className="w-14 h-14 rounded-full object-cover border" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <User size={24} />
                </div>
              )}
            </button>
            <div className="flex-1 space-y-2 text-xs text-gray-700">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {preview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-blue-600 hover:text-blue-700"
                >
                  Change
                </button>
              )}
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => { setAvatarUrl(e.target.value); setPreview(e.target.value); setAvatarFile(null); }}
                placeholder="Image URL (optional)"
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs bg-white text-gray-900"
              placeholder="your.username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
                onClick={handleConfirmLogout}
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
