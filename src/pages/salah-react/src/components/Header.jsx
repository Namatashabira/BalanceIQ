import { useState } from 'react';

export function Header({ school }) {
  const [logoSrc, setLogoSrc] = useState(school.logo || '');

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoSrc(URL.createObjectURL(file));
  }

  return (
    <header className="report-header">
      <div className="header-gradient-bar" />
      
      <div className="header-content-centered">
        <div className="header-school-info">
          <h1 className="school-name">{school.name}</h1>
          <p className="school-motto">&ldquo;{school.subtitle || 'Let Our Future Shine'}&rdquo;</p>
        </div>

        <div className="header-logo-wrapper">
          <label className="logo-upload-label" title="Click to upload logo">
            {logoSrc
              ? <img src={logoSrc} alt="School Logo" className="school-logo" />
              : <div className="logo-placeholder">Upload<br/>Logo</div>
            }
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div className="header-badge-wrapper">
          <div className="report-badge">
            <span className="badge-label">NEW CURRICULUM</span>
            <h2 className="badge-title">REPORT CARD</h2>
            <span className="badge-subtitle">Competency Based Assessment</span>
          </div>
        </div>

        <div className="header-term-wrapper">
          <span className="term-badge">{school.term || 'TERM 1'}</span>
          <span className="year-badge">{school.year || '2026'}</span>
        </div>
      </div>

      <div className="header-contacts">
        {school.address && <div className="contact-row">📍 {school.address}</div>}
        {school.phone && <div className="contact-row">📞 {school.phone}</div>}
        {school.email && <div className="contact-row">✉️ {school.email}</div>}
      </div>
    </header>
  );
}
