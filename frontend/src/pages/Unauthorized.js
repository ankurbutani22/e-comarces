import React from 'react';
import { Link } from 'react-router-dom';

function Unauthorized() {
  return (
    <div className="unauthorized-shell">
      <div className="unauthorized-card panel-page">
        <p className="section-kicker">Access Denied</p>
        <h2>Unauthorized</h2>
        <p>You do not have permission to access this page.</p>
        <Link to="/" className="unauthorized-link">Back to Home</Link>
      </div>
    </div>
  );
}

export default Unauthorized;
