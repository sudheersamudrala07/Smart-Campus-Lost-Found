import React from 'react';

function Navbar({ activeTab, setActiveTab, dbStatus, user }) {
  const isAdmin = user?.role === 'admin';
  return (
    <header className="navbar">
      <div className="navbar-container">
        <button type="button" className="navbar-brand" onClick={() => setActiveTab('items')}>
          <span className="logo-badge">SF</span>
          <span className="brand-text">
            <span className="brand-title">Smart Campus Lost &amp; Found</span>
            <span className="brand-subtitle">Campus property recovery</span>
          </span>
        </button>
        <nav className="navbar-app-tabs" aria-label="Main navigation">
          <button type="button" className={`app-tab-btn ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>📋 Reports</button>
          <button type="button" className={`app-tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>🏷️ Categories</button>
          {isAdmin && <button type="button" className={`app-tab-btn ${activeTab === 'claims' ? 'active' : ''}`} onClick={() => setActiveTab('claims')}>🤝 Claims</button>}
          {isAdmin && <button type="button" className={`app-tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>📜 Activity</button>}
        </nav>
        <div className="navbar-actions">
          <div className={`db-status-pill ${dbStatus?.connected ? 'status-online' : 'status-fallback'}`} title={dbStatus?.mode || 'Database status'}>
            <span className="status-dot"></span>
            <span>{dbStatus?.connected ? 'Database connected' : 'Temporary demo data'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
