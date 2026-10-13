import { useState } from 'react';

export default function AccountAccess({ user, onChange }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not sign in.');
      onChange(result.user);
      setPassword('');
      setMessage(`Signed in as ${result.user.role}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    onChange(null);
    setMessage('You have signed out.');
  }

  return (
    <section className="account-access" aria-label="Account access">
      {user ? (
        <div className="account-summary">
          <span>Signed in as <strong>{user.name}</strong> ({user.role})</span>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      ) : (
        <form className="account-form" onSubmit={submit}>
          <strong>{mode === 'register' ? 'Create a student account' : 'Sign in to submit a report or claim'}</strong>
          {mode === 'register' && (
            <input aria-label="Full name" autoComplete="name" required minLength="2" maxLength="120" placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} />
          )}
          <input aria-label="Email" autoComplete="email" type="email" required maxLength="254" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input aria-label="Password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} type="password" required minLength="12" maxLength="200" placeholder="Password (at least 12 characters)" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
          <button type="button" className="account-mode-toggle" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? 'Already registered? Sign in' : 'New here? Create an account'}
          </button>
        </form>
      )}
      <p className="account-privacy-note">Reports show the reporter's name only. Use private chat to contact them; email, phone, and student ID are not shown on reports.</p>
      {message && <p className="account-message" role="status">{message}</p>}
    </section>
  );
}
