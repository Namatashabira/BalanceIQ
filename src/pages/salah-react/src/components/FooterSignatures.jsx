import { useState } from 'react';

export function FooterSignatures({ admin, school }) {
  const [stampSrc, setStampSrc] = useState('');
  const [classSig, setClassSig] = useState('');
  const [headSig, setHeadSig] = useState('');

  const handleUpload = (setter) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setter(URL.createObjectURL(file));
  };

  return (
    <footer className="footer-section">
      <div className="admin-footer">
        <span>Term Ended: <strong>{admin.termEnded}</strong></span>
        <span>Next Term Begins: <strong>{admin.nextTerm}</strong></span>
        <span>Fees Balance: <strong>UGX {admin.balance}</strong></span>
        <span>Fees Next Term: <strong>UGX {admin.nextFees}</strong></span>
      </div>

      <div className="signatures">
        <div className="sig-card">
          <span className="sig-role">CLASS TEACHER</span>
          <span className="sig-name">{admin.classTeacherName || 'Mr. Ssempala David'}</span>
          <label className="sig-upload-label" title="Click to upload signature">
            {classSig
              ? <img src={classSig} alt="Class Teacher Signature" className="sig-img" />
              : <div className="sig-upload-placeholder">Upload Signature</div>
            }
            <input type="file" accept="image/*" onChange={handleUpload(setClassSig)} style={{ display: 'none' }} />
          </label>
          <span className="sig-label">Signature</span>
        </div>

        <div className="stamp-card">
          <label className="stamp-upload-label" title="Click to upload stamp">
            {stampSrc
              ? <img src={stampSrc} alt="School Stamp" className="stamp-img" />
              : <div className="stamp-placeholder">Upload<br />Stamp</div>
            }
            <input type="file" accept="image/*" onChange={handleUpload(setStampSrc)} style={{ display: 'none' }} />
          </label>
          <span className="sig-label">Official Stamp</span>
        </div>

        <div className="sig-card">
          <span className="sig-role">HEAD TEACHER</span>
          <span className="sig-name">{admin.headTeacherName || 'Mrs. Nankya Patience'}</span>
          <label className="sig-upload-label" title="Click to upload signature">
            {headSig
              ? <img src={headSig} alt="Head Teacher Signature" className="sig-img" />
              : <div className="sig-upload-placeholder">Upload Signature</div>
            }
            <input type="file" accept="image/*" onChange={handleUpload(setHeadSig)} style={{ display: 'none' }} />
          </label>
          <span className="sig-label">Signature</span>
        </div>
      </div>

      <div className="footer-bar">
        <p>This report is the property of {school.name}. If found, please return it to the school address above.</p>
      </div>
    </footer>
  );
}
