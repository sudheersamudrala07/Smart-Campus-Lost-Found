import { useState } from 'react';

export default function ClaimModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({ claimant_name: '', claimant_admission: '', claimant_contact: '', proof_description: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/claims/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, ...form })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not submit the claim request.');
      onSuccess(result.message);
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  const update = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-lg">
        <div className="modal-header">
          <div>
            <h2>Request to claim this item</h2>
            <p className="modal-subtext">{item.name} · {item.location}</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>Your request will remain pending until campus staff reviews the ownership details.</p>
          <form onSubmit={submit} className="claim-form">
            <label>Full name<input required minLength="2" maxLength="120" value={form.claimant_name} onChange={update('claimant_name')} /></label>
            <label>Student ID or admission number<input required minLength="2" maxLength="100" value={form.claimant_admission} onChange={update('claimant_admission')} /></label>
            <label>Contact email or phone<input maxLength="255" value={form.claimant_contact} onChange={update('claimant_contact')} /></label>
            <label>Ownership details<textarea required minLength="8" maxLength="2000" rows="4" placeholder="Describe identifying details that only the owner would know." value={form.proof_description} onChange={update('proof_description')} /></label>
            {error && <p role="alert" className="form-error">{error}</p>}
            <div className="form-actions-row">
              <button type="button" className="cancel-btn" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="submit-tx-btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Submit request'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
