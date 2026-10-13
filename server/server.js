/**
 * ============================================================================
 * SMART CAMPUS LOST & FOUND - EXPRESS.JS BACKEND SERVER (server.js)
 * ============================================================================
 * REST API for campus lost-item reports, claims, accounts, and private messages.
 * ============================================================================
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  initDatabaseConnection,
  getDatabaseStatus,
  getAllCategories,
  createCategory,
  deleteCategory,
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  submitClaimTransaction,
  reviewClaim,
  getAllClaims,
  getAuditLogs,
  createUser,
  verifyUserPassword,
  ensureAdminAccount,
  openItemConversation,
  getConversationMessages,
  sendConversationMessage
} from './db.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const projectDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(projectDir, '../dist');

// Middleware
app.use(express.json({ limit: '100kb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.disable('x-powered-by');

const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'local-development-session-secret');
const sessionCookie = 'campus_session';
const authAttempts = new Map();
const registrationAttempts = new Map();

function signSession(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 12
  })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSession(req) {
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`));
  if (!cookie) return null;
  const token = cookie.slice(sessionCookie.length + 1);
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', sessionSecret).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return { user_id: data.sub, name: data.name, email: data.email, role: data.role };
  } catch { return null; }
}

function requireAuth(req, res, next) {
  req.user = readSession(req);
  if (!req.user) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Administrator access is required.' });
  next();
}

function toPublicItem(item, user) {
  if (!item) return item;
  const { contactInfo, admissionNumber, reported_by_user_id, ...publicItem } = item;
  return {
    ...publicItem,
    isOwner: Boolean(user && Number(user.user_id) === Number(reported_by_user_id)),
    chatAvailable: Boolean(reported_by_user_id)
  };
}

async function requireReportOwnerOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  if (req.user.role === 'admin') return next();
  try {
    const item = await getItemById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (Number(item.reported_by_user_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ success: false, message: 'You can only manage reports you submitted.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// The API and built frontend share one origin in production.
if (process.env.NODE_ENV === 'production') {
  if (!sessionSecret || sessionSecret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters in production.');
  app.use(express.static(frontendDist, { index: false, maxAge: '1y', immutable: true }));
}

// Account access
app.get('/api/auth/me', (req, res) => {
  const user = readSession(req);
  res.json({ success: true, user });
});

app.post('/api/auth/register', async (req, res) => {
  const clientKey = req.ip || 'unknown';
  const recentAttempts = (registrationAttempts.get(clientKey) || []).filter((time) => Date.now() - time < 60 * 60 * 1000);
  if (recentAttempts.length >= 5) return res.status(429).json({ success: false, message: 'Too many account creation attempts. Try again later.' });
  registrationAttempts.set(clientKey, [...recentAttempts, Date.now()]);
  try {
    const user = await createUser({ ...req.body, role: 'student' });
    const token = signSession(user);
    res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.code === 'ER_DUP_ENTRY' ? 'An account with this email already exists.' : error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const clientKey = req.ip || 'unknown';
  const recentAttempts = authAttempts.get(clientKey) || [];
  const activeAttempts = recentAttempts.filter((time) => Date.now() - time < 15 * 60 * 1000);
  if (activeAttempts.length >= 10) return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Try again later.' });
  try {
    const user = await verifyUserPassword(req.body?.email, req.body?.password);
    if (!user) {
      authAttempts.set(clientKey, [...activeAttempts, Date.now()]);
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    }
    authAttempts.delete(clientKey);
    const token = signSession(user);
    res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.json({ success: true, user });
  } catch (error) {
    res.status(503).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ success: true });
});

// Database health check
app.get('/api/db-status', async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    res.json({ success: true, connected: status.connected, mode: status.connected ? 'Database connected' : 'Temporary development data' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Categories API (1:N Relational Parent)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const newCategory = await createCategory(req.body);
    res.status(201).json({ success: true, message: "Category created", data: newCategory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, message: "Category deleted (Items preserved via ON DELETE SET NULL)", data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Lost & Found Items CRUD API
app.get('/api/items', async (req, res) => {
  try {
    const { status, search, branch, categoryId } = req.query;
    const records = await getAllItems({ status, search, branch, categoryId });
    const session = readSession(req);
    const items = records.map((item) => toPublicItem(item, session));
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await getItemById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: `Report #${req.params.id} not found` });
    const session = readSession(req);
    const publicItem = toPublicItem(item, session);
    res.status(200).json({ success: true, data: publicItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/items', requireAuth, async (req, res) => {
  try {
    const newItem = await createItem({ ...req.body, studentName: req.user.name }, req.user.user_id);
    res.status(201).json({ success: true, message: "Report submitted successfully", data: toPublicItem(newItem, req.user) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/items/:id', requireAuth, requireReportOwnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.body?.status === 'Claimed') {
      return res.status(403).json({ success: false, message: 'Only campus staff can mark an item as claimed.' });
    }
    const updated = await updateItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: `Report #${req.params.id} not found` });
    res.status(200).json({ success: true, message: `Report #${req.params.id} updated successfully`, data: toPublicItem(updated, req.user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/items/:id', requireAuth, requireReportOwnerOrAdmin, async (req, res) => {
  try {
    const deleted = await deleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: `Report #${req.params.id} not found` });
    res.status(200).json({ success: true, message: `Report #${req.params.id} deleted successfully`, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Claim submission and staff review
app.get('/api/claims', requireAuth, requireAdmin, async (req, res) => {
  try {
    const claims = await getAllClaims();
    res.status(200).json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/claims/submit', requireAuth, async (req, res) => {
  try {
    const result = await submitClaimTransaction(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json(err);
  }
});

app.patch('/api/claims/:id/review', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await reviewClaim(req.params.id, req.body?.decision);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/api/items/:id/conversations', requireAuth, async (req, res) => {
  try {
    const result = await openItemConversation(req.params.id, req.user.user_id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const messages = await getConversationMessages(req.params.id, req.user.user_id);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const result = await sendConversationMessage(req.params.id, req.user.user_id, req.body?.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const logs = await getAuditLogs();
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve the single-page client in production and return a useful API 404.
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  if (process.env.NODE_ENV === 'production') {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  return res.status(404).json({ success: false, message: 'Route not found' });
});

async function startServer() {
  await initDatabaseConnection();
  await ensureAdminAccount();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Campus Lost & Found API listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
