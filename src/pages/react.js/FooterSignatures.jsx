import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getCredentialByRole } from '../SchoolSignaturesSettings';

export function FooterSignatures({ admin, school, student }) {
  const teacherCred = getCredentialByRole('teacher');
  const headCred    = getCredentialByRole('headteacher');

  const [teacherSig, setTeacherSig] = useState(teacherCred?.signature || '');
  const [headSig, setHeadSig] = useState(headCred?.signature || '');
  const [stampSrc, setStampSrc] = useState(school?.stamp || '');

  const teacherName = teacherCred?.name || admin.classTeacherName || '___________________';
  const teacherTitle = teacherCred?.title || 'Class Teacher';
  const headName    = headCred?.name    || admin.headTeacherName  || '___________________';
  const headTitle   = headCred?.title   || 'Head Teacher';

  // Generate serial number from student ID and school name
  const generateSerialNumber = () => {
    const studentId = student?.idNo || 'UNKNOWN';
    const schoolCode = (school?.name || 'SCHOOL').substring(0, 3).toUpperCase();
    const timestamp = new Date().getFullYear().toString().slice(-2);
    return `${schoolCode}-${timestamp}-${studentId}`;
  };

  const serialNumber = generateSerialNumber();

  // Generate QR code data
  const qrData = `${school?.name || 'School'}|${student?.idNo || 'N/A'}|${student?.name || 'N/A'}|${serialNumber}`;

  function handleTeacherSigUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setTeacherSig(URL.createObjectURL(file));
  }

  function handleHeadSigUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setHeadSig(URL.createObjectURL(file));
  }

  function handleStampUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStampSrc(URL.createObjectURL(file));
  }

  return (
    <footer className="footer-section">
      <div className="admin-footer">
        <span>Term Ended On: <strong>{admin.termEnded}</strong></span>
        <span>Next Term Begins: <strong>{admin.nextTerm}</strong></span>
        <span>Fees Balance: <strong>UGX {admin.balance}</strong></span>
        <span>Fees Next Term: <strong>UGX {admin.nextFees}</strong></span>
      </div>

      <div className="signatures">
        <div className="sig-block">
          <span className="sig-role">{teacherTitle.toUpperCase()}</span>
          <span className="sig-name">{teacherName}</span>
          <div className="sig-image-area">
            <label className="sig-upload-label" title="Click to upload signature">
              {teacherSig
                ? <img src={teacherSig} alt="Teacher Signature" className="sig-img" />
                : <div className="sig-upload-placeholder">Upload<br/>Signature</div>
              }
              <input
                type="file"
                accept="image/*"
                onChange={handleTeacherSigUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <span className="sig-label">Signature</span>
        </div>

        <div className="seal-area">
          <label className="stamp-upload-label" title="Click to upload stamp">
            {stampSrc
              ? <img src={stampSrc} alt="stamp" className="stamp-img" />
              : <div className="stamp-placeholder">OFFICIAL<br />STAMP</div>
            }
            <input
              type="file"
              accept="image/*"
              onChange={handleStampUpload}
              style={{ display: 'none' }}
            />
          </label>
          <span className="sig-label seal-label">Stamp</span>
        </div>

        <div className="sig-block sig-block-right">
          <span className="sig-role">{headTitle.toUpperCase()}</span>
          <span className="sig-name">{headName}</span>
          <div className="sig-image-area">
            <label className="sig-upload-label" title="Click to upload signature">
              {headSig
                ? <img src={headSig} alt="Head Teacher Signature" className="sig-img" />
                : <div className="sig-upload-placeholder">Upload<br/>Signature</div>
              }
              <input
                type="file"
                accept="image/*"
                onChange={handleHeadSigUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <span className="sig-label">Signature</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <QRCodeSVG value={qrData} size={80} level="H" includeMargin={false} />
          <div style={{ fontSize: '8px', textAlign: 'center', lineHeight: '1.2' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Scan to Verify</div>
            <div style={{ fontSize: '7px', color: '#666' }}>{serialNumber}</div>
          </div>
        </div>
      </div>

      <div className="disclaimer-bar">
        <span>This report is the property of {school?.name || 'the school'}. If found, please return it to the school address above.</span>
      </div>
    </footer>
  );
}
