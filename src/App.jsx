import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import ItemCard from "./ItemCard";
import "./App.css";

// Function declaration: function greet(name) { return `Welcome, ${name}!`; }
// Function expression: const format = function (value) { return value.toUpperCase(); };
// Arrow function: const add = (first, second) => first + second;

function App() {
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Laptop",
      location: "CSE Block",
      status: "Lost",
      studentName: "Ananya Sharma",
      branch: "CSE",
      admissionNumber: "CSE2024001",
    },
    {
      id: 2,
      name: "Wallet",
      location: "Library",
      status: "Found",
      studentName: "Rahul Verma",
      branch: "ECE",
      admissionNumber: "ECE2024014",
    },
    {
      id: 3,
      name: "ID Card",
      location: "Auditorium",
      status: "Lost",
      studentName: "Meera Nair",
      branch: "IT",
      admissionNumber: "IT2024022",
    },
  ]);
  // useState stores values that change and trigger a re-render.
  const [count, setCount] = useState(0);
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "", status: "Lost", studentName: "", branch: "", admissionNumber: "" });

  // useEffect fetches API data after the component is rendered.
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/todos?_limit=3")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load API data");
        return response.json();
      })
      .then((data) => {
        const englishTitles = {
          1: "Select an item automatically",
          2: "Choose a convenient and helpful option",
          3: "Request fewer updates",
        };
        setTips(data.map((tip) => ({ ...tip, title: englishTitles[tip.id] || tip.title })));
      })
      .catch(() => setTips([]))
      .finally(() => setIsLoading(false));
  }, []);

  // DOM selector example: document.querySelector("#dom-button").
  // Multiple selector example: document.querySelectorAll(".demo-button").
  // Native event example: element.addEventListener("click", handler).
  // React event handling uses onChange, onSubmit, and onClick in the JSX below.
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) return;
    if (!formData.studentName.trim() || !formData.branch.trim() || !formData.admissionNumber.trim()) return;
    const updatedItem = { id: editingId || Date.now(), name: formData.name.trim(), location: formData.location.trim(), status: formData.status, studentName: formData.studentName.trim(), branch: formData.branch.trim(), admissionNumber: formData.admissionNumber.trim() };
    setItems((currentItems) => editingId ? currentItems.map((item) => item.id === editingId ? updatedItem : item) : [...currentItems, updatedItem]);
    setSelectedItem(editingId ? updatedItem : null);
    setEditingId(null);
    setFormData({ name: "", location: "", status: "Lost", studentName: "", branch: "", admissionNumber: "" });
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({ name: item.name, location: item.location, status: item.status, studentName: item.studentName, branch: item.branch, admissionNumber: item.admissionNumber });
  };

  const handleReview = (item) => {
    setCount((currentCount) => currentCount + 1);
    setSelectedItem(item);
  };

  return (
    <div className="app-shell">
      <Navbar />
      <main className="dashboard">
        <section className="intro">
          <div><h1>Lost & Found Dashboard</h1><p>Report and review items across campus.</p></div>
          <div className="counter-panel"><span>Items reviewed</span><strong>{count}</strong><button type="button" onClick={() => setCount((currentCount) => currentCount + 1)}>Review an item</button></div>
        </section>
        <section className="content-grid">
          <form className="report-form" onSubmit={handleSubmit}>
            {/* Controlled form: React state owns each input value. */}
            <h2>{editingId ? "Edit report" : "Report an item"}</h2>
            <label>Item name<input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Blue backpack" required /></label>
            <label>Last seen location<input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Science block" required /></label>
            <label>Student name<input name="studentName" value={formData.studentName} onChange={handleInputChange} placeholder="e.g. Ananya Sharma" required /></label>
            <label>Branch<input name="branch" value={formData.branch} onChange={handleInputChange} placeholder="e.g. CSE" required /></label>
            <label>Admission number<input name="admissionNumber" value={formData.admissionNumber} onChange={handleInputChange} placeholder="e.g. CSE2024001" required /></label>
            <label>Status<select name="status" value={formData.status} onChange={handleInputChange}><option value="Lost">Lost</option><option value="Found">Found</option></select></label>
            <button className="primary-button" type="submit">{editingId ? "Save changes" : "Add report"}</button>
          </form>
          <section className="items-section">
            {/* Props pass item data and the review callback to ItemCard. */}
            <div className="section-heading"><div><h2>Recent reports</h2></div><span>{items.length} items</span></div>
            {/* map() creates one ItemCard for every item in the list. */}
            <div className="item-list">{items.map((item) => <ItemCard key={item.id} item={item} onReview={handleReview} onEdit={handleEdit} />)}</div>
            {selectedItem && <section className="review-panel"><div className="section-heading"><h2>Report details</h2><button type="button" onClick={() => setSelectedItem(null)} aria-label="Close report details">Close</button></div><dl><div><dt>Item</dt><dd>{selectedItem.name}</dd></div><div><dt>Location</dt><dd>{selectedItem.location}</dd></div><div><dt>Student</dt><dd>{selectedItem.studentName}</dd></div><div><dt>Branch</dt><dd>{selectedItem.branch}</dd></div><div><dt>Admission no.</dt><dd>{selectedItem.admissionNumber}</dd></div><div><dt>Status</dt><dd>{selectedItem.status}</dd></div></dl></section>}
          </section>
        </section>
        <section className="api-panel"><div><h2>Campus service updates</h2></div>{isLoading ? <p>Loading updates...</p> : tips.length === 0 ? <p>Updates are unavailable right now.</p> : <ul>{tips.map((tip) => <li key={tip.id}>{tip.title}</li>)}</ul>}</section>
      </main>
    </div>
  );
}

export default App;