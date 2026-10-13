import { useCallback, useEffect, useState } from 'react';

export default function ChatModal({ item, user, onClose }) {
  const [threads, setThreads] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const loadMessages = useCallback(async (id) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/conversations/${id}/messages`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not load messages.');
      setMessages(result.data || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/items/${item.id}/conversations`, { method: 'POST' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not open private chat.');
        if (!active) return;
        setThreads(result.conversations || []);
        if (result.conversations?.[0]) setConversationId(result.conversations[0].conversation_id);
      })
      .catch((openError) => { if (active) setError(openError.message); });
    return () => { active = false; };
  }, [item.id]);

  useEffect(() => {
    loadMessages(conversationId);
    if (!conversationId) return undefined;
    const timer = window.setInterval(() => loadMessages(conversationId), 4000);
    return () => window.clearInterval(timer);
  }, [conversationId, loadMessages]);

  async function send(event) {
    event.preventDefault();
    if (!conversationId || !body.trim()) return;
    const text = body.trim();
    setBody('');
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not send message.');
      await loadMessages(conversationId);
    } catch (sendError) {
      setError(sendError.message);
      setBody(text);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-box private-chat" aria-label="Private chat">
        <header className="modal-header">
          <div><h2>Private chat</h2><p className="modal-subtext">{item.name} · visible only to you and the reporter</p></div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close chat">✕</button>
        </header>
        <div className="modal-body">
          {item.isOwner && threads.length > 0 && (
            <label className="chat-thread-picker">Conversation with
              <select value={conversationId || ''} onChange={(event) => setConversationId(Number(event.target.value))}>
                {threads.map((thread) => <option key={thread.conversation_id} value={thread.conversation_id}>{thread.other_name}</option>)}
              </select>
            </label>
          )}
          {item.isOwner && threads.length === 0 && <p>No one has started a conversation about this report yet.</p>}
          {!item.isOwner && <p className="chat-intro">Your messages go privately to {item.studentName || 'the reporter'}.</p>}
          <div className="chat-messages" aria-live="polite">
            {messages.map((message) => (
              <article key={message.message_id} className={`chat-message ${Number(message.sender_user_id) === Number(user.user_id) ? 'mine' : ''}`}>
                <strong>{message.sender_name}</strong><p>{message.body}</p>
                <time>{new Date(message.created_at).toLocaleString()}</time>
              </article>
            ))}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {conversationId && (
            <form className="chat-compose" onSubmit={send}>
              <textarea value={body} maxLength="2000" rows="2" required placeholder="Write a private message…" onChange={(event) => setBody(event.target.value)} />
              <button type="submit" disabled={!body.trim()}>Send</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
