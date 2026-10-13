import React, { useState } from "react";

/**
 * ============================================================================
 * Manage the categories used to organize reports.
 * ============================================================================
 */
function CategoryManager({ categories, onRefresh, notify, user }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", icon: "📦" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const iconOptions = ["💻", "💳", "📚", "🎒", "🔬", "📱", "🔑", "🧢", "⚽", "🚲"];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notify("Category name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create category");

      notify(`Category "${formData.name}" created successfully!`);
      setFormData({ name: "", description: "", icon: "📦" });
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"? Existing reports will remain uncategorized.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${category.category_id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete category");

      notify("Category deleted. Existing reports were kept.");
      onRefresh();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="category-manager-container">
      <div className="section-heading-card">
        <div>
          <h2>Manage categories</h2>
          <p className="section-subtext">
            Keep the report categories clear and useful for students searching campus property.
          </p>
        </div>
        {user?.role === 'admin' && <button
          type="button"
          className="primary-button add-cat-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >{showAddForm ? "Close Form" : "+ New Category"}</button>}
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="category-create-form">
          <h3>Create a category</h3>
          <div className="form-grid-3">
            <label>
              Icon
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              >
                {iconOptions.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            </label>

            <label className="col-span-2">
              Category Name <span className="req">*</span>
              <input
                type="text"
                required
                placeholder="e.g. Sports & Fitness Equipment"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              rows="2"
              placeholder="e.g. Gym accessories, badminton rackets, sports gear found across athletic grounds."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </label>

          <div className="form-btn-row">
            <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save Category"}
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      <div className="categories-cards-grid">
        {categories.map((cat) => (
          <div key={cat.category_id} className="category-card">
            <div className="cat-card-header">
              <span className="cat-icon-badge">{cat.icon || "📦"}</span>
              <span className="cat-items-badge">
                {cat.item_count || 0} {cat.item_count === 1 ? "item" : "items"}
              </span>
            </div>
            <h3 className="cat-title">{cat.name}</h3>
            <p className="cat-desc">{cat.description || "No description provided."}</p>

            <div className="cat-meta-footer">
                    {user?.role === 'admin' && <button
                type="button"
                className="cat-delete-btn"
                onClick={() => handleDelete(cat)}
                title="Delete category"
                    >🗑️</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryManager;
