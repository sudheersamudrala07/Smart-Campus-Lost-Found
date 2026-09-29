import React from "react";

function ItemCard({ item, onReview, onEdit }) {
  // Props provide the item data and callback from the parent App component.
  return (
    <div
      className="item-card"
    >
      <div><h3>{item.name}</h3><p>{item.location}</p></div>
      <div className="item-meta"><span className={item.status === "Lost" ? "status status-lost" : "status status-found"}>{item.status}</span><button type="button" onClick={() => onReview(item)} aria-label={`Review ${item.name}`}>Review</button><button className="edit-button" type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} title="Edit report">✎</button></div>
    </div>
  );
}

export default ItemCard;