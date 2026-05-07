import { useState } from 'react';

const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const WebIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

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
      
      <div className="header-content">
        <div className="header-left">
          <label className="logo-upload-label" title="Click to upload logo">
            {logoSrc
              ? <img src={logoSrc} alt="School Logo" className="school-logo" />
              : <div className="logo-placeholder">Upload<br/>Logo</div>
            }
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </label>

          <div className="school-info">
            <h1 className="school-name">{school.name}</h1>
            <p className="school-subtitle">{school.subtitle || 'SECONDARY SCHOOL'}</p>
          </div>
        </div>

        <div className="header-center">
          <div className="report-badge">
            <span className="badge-label">NEW CURRICULUM</span>
            <h2 className="badge-title">REPORT CARD</h2>
            <span className="badge-subtitle">Competency Based Assessment</span>
          </div>
        </div>

        <div className="header-right">
          <div className="term-info">
            <span className="term-badge">{school.term || 'TERM 1'}</span>
            <span className="year-badge">{school.year || '2026'}</span>
          </div>
        </div>
      </div>

      <div className="header-contacts">
        <span className="contact-item">
          <LocationIcon />
          {school.address || 'Kayunga, Uganda'}
        </span>
        <span className="contact-divider">•</span>
        <span className="contact-item">
          <PhoneIcon />
          {school.phone || '+256 700 123456'}
        </span>
        <span className="contact-divider">•</span>
        <span className="contact-item">
          <EmailIcon />
          {school.email || 'info@school.sc.ug'}
        </span>
        <span className="contact-divider">•</span>
        <span className="contact-item">
          <WebIcon />
          {school.website || 'www.school.sc.ug'}
        </span>
      </div>
    </header>
  );
}
