import React, { useEffect, useState, useCallback } from "react";
import Navbar from "./Navbar";
import AccountAccess from "./AccountAccess";
import ChatModal from "./ChatModal";
import ItemCard from "./ItemCard";
import ClaimModal from "./ClaimModal";
import CategoryManager from "./CategoryManager";
import ClaimsView from "./ClaimsView";
import AuditLogsView from "./AuditLogsView";
import "./App.css";

/**
 * ============================================================================
 * SMART CAMPUS LOST & FOUND APPLICATION
 * ============================================================================
 * React client for the Smart Campus Lost & Found service.
 * ============================================================================
 */
function App() {
  // Main application sections.
  const [activeTab, setActiveTab] = useState("items");

  // Core Data State
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [claims, setClaims] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  const [user, setUser] = useState(null);

  // Loading & Alerts
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Form & Editing state
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [claimTargetItem, setClaimTargetItem] = useState(null);
  const [chatTargetItem, setChatTargetItem] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    status: "Lost",
    studentName: "",
    branch: "CSE",
    admissionNumber: "",
    contactInfo: "",
    category_id: "1",
    estimated_value: "25.00"
  });

  // Notification Toast Helper
  const notify = (msg, type = "success") => {
    setAlertMessage({ text: msg, type });
    setTimeout(() => setAlertMessage(null), 3800);
  };

  // Fetch Database Health Status
  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/db-status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      setDbStatus({ connected: false, mode: "Resilient In-Memory Relational Engine" });
    }
  }, []);

  // Fetch Categories (1:N Relational Parents)
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch Claims (1:N Relational Children)
  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch("/api/claims");
      if (res.ok) {
        const json = await res.json();
        setClaims(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load administrator activity history
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch Items with Search & Filters
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (branchFilter !== "All") params.append("branch", branchFilter);
      if (categoryFilter !== "All") params.append("categoryId", categoryFilter);

      const res = await fetch(`/api/items?${params.toString()}`);
      if (!res.ok) throw new Error("Could not retrieve reports from server");
      const json = await res.json();
      setItems(json.data || []);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, branchFilter, categoryFilter]);

  // Initial load
  useEffect(() => {
    fetch('/api/auth/me').then((response) => response.json()).then((result) => setUser(result.user || null)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchDbStatus();
  }, [fetchItems, fetchCategories, fetchClaims, fetchAuditLogs, fetchDbStatus]);

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchCategories();
    }
    if (user?.role === 'admin') {
      fetchClaims();
      fetchAuditLogs();
    } else {
      fetchItems();
      fetchCategories();
      setClaims([]);
      setAuditLogs([]);
    }
  }, [user, fetchItems, fetchCategories, fetchClaims, fetchAuditLogs]);

  // Form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Report (INSERT / UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      notify("Please provide an item name and location", "error");
      return;
    }

    const reportData = editingId ? {
      name: formData.name,
      location: formData.location,
      status: formData.status,
      branch: formData.branch,
      category_id: formData.category_id,
      estimated_value: formData.estimated_value
    } : formData;

    try {
      if (editingId) {
        // DML UPDATE
        const res = await fetch(`/api/items/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportData)
        });
        if (!res.ok) throw new Error("Failed to update report");
        const result = await res.json();
        notify(`Report for '${formData.name}' updated!`);
        if (selectedItem?.id === editingId) setSelectedItem(result.data);
      } else {
        // DML INSERT INTO
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportData)
        });
        if (!res.ok) throw new Error("Failed to submit new report");
        await res.json();
        notify(`Report for '${formData.name}' recorded in database!`);
      }

      // Reset form
      setEditingId(null);
      setFormData({
        name: "",
        location: "",
        status: "Lost",
        studentName: "",
        branch: "CSE",
        admissionNumber: "",
        contactInfo: "",
        category_id: categories[0]?.category_id ? String(categories[0].category_id) : "1",
        estimated_value: "25.00"
      });
      fetchItems();
      fetchAuditLogs();
      fetchCategories();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Edit action
  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      location: item.location,
      status: item.status,
      studentName: item.studentName,
      branch: item.branch || "CSE",
      admissionNumber: item.admissionNumber || "",
      contactInfo: item.contactInfo || "",
      category_id: item.category_id ? String(item.category_id) : "1",
      estimated_value: String(item.estimated_value || "25.00")
    });
    window.scrollTo({ top: 220, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      location: "",
      status: "Lost",
      studentName: "",
      branch: "CSE",
      admissionNumber: "",
      contactInfo: "",
      category_id: "1",
      estimated_value: "25.00"
    });
  };

  // Delete action (DML DELETE)
  const handleDelete = async (id, itemName) => {
    if (!window.confirm(`Permanently remove report for "${itemName}"? Associated claim requests will be deleted via ON DELETE CASCADE.`)) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete report");
      notify(`Report for "${itemName}" deleted.`);
      if (selectedItem?.id === id) setSelectedItem(null);
      fetchItems();
      fetchClaims();
      fetchAuditLogs();
      fetchCategories();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Quick 1-click status update
  const handleToggleStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      notify(`Status updated to "${newStatus}"!`);
      fetchItems();
      fetchAuditLogs();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Metrics
  const lostCount = items.filter((i) => i.status === "Lost").length;
  const foundCount = items.filter((i) => i.status === "Found").length;
  const claimedCount = items.filter((i) => i.status === "Claimed").length;

  return (
    <div className="app-shell">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        user={user}
      />

      <main className="dashboard">
        <AccountAccess user={user} onChange={(nextUser) => { setUser(nextUser); if (!nextUser) { setActiveTab('items'); setChatTargetItem(null); setClaimTargetItem(null); } }} />
        {/* Floating feedback alert */}
        {alertMessage && (
          <div className={`notification-toast toast-${alertMessage.type}`}>
            <span>{alertMessage.text}</span>
            <button onClick={() => setAlertMessage(null)}>✕</button>
          </div>
        )}

        {/* Hero Section & Metrics */}
        <section className="intro">
          <div>
            <p className="eyebrow">Smart Campus Welfare & Recovery Portal</p>
            <h1>Campus Lost & Found System</h1>
            <p>
              Integrated full-stack system powered by Express.js REST API and MySQL relational database.
            </p>
          </div>

          <div className="stats-row">
            <div className="stat-card" onClick={() => { setActiveTab("items"); setStatusFilter("All"); }} style={{ cursor: "pointer" }}>
              <span>Total Reports</span>
              <strong>{items.length}</strong>
            </div>
            <div className="stat-card stat-lost" onClick={() => { setActiveTab("items"); setStatusFilter("Lost"); }} style={{ cursor: "pointer" }}>
              <span>Lost Items</span>
              <strong>{lostCount}</strong>
            </div>
            <div className="stat-card stat-found" onClick={() => { setActiveTab("items"); setStatusFilter("Found"); }} style={{ cursor: "pointer" }}>
              <span>Found Items</span>
              <strong>{foundCount}</strong>
            </div>
            <div className="stat-card stat-claimed" onClick={() => { setActiveTab("items"); setStatusFilter("Claimed"); }} style={{ cursor: "pointer" }}>
              <span>Claimed</span>
              <strong>{claimedCount}</strong>
            </div>
            <div className="stat-card stat-claims-count" onClick={() => setActiveTab("claims")} style={{ cursor: "pointer" }}>
              <span>Claims Filed</span>
              <strong>{claims.length}</strong>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* TAB 1: REPORTS HUB (MAIN ITEMS CATALOG & REPORT FORM) */}
        {/* ================================================================ */}
        {activeTab === "items" && (
          <>
            {/* Search & Filter Control Panel */}
            <section className="filter-panel">
              <div className="search-bar-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by item name, location, student name, or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="clear-search-btn">
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-controls-row">
                <div className="filter-tabs">
                  <span className="filter-label">Status:</span>
                  {["All", "Lost", "Found", "Claimed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`tab-btn ${statusFilter === st ? "tab-active" : ""}`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="select-filters-group">
                  <div className="select-filter-wrap">
                    <label htmlFor="cat-filter">Category:</label>
                    <select
                      id="cat-filter"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="select-filter-wrap">
                    <label htmlFor="branch-select">Department:</label>
                    <select
                      id="branch-select"
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                    >
                      <option value="All">All Departments</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="IT">IT</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="EEE">EEE</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Content Grid: Form (Left) & Items List (Right) */}
            <section className="content-grid">
              {/* Report Form */}
              <form className="report-form" onSubmit={handleSubmit}>
                <div className="form-header">
                  <h2>{editingId ? "Edit Item Report" : "Report an Item"}</h2>
                  {editingId && (
                    <button type="button" onClick={handleCancelEdit} className="cancel-edit-btn">
                      Cancel
                    </button>
                  )}
                </div>

                <label>
                  Item Name <span className="req">*</span>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. MacBook Air, Blue Backpack"
                    required
                  />
                </label>

                <div className="form-row-2">
                  <label>
                    Category (1:N Link)
                    <select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Estimated Value ($)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="estimated_value"
                      value={formData.estimated_value}
                      onChange={handleInputChange}
                      placeholder="25.00"
                    />
                  </label>
                </div>

                <label>
                  Last Seen / Found Location <span className="req">*</span>
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Central Library 2nd Floor, Room 302"
                    required
                  />
                </label>

                <label>
                  Student Name <span className="req">*</span>
                  <input
                    name="studentName"
                    value={user?.name || formData.studentName}
                    onChange={handleInputChange}
                    readOnly
                    placeholder="e.g. Ananya Sharma"
                    required
                  />
                </label>

                <div className="form-row-2">
                  <label>
                    Department
                    <select name="branch" value={formData.branch} onChange={handleInputChange}>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="IT">IT</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="EEE">EEE</option>
                    </select>
                  </label>

                  <label>
                    Status
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="Lost">Lost</option>
                      <option value="Found">Found</option>
                    </select>
                  </label>
                </div>

                <button className="primary-button" type="submit">
                  {editingId ? "Save report changes" : "Submit report"}
                </button>
              </form>

              {/* Items List */}
              <section className="items-section">
                <div className="section-heading">
                  <div>
                    <h2>Campus Item Reports</h2>
                    <p className="section-subtext">Search and browse campus property reports.</p>
                  </div>
                  <div className="heading-actions">
                    <span className="items-count-badge">{items.length} records</span>
                    <button type="button" onClick={fetchItems} className="refresh-btn" title="Refresh records">
                      🔄
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="state-message">
                    <div className="spinner"></div>
                    <p>Loading reports from MySQL...</p>
                  </div>
                ) : apiError ? (
                  <div className="state-message error-message">
                    <p>⚠️ {apiError}</p>
                    <button onClick={fetchItems} className="primary-button" style={{ maxWidth: "200px", margin: "10px auto" }}>
                      Retry
                    </button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="state-message empty-message">
                    <p>No reports match your current search and filter criteria.</p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("All");
                        setBranchFilter("All");
                        setCategoryFilter("All");
                      }}
                      className="tab-btn"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="item-list">
                    {items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onReview={(i) => { setReviewCount(c => c + 1); setSelectedItem(i); }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        onOpenClaim={(i) => setClaimTargetItem(i)}
                        onOpenChat={(i) => setChatTargetItem(i)}
                        isAdmin={user?.role === 'admin'}
                        isSignedIn={Boolean(user)}
                      />
                    ))}
                  </div>
                )}

                {/* Details Drawer */}
                {selectedItem && (
                  <section className="review-panel">
                    <div className="section-heading">
                      <h2>Report Inspection (#{selectedItem.id})</h2>
                      <button type="button" onClick={() => setSelectedItem(null)} aria-label="Close details">
                        Close ✕
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>Item Name</dt>
                        <dd>{selectedItem.name}</dd>
                      </div>
                      <div>
                        <dt>Category</dt>
                        <dd>{selectedItem.category_icon} {selectedItem.category_name || "General"}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{selectedItem.location}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>
                          <span className={`status status-${selectedItem.status.toLowerCase()}`}>
                            {selectedItem.status}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Reported By</dt>
                        <dd>{selectedItem.studentName || "Campus member"}</dd>
                      </div>
                      <div>
                        <dt>Department</dt>
                        <dd>{selectedItem.branch || "General"}</dd>
                      </div>
                      <div>
                        <dt>Admission No.</dt>
                        <dd>{user?.role === 'admin' ? (selectedItem.admissionNumber || "N/A") : "Private"}</dd>
                      </div>
                      <div>
                        <dt>Estimated Value</dt>
                        <dd>${Number(selectedItem.estimated_value || 0).toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt>Contact</dt>
                        <dd>{user?.role === 'admin' ? (selectedItem.contactInfo || "N/A") : "Private"}</dd>
                      </div>
                    </dl>
                  </section>
                )}
              </section>
            </section>
          </>
        )}

        {/* ================================================================ */}
        {/* TAB 2: CATEGORIES (1:N RELATIONAL STRUCTURE) */}
        {/* ================================================================ */}
        {activeTab === "categories" && (
          <CategoryManager
            categories={categories}
            onRefresh={fetchCategories}
            notify={notify}
            user={user}
          />
        )}

        {/* ================================================================ */}
        {/* Administrator claim review */}
        {/* ================================================================ */}
        {activeTab === "claims" && (
          <ClaimsView
            claims={claims}
            items={items}
            onOpenClaimModal={(item) => setClaimTargetItem(item)}
            onRefresh={fetchClaims}
            onReviewClaim={async (claimId, decision) => {
              try {
                const response = await fetch(`/api/claims/${claimId}/review`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ decision })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Could not review claim.');
                notify(result.message);
                fetchItems();
                fetchClaims();
                fetchAuditLogs();
              } catch (error) {
                notify(error.message, 'error');
              }
            }}
          />
        )}

        {/* ================================================================ */}
        {/* Administrator activity history */}
        {/* ================================================================ */}
        {activeTab === "audit" && (
          <AuditLogsView
            logs={auditLogs}
            onRefresh={fetchAuditLogs}
          />
        )}

        {/* Claim request form */}
        {claimTargetItem && (
          <ClaimModal
            item={claimTargetItem}
            onClose={() => setClaimTargetItem(null)}
            onSuccess={(message) => {
              notify(message);
              fetchItems();
              if (user?.role === 'admin') {
                fetchClaims();
                fetchAuditLogs();
              }
            }}
          />
        )}
        {chatTargetItem && user && (
          <ChatModal item={chatTargetItem} user={user} onClose={() => setChatTargetItem(null)} />
        )}
      </main>
    </div>
  );
}

export default App;
