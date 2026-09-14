import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  readNotesMetadata,
  getNote,
  saveNote,
  deleteNote,
  getTodayDailyNote,
  getScratchpad,
  saveScratchpad
} from './storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD || process.env.PASSWORD || '';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth Middleware
function requireAuth(req, res, next) {
  if (!APP_PASSWORD) return next();
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : (req.headers['x-app-password'] || req.query.token);
  if (token === APP_PASSWORD) return next();
  return res.status(401).json({ error: 'Unauthorized: Invalid or missing password' });
}

// Health Check
app.get(['/api/health', '/note/api/health'], (req, res) => {
  res.json({ status: 'ok', service: 'pure-note', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Auth Status
app.get(['/api/auth/status', '/note/api/auth/status'], (req, res) => {
  res.json({ authRequired: Boolean(APP_PASSWORD) });
});

// Auth Verification
app.post(['/api/auth/verify', '/note/api/auth/verify'], (req, res) => {
  const { password } = req.body;
  if (!APP_PASSWORD || password === APP_PASSWORD) {
    return res.json({ valid: true });
  }
  return res.status(401).json({ valid: false, error: 'Incorrect password' });
});

// List Notes Metadata (with search & filtering)
app.get(['/api/notes', '/note/api/notes'], requireAuth, async (req, res) => {
  try {
    const { q, tag, pinned } = req.query;
    let notes = await readNotesMetadata();

    if (pinned === 'true') {
      notes = notes.filter(n => n.pinned);
    }

    if (tag) {
      notes = notes.filter(n => n.tags && n.tags.includes(tag.toLowerCase()));
    }

    if (q) {
      const query = q.toLowerCase();
      notes = notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(query)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    res.json(notes);
  } catch (err) {
    console.error('[pure-note] Failed to list notes:', err);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});

// Get or Create Today's Daily Note
app.get(['/api/notes/daily/today', '/note/api/notes/daily/today'], requireAuth, async (req, res) => {
  try {
    const note = await getTodayDailyNote();
    res.json(note);
  } catch (err) {
    console.error('[pure-note] Failed to fetch daily note:', err);
    res.status(500).json({ error: 'Failed to load daily note' });
  }
});

// Get Scratchpad
app.get(['/api/scratchpad', '/note/api/scratchpad'], requireAuth, async (req, res) => {
  try {
    const scratchpad = await getScratchpad();
    res.json(scratchpad);
  } catch (err) {
    console.error('[pure-note] Failed to load scratchpad:', err);
    res.status(500).json({ error: 'Failed to load scratchpad' });
  }
});

// Update Scratchpad
app.put(['/api/scratchpad', '/note/api/scratchpad'], requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    await saveScratchpad(content);
    res.json({ success: true });
  } catch (err) {
    console.error('[pure-note] Failed to save scratchpad:', err);
    res.status(500).json({ error: 'Failed to save scratchpad' });
  }
});

// Get Single Note by ID
app.get(['/api/notes/:id', '/note/api/notes/:id'], requireAuth, async (req, res) => {
  try {
    const note = await getNote(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    console.error('[pure-note] Failed to get note:', err);
    res.status(500).json({ error: 'Failed to retrieve note' });
  }
});

// Create Note
app.post(['/api/notes', '/note/api/notes'], requireAuth, async (req, res) => {
  try {
    const { title, content, pinned, tags } = req.body;
    const note = await saveNote({ title, content, pinned, tags });
    res.status(201).json(note);
  } catch (err) {
    console.error('[pure-note] Failed to create note:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update Note
app.put(['/api/notes/:id', '/note/api/notes/:id'], requireAuth, async (req, res) => {
  try {
    const { title, content, pinned, tags } = req.body;
    const note = await saveNote({ id: req.params.id, title, content, pinned, tags });
    res.json(note);
  } catch (err) {
    console.error('[pure-note] Failed to update note:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete Note
app.delete(['/api/notes/:id', '/note/api/notes/:id'], requireAuth, async (req, res) => {
  try {
    const success = await deleteNote(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('[pure-note] Failed to delete note:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use('/note', express.static(distPath));

  app.get(['/', '/note', '/note/*'], (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Pure-Note] Server running on port ${PORT}`);
  console.log(`[Pure-Note] Auth gate: ${APP_PASSWORD ? 'ENABLED' : 'DISABLED'}`);
});
