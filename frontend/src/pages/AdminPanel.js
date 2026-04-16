import React, { useEffect, useState } from 'react';
import { getAdminPanel } from '../services/authService';

function AdminPanel({ token }) {
  const [panelData, setPanelData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminPanel(token);
        setPanelData(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load admin panel');
      }
    };

    load();
  }, [token]);

  if (error) return <p className="error">{error}</p>;
  if (!panelData) return <p className="loading">Loading admin panel...</p>;

  return (
    <div className="admin-shell">
      <section className="admin-hero panel-page">
        <p className="section-kicker">Control Center</p>
        <h2>Admin Panel</h2>
        <p className="admin-subtitle">Manage platform operations with a clean, high-visibility dashboard.</p>
        <div className="admin-role-pill">Role: {panelData.role}</div>
      </section>

      <section className="admin-features panel-page">
        <h3>Access & Features</h3>
        <div className="admin-feature-grid">
          {panelData.features.map((feature) => (
            <article key={feature} className="admin-feature-card">
              <span className="admin-feature-dot" />
              <p>{feature}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminPanel;
