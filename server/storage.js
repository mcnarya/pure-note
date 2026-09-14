import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.resolve(process.cwd(), 'data'));
const NOTES_DIR = path.join(DATA_DIR, 'notes');
const METADATA_FILE = path.join(DATA_DIR, 'notes.json');
const SCRATCHPAD_FILE = path.join(DATA_DIR, 'scratchpad.md');

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }
}

// Seed initial content if brand new installation
async function seedInitialData() {
  ensureDirs();
  if (!fs.existsSync(METADATA_FILE)) {
    const welcomeId = 'welcome-to-pure-note';
    const welcomeFilename = `${welcomeId}.md`;
    const welcomeContent = `# Welcome to Pure Note 📝

A distraction-free, self-hosted markdown scratchpad and daily journaling app. Part of the **Pure** ecosystem.

## ✨ Core Features
- [x] **Instant Daily Notes**: Jump straight to today's auto-dated journal note.
- [x] **Scratchpad**: Persistent quick scratchpad for snippets, ideas, and clipboard dumps.
- [x] **Interactive Checklists**: Toggle task items directly in preview mode!
- [x] **Markdown Formatting**: Headers, lists, code fences, blockquotes, and tables.
- [x] **Zero-Database Storage**: Saved directly to flat \`.md\` files in \`/data/notes/\`.
- [x] **Nord & Material 3 Theming**: Synced seamlessly with Pure Hub.

## 🚀 Quick Tips
- Press **Ctrl+S** or **Cmd+S** to instantly save.
- Toggle between **Edit**, **Split View**, and **Preview** using the top toolbar.
- Filter your notes using search or hashtag tags like \`#daily\` or \`#code\`.

Happy note-taking!
`;
    await fsPromises.writeFile(path.join(NOTES_DIR, welcomeFilename), welcomeContent, 'utf8');

    const initialMetadata = [
      {
        id: welcomeId,
        title: 'Welcome to Pure Note',
        filename: welcomeFilename,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: true,
        tags: ['guide', 'welcome'],
        wordCount: 125
      }
    ];
    await fsPromises.writeFile(METADATA_FILE, JSON.stringify(initialMetadata, null, 2), 'utf8');
  }

  if (!fs.existsSync(SCRATCHPAD_FILE)) {
    const defaultScratchpad = `# Quick Scratchpad 📋
*Drop transient thoughts, code snippets, or clipboard items here. Auto-saved in real-time.*

- [ ] Review daily priorities
- [ ] Sync backups with Pure Clone
`;
    await fsPromises.writeFile(SCRATCHPAD_FILE, defaultScratchpad, 'utf8');
  }
}

// Read metadata list
export async function readNotesMetadata() {
  ensureDirs();
  await seedInitialData();
  try {
    const raw = await fsPromises.readFile(METADATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[pure-note] Error reading metadata:', err);
    return [];
  }
}

// Write metadata list safely
async function writeNotesMetadata(notes) {
  ensureDirs();
  const tempFile = `${METADATA_FILE}.tmp-${Date.now()}`;
  await fsPromises.writeFile(tempFile, JSON.stringify(notes, null, 2), 'utf8');
  await fsPromises.rename(tempFile, METADATA_FILE);
}

// Get single note with markdown content
export async function getNote(id) {
  ensureDirs();
  const notes = await readNotesMetadata();
  const meta = notes.find(n => n.id === id);
  if (!meta) return null;

  const filePath = path.join(NOTES_DIR, meta.filename);
  let content = '';
  try {
    content = await fsPromises.readFile(filePath, 'utf8');
  } catch (err) {
    console.warn(`[pure-note] Note file missing for id: ${id}`, err);
  }

  return { ...meta, content };
}

// Helper to count words
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Create or update a note
export async function saveNote({ id, title, content = '', pinned = false, tags = [] }) {
  ensureDirs();
  const notes = await readNotesMetadata();
  const now = new Date().toISOString();
  const wordCount = countWords(content);

  const cleanTitle = (title || 'Untitled Note').trim();
  const safeFilenameBase = cleanTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 40) || 'note';

  let noteId = id;
  let filename = `${safeFilenameBase}-${Date.now().toString(36)}.md`;

  const existingIndex = notes.findIndex(n => n.id === id);

  if (existingIndex >= 0) {
    // Updating existing
    const existing = notes[existingIndex];
    filename = existing.filename;
    notes[existingIndex] = {
      ...existing,
      title: cleanTitle,
      pinned: Boolean(pinned),
      tags: Array.isArray(tags) ? tags : [],
      updatedAt: now,
      wordCount
    };
  } else {
    // Creating new
    noteId = noteId || `note-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    filename = `${safeFilenameBase}-${noteId}.md`;
    notes.unshift({
      id: noteId,
      title: cleanTitle,
      filename,
      createdAt: now,
      updatedAt: now,
      pinned: Boolean(pinned),
      tags: Array.isArray(tags) ? tags : [],
      wordCount
    });
  }

  // Write content to markdown file
  const filePath = path.join(NOTES_DIR, filename);
  const tempFile = `${filePath}.tmp-${Date.now()}`;
  await fsPromises.writeFile(tempFile, content, 'utf8');
  await fsPromises.rename(tempFile, filePath);

  // Write metadata
  await writeNotesMetadata(notes);

  return {
    id: noteId,
    title: cleanTitle,
    filename,
    content,
    pinned: Boolean(pinned),
    tags: Array.isArray(tags) ? tags : [],
    updatedAt: now,
    wordCount
  };
}

// Delete note
export async function deleteNote(id) {
  ensureDirs();
  const notes = await readNotesMetadata();
  const note = notes.find(n => n.id === id);
  if (!note) return false;

  const filePath = path.join(NOTES_DIR, note.filename);
  try {
    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
    }
  } catch (err) {
    console.error('[pure-note] Failed to delete note file:', err);
  }

  const filtered = notes.filter(n => n.id !== id);
  await writeNotesMetadata(filtered);
  return true;
}

// Get or create today's daily note
export async function getTodayDailyNote() {
  ensureDirs();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const notes = await readNotesMetadata();

  const existing = notes.find(n => n.tags?.includes('daily') && (n.title.includes(today) || n.filename.includes(today)));
  if (existing) {
    return await getNote(existing.id);
  }

  // Create new daily note
  const title = `Daily Log - ${today}`;
  const initialContent = `# Daily Log — ${today} ☀️

## 🎯 Top Objectives
- [ ] 

## 📝 Notes & Logs
- 

## 💡 Quick Ideas / Retrospective
- 
`;
  return await saveNote({
    title,
    content: initialContent,
    pinned: true,
    tags: ['daily', 'journal']
  });
}

// Scratchpad handlers
export async function getScratchpad() {
  ensureDirs();
  await seedInitialData();
  try {
    const content = await fsPromises.readFile(SCRATCHPAD_FILE, 'utf8');
    return { content };
  } catch {
    return { content: '' };
  }
}

export async function saveScratchpad(content) {
  ensureDirs();
  const tempFile = `${SCRATCHPAD_FILE}.tmp-${Date.now()}`;
  await fsPromises.writeFile(tempFile, content || '', 'utf8');
  await fsPromises.rename(tempFile, SCRATCHPAD_FILE);
  return { success: true };
}
