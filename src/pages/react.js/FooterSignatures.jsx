import { getCredentialByRole } from '../SchoolSignaturesSettings';

export function FooterSignatures({ admin, school }) {
  const teacherCred = getCredentialByRole('teacher');
  const headCred    = getCredentialByRole('headteacher');
  const dosCred     = getCredentialByRole('dos');

  const teacherName = teacherCred?.name || admin.classTeacherName || '___________________';
  const teacherTitle = teacherCred?.title || 'Class Teacher';
  const headName    = headCred?.name    || admin.headTeacherName  || '___________________';
  const headTitle   = headCred?.title   || 'Head Teacher';

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
          <div className="sig-line" />
          <span className="sig-label">Signature</span>
        </div>

        <div className="seal-area">
          {school?.stamp
            ? <img src={school.stamp} alt="stamp" className="stamp-img" />
            : <div className="stamp-placeholder">OFFICIAL<br />STAMP</div>}
          <span className="sig-label seal-label">Stamp</span>
        </div>

        <div className="sig-block sig-block-right">
          <span className="sig-role">{headTitle.toUpperCase()}</span>
          <span className="sig-name">{headName}</span>
          <div className="sig-line" />
          <span className="sig-label">Signature</span>
        </div>
      </div>

      <div className="disclaimer-bar">
        <span>This report is the property of {school?.name || 'the school'}. If found, please return it to the school address above.</span>
      </div>
    </footer>
  );
}
