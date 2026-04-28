// pages/Settings.jsx
import React, { useState } from 'react';
import AccountSettings from '../components/settings/AccountSettings';
import BusinessSettings from '../components/settings/BusinessSettings';
import PaymentBilling from '../components/settings/PaymentBilling';
import UserRoleManagement from '../components/settings/UserRoleManagement';
import Integrations from '../components/settings/Integrations';
import AppearanceCustomization from '../components/settings/AppearanceCustomization';
import DataPrivacy from '../components/settings/DataPrivacy';
import AdvancedSettings from '../components/settings/AdvancedSettings';

const sections = [
  { id: 1, title: "Account Settings", description: "Profile, security, and notifications", component: AccountSettings },
  { id: 2, title: "Business Settings", description: "Business profile, operating hours, tax & compliance", component: BusinessSettings },
  { id: 3, title: "Payment & Billing", description: "Manage payment methods, billing info, and transactions", component: PaymentBilling },
  { id: 4, title: "User & Role Management", description: "Add/remove users, assign roles & permissions", component: UserRoleManagement },
  { id: 5, title: "Integrations", description: "Third-party apps, API keys, and webhooks", component: Integrations },
  { id: 6, title: "Appearance & Customization", description: "Themes, branding, dashboard layout", component: AppearanceCustomization },
  { id: 7, title: "Data & Privacy", description: "Data export/import, privacy settings, GDPR", component: DataPrivacy },
  { id: 8, title: "Advanced Settings", description: "Automation rules, custom fields, backup & restore", component: AdvancedSettings },
];

export default function Settings() {
  const [activeSectionId, setActiveSectionId] = useState(null);

  const activeSection = sections.find(s => s.id === activeSectionId)?.component;
  const ComponentToRender = activeSection;

  return (
    <div style={{ padding: "20px", maxWidth: "100%", overflowX: "hidden" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "10px" }}>Settings</h1>
      <p style={{ marginBottom: "20px", color: "#555" }}>Manage your system settings here.</p>

      {!ComponentToRender ? (
        <div
          className="grid-container"
          style={{
            display: "grid",
            gap: "20px",
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {sections.map(section => (
            <div
              key={section.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                backgroundColor: "#fff",
                boxSizing: "border-box",
                wordWrap: "break-word"
              }}
              onClick={() => setActiveSectionId(section.id)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>{section.title}</h2>
              <p style={{ color: "#666", fontSize: "14px" }}>{section.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setActiveSectionId(null)}
            style={{
              marginBottom: "20px",
              padding: "10px 15px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ← Back to Settings
          </button>

          {ComponentToRender && <ComponentToRender />}
        </div>
      )}

     <style>
  {`
    /* Make cards rectangular on very small screens */
@media (max-width: 479px) {
  .grid-container > div {
    width: 100% !important;
    border-radius: 6px !important; /* more rectangular */
    padding: 15px !important;
    min-height: 90px !important;  /* reduce height */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .grid-container > div h2 {
    font-size: 16px !important;
    margin-bottom: 5px !important;
  }

  .grid-container > div p {
    font-size: 13px !important;
    line-height: 1.3;
  }
}

    /* Small devices (small tablets) */
    @media (min-width: 480px) and (max-width: 719px) {
      .grid-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding-left: 8px !important;
        padding-right: 8px !important;
      }
      .grid-container > div {
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
    }

    /* Large devices */
    @media (min-width: 720px) {
      .grid-container {
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        padding-left: 0;
        padding-right: 0;
      }
    }
  `}
</style>

    </div>
  );
}
