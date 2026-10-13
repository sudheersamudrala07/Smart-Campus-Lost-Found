import React from "react";

/**
 * ============================================================================
 * ITEM CARD COMPONENT
 * ============================================================================
 * Displays lost & found item details with category badge, location, student info,
 * status badge and actions appropriate to the signed-in user's role.
 * ============================================================================
 */
function ItemCard({ item, onReview, onEdit, onDelete, onToggleStatus, onOpenClaim, onOpenChat, isAdmin, isSignedIn }) {
  const getStatusClass = (status) => {
    switch (status) {
      case "Found":
        return "status status-found";
      case "Claimed":
        return "status status-claimed";
      default:
        return "status status-lost";
    }
  };

  const nextStatus = item.status === "Lost" ? "Found" : item.status === "Found" ? "Claimed" : "Lost";

  return (
    <div className="item-card">
      <div className="item-card-top">
        <div className="item-title-group">
          <div className="item-header-line">
            <h3 className="item-name">{item.name}</h3>
            <span className="category-pill" title="Report category">
              {item.category_icon || "📦"} {item.category_name || "General"}
            </span>
          </div>
          <div className="item-badges-line">
            <span className="branch-tag">{item.branch || "General"}</span>
            <span className={getStatusClass(item.status)}>{item.status}</span>
            {item.estimated_value > 0 && (
              <span className="value-tag" title="Estimated value">
                ${Number(item.estimated_value).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="item-card-details">
        <p className="item-detail-row">
          <span className="detail-icon">📍</span>
          <strong>Location:</strong> {item.location}
        </p>
        <p className="item-detail-row">
          <span className="detail-icon">👤</span>
          <strong>Reported by:</strong> {item.studentName || "Campus member"}
        </p>
      </div>

      <div className="item-card-footer">
        <div className="footer-left-actions">
          {item.status === "Claimed" ? (
            <span className="claimed-badge-label">✓ Returned</span>
          ) : isSignedIn ? (
            <button
              type="button"
              className="action-btn claim-action-btn"
              onClick={() => onOpenClaim(item)}
              title="Send a claim request for staff review"
            >
              🤝 Request claim
            </button>
          ) : <span className="claimed-badge-label">Sign in to request a claim</span>}

          {item.chatAvailable && (
            <button type="button" className="action-btn chat-action-btn" onClick={() => onOpenChat(item)} disabled={!isSignedIn} title={isSignedIn ? 'Open a private conversation' : 'Sign in to privately message the reporter'}>
              💬 {isSignedIn ? 'Private chat' : 'Sign in to chat'}
            </button>
          )}

          {isAdmin && <button
            type="button"
            className="action-btn status-toggle-btn"
            onClick={() => onToggleStatus(item.id, nextStatus)}
            title={`Toggle status to ${nextStatus}`}
          >Mark as {nextStatus}</button>}
        </div>

        <div className="footer-right-actions">
          <button
            type="button"
            onClick={() => onReview(item)}
            className="icon-action-btn view-btn"
            title="Inspect Details"
          >👁️</button>
          {(isAdmin || item.isOwner) && <button
            type="button"
            onClick={() => onEdit(item)}
            className="icon-action-btn edit-btn"
            title="Edit report"
          >✏️</button>}
          {(isAdmin || item.isOwner) && <button
            type="button"
            onClick={() => onDelete(item.id, item.name)}
            className="icon-action-btn delete-btn"
            title="Delete report"
          >🗑️</button>}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
