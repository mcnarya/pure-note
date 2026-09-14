import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NoteSidebar from './components/NoteSidebar';
import NoteEditor from './components/NoteEditor';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isScratchpad, setIsScratchpad] = useState(false);
  const [scratchpadContent, setScratchpadContent] = useState('');
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Theming
  const [theme, setTheme] = useState(() => localStorage.getItem('pure_note_theme') || 'theme-nord');

  // Auth
  const [authRequired, setAuthRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // API Base resolver
  const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/note') ? '/note/api' : '/api';

  // Apply Theme
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('pure_note_theme', theme);
  }, [theme]);

  // PostMessage listener for Pure Hub theme sync
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'PURE_HUB_THEME_CHANGE' && typeof event.data.theme === 'string') {
        setTheme(event.data.theme);
      }
      if (event.data?.type === 'PURE_HUB_DYNAMIC_THEME_OVERRIDE') {
        const { primary, primaryContainer } = event.data;
        if (primary && primaryContainer) {
          document.documentElement.style.setProperty('--md-sys-color-primary', primary);
          document.documentElement.style.setProperty('--md-sys-color-primary-container', primaryContainer);
        }
      }
      if (event.data?.type === 'PURE_HUB_DYNAMIC_THEME_RESET') {
        document.documentElement.style.removeProperty('--md-sys-color-primary');
        document.documentElement.style.removeProperty('--md-sys-color-primary-container');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    const token = sessionStorage.getItem('pure_note_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  // Check Auth
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/auth/status`);
      const data = await res.json();
      setAuthRequired(Boolean(data.authRequired));
      if (data.authRequired) {
        const savedToken = sessionStorage.getItem('pure_note_token');
        if (savedToken) {
          const verifyRes = await fetch(`${apiBase}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: savedToken })
          });
          setAuthenticated(verifyRes.ok);
        } else {
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(true);
      }
    } catch (err) {
      console.error('[pure-note] Auth check error:', err);
    }
  }, [apiBase]);

  // Load Notes
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/notes`, { headers: getHeaders() });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setNotes(data);

      // Load first note if nothing active
      if (!isScratchpad && !activeNote && data.length > 0) {
        const full = await fetch(`${apiBase}/notes/${data[0].id}`, { headers: getHeaders() });
        if (full.ok) {
          const fullNote = await full.json();
          setActiveNote(fullNote);
        }
      }
    } catch (err) {
      console.error('[pure-note] Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBase, getHeaders, isScratchpad, activeNote]);

  // Load Scratchpad
  const fetchScratchpad = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/scratchpad`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setScratchpadContent(data.content || '');
      }
    } catch (err) {
      console.error('[pure-note] Failed to load scratchpad:', err);
    }
  }, [apiBase, getHeaders]);

  useEffect(() => {
    checkAuth().then(() => {
      fetchNotes();
      fetchScratchpad();
    });
  }, [checkAuth, fetchNotes, fetchScratchpad]);

  // All distinct tags
  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => {
      if (n.tags && Array.isArray(n.tags)) {
        n.tags.forEach(t => set.add(t));
      }
    });
    return Array.from(set);
  }, [notes]);

  // Select a note
  const handleSelectNote = async (id) => {
    try {
      setIsScratchpad(false);
      const res = await fetch(`${apiBase}/notes/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const full = await res.json();
        setActiveNote(full);
      }
    } catch (err) {
      console.error('[pure-note] Failed to load note:', err);
    }
  };

  // Select scratchpad
  const handleSelectScratchpad = () => {
    setIsScratchpad(true);
  };

  // Create new note
  const handleNewNote = async () => {
    try {
      const res = await fetch(`${apiBase}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '# Untitled Note\n\nStart writing...',
          tags: []
        })
      });
      if (res.ok) {
        const created = await res.json();
        setNotes(prev => [created, ...prev]);
        setActiveNote(created);
        setIsScratchpad(false);
      }
    } catch (err) {
      console.error('[pure-note] Failed to create note:', err);
    }
  };

  // Today Daily note
  const handleDailyNote = async () => {
    try {
      const res = await fetch(`${apiBase}/notes/daily/today`, { headers: getHeaders() });
      if (res.ok) {
        const daily = await res.json();
        setIsScratchpad(false);
        setActiveNote(daily);
        fetchNotes();
      }
    } catch (err) {
      console.error('[pure-note] Failed to get/create daily note:', err);
    }
  };

  // Save active note
  const handleSaveNote = async (updatedData) => {
    if (!updatedData?.id) return;
    try {
      const res = await fetch(`${apiBase}/notes/${updatedData.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const saved = await res.json();
        setActiveNote(saved);
        setNotes(prev => prev.map(n => n.id === saved.id ? { ...n, ...saved } : n));
      }
    } catch (err) {
      console.error('[pure-note] Failed to save note:', err);
    }
  };

  // Delete note
  const handleDeleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`${apiBase}/notes/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (activeNote?.id === id) {
          const remaining = notes.filter(n => n.id !== id);
          if (remaining.length > 0) {
            handleSelectNote(remaining[0].id);
          } else {
            setActiveNote(null);
            setIsScratchpad(true);
          }
        }
      }
    } catch (err) {
      console.error('[pure-note] Failed to delete note:', err);
    }
  };

  // Save scratchpad
  const handleSaveScratchpad = async (content) => {
    setScratchpadContent(content);
    try {
      await fetch(`${apiBase}/scratchpad`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ content })
      });
    } catch (err) {
      console.error('[pure-note] Failed to save scratchpad:', err);
    }
  };

  // Password verification
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${apiBase}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        sessionStorage.setItem('pure_note_token', password);
        setAuthenticated(true);
        fetchNotes();
        fetchScratchpad();
      } else {
        setAuthError('Invalid password. Please try again.');
      }
    } catch {
      setAuthError('Connection error.');
    }
  };

  if (authRequired && !authenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center p-4 bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)]">
        <form onSubmit={handleLogin} className="w-full max-w-sm p-6 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] shadow-xl space-y-4">
          <div className="text-center">
            <div className="text-3xl mb-1">📝</div>
            <h2 className="text-lg font-bold">Pure Note</h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Enter access password</p>
          </div>
          {authError && <div className="text-xs p-2 rounded bg-[var(--md-sys-color-error)]/20 text-[var(--md-sys-color-error)]">{authError}</div>}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] focus:outline-none focus:border-[var(--md-sys-color-primary)]"
            autoFocus
          />
          <button type="submit" className="w-full py-2 rounded-lg text-sm font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-opacity">
            Unlock Pure Note
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)]">
      <NoteSidebar
        notes={notes}
        activeNoteId={activeNote?.id}
        isScratchpadActive={isScratchpad}
        onSelectNote={handleSelectNote}
        onSelectScratchpad={handleSelectScratchpad}
        onNewNote={handleNewNote}
        onDailyNote={handleDailyNote}
        onDeleteNote={handleDeleteNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        allTags={allTags}
      />

      <NoteEditor
        isScratchpad={isScratchpad}
        note={activeNote}
        onSaveNote={handleSaveNote}
        scratchpadContent={scratchpadContent}
        onSaveScratchpad={handleSaveScratchpad}
      />
    </div>
  );
}
