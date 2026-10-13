import React from "react";

/**
 * ============================================================================
 * Staff claim review queue.
 * ============================================================================
 * Displays submitted requests for staff review.
 * ============================================================================
 */
function ClaimsView({ claims, items, onOpenClaimModal, onRefresh, onReviewClaim }) {
  return (
    <div className="claims-view-container">
      <div className="section-heading-card">
        <div>
          <h2>🤝 Claim review queue</h2>
          <p className="section-subtext">
            Review ownership details before approving a request. Approved claims mark the item as returned.
          </p>
        </div>
        <div className="heading-actions">
          <button type="button" className="refresh-btn" onClick={onRefresh} title="Refresh Claims">
            🔄
          </button>
        </div>
      </div>

      {/* Available items for claim */}
      <div className="unclaimed-items-banner">
        <div className="banner-title">
          <span>⚡ Items available for a claim request:</span>
        </div>
        <div className="unclaimed-pills-row">
          {items.filter(i => i.status !== "Claimed").slice(0, 5).map(item => (
            <button
              key={item.id}
              type="button"
              className="unclaimed-item-pill"
              onClick={() => onOpenClaimModal(item)}
            >
              #{item.id} {item.name} ({item.branch}) &rarr;
            </button>
          ))}
        </div>
      </div>

      {/* Claims Table */}
      <div className="claims-table-card">
        <h3>Submitted requests</h3>
        {claims.length === 0 ? (
          <div className="state-message empty-message">
            <p>No claim verification records submitted yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sql-result-table">
              <thead>
                <tr>
                  <th>Claim ID (PK)</th>
                  <th>Target Item (FK)</th>
                  <th>Claimant Name</th>
                  <th>Roll / Admission No</th>
                  <th>Contact Info</th>
                  <th>Ownership Proof Description</th>
                  <th>Verification Status</th>
                  <th>Submitted At</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.claim_id}>
                    <td><strong>#{claim.claim_id}</strong></td>
                    <td>
                      <span className="item-fk-badge">
                        #{claim.item_id} — {claim.item_name}
                      </span>
                    </td>
                    <td><strong>{claim.claimant_name}</strong></td>
                    <td><code>{claim.claimant_admission}</code></td>
                    <td>{claim.claimant_contact}</td>
                    <td className="proof-cell">{claim.proof_description}</td>
                    <td>
                      <span className={`status-pill pill-${claim.status.toLowerCase()}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td>{new Date(claim.created_at).toLocaleDateString()}</td>
                    <td>
                      {claim.status === 'Pending' ? (
                        <div className="claim-review-actions">
                          <button type="button" onClick={() => onReviewClaim(claim.claim_id, 'Approved')}>Approve</button>
                          <button type="button" onClick={() => onReviewClaim(claim.claim_id, 'Rejected')}>Reject</button>
                        </div>
                      ) : 'Reviewed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClaimsView;
