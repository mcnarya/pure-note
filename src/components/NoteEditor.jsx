import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Edit3,
  Columns,
  Eye,
  Bold,
  Italic,
  Heading,
  ListTodo,
  Code,
  Quote,
  Pin,
  Copy,
  Download,
  Check,
  Save
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function NoteEditor({
  isScratchpad,
  note,
  onSaveNote,
  scratchpadContent,
  onSaveScratchpad
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(isScratchpad ? scratchpadContent : (note?.content || ''));
  const [pinned, setPinned] = useState(note?.pinned || false);
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [mode, setMode] = useState('split'); // 'edit' | 'split' | 'preview'
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Sync state when active note changes
  useEffect(() => {
    if (isScratchpad) {
      setContent(scratchpadContent || '');
      setTitle('Quick Scratchpad');
    } else if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setPinned(Boolean(note.pinned));
      setTags(note.tags?.join(', ') || '');
    }
  }, [note?.id, isScratchpad, scratchpadContent]);

  // Debounced auto-save
  const triggerSave = useCallback(() => {
    setSaveStatus('saving');
    if (isScratchpad) {
      onSaveScratchpad(content);
      setTimeout(() => setSaveStatus('saved'), 400);
    } else if (note) {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      onSaveNote({
        id: note.id,
        title: title || 'Untitled Note',
        content,
        pinned,
        tags: parsedTags
      });
      setTimeout(() => setSaveStatus('saved'), 400);
    }
  }, [content, title, pinned, tags, isScratchpad, note, onSaveNote, onSaveScratchpad]);

  // Content change auto-save handler
  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus('editing');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      triggerSave();
    }, 700);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSave]);

  // Formatting helpers
  const insertFormatting = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || defaultText;

    const replacement = `${prefix}${selected}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    setContent(newText);
    setSaveStatus('editing');

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      triggerSave();
    }, 700);
  };

  // Word & Character count metrics
  const metrics = useMemo(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    return { chars, words };
  }, [content]);

  // Markdown HTML generation with interactive checklists
  const renderedHtml = useMemo(() => {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    const raw = marked.parse(content || '*No content yet.*');
    return DOMPurify.sanitize(raw);
  }, [content]);

  // Interactive checklist toggle handler in preview
  const handlePreviewClick = (e) => {
    if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox') {
      const allCheckboxes = Array.from(e.currentTarget.querySelectorAll('input[type="checkbox"]'));
      const index = allCheckboxes.indexOf(e.target);
      if (index === -1) return;

      // Find nth checkbox pattern in source content
      let count = 0;
      const updated = content.replace(/-\s*\[([ xX])\]/g, (match, state) => {
        if (count === index) {
          count++;
          return state === ' ' ? '- [x]' : '- [ ]';
        }
        count++;
        return match;
      });

      setContent(updated);
      setSaveStatus('saving');
      if (isScratchpad) {
        onSaveScratchpad(updated);
      } else if (note) {
        onSaveNote({ ...note, content: updated });
      }
      setTimeout(() => setSaveStatus('saved'), 300);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  // Download .md file
  const handleDownload = () => {
    const filename = `${(title || 'note').toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 h-full flex flex-col bg-[var(--md-sys-color-surface)] min-w-0">
      {/* Top Toolbar */}
      <header className="p-3 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between gap-2 flex-wrap select-none">
        {/* Title / Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {isScratchpad ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                📋 Quick Scratchpad
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary)]/20 text-[var(--md-sys-color-primary)] font-medium">
                Auto-saved
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={title}
                placeholder="Note Title..."
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveStatus('editing');
                  if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
                  autoSaveTimerRef.current = setTimeout(triggerSave, 700);
                }}
                className="w-full text-base font-semibold bg-transparent text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setPinned(!pinned);
                  onSaveNote({ ...note, pinned: !pinned });
                }}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  pinned
                    ? 'text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/15'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
                title={pinned ? 'Unpin Note' : 'Pin Note'}
              >
                <Pin size={15} className={pinned ? 'fill-[var(--md-sys-color-primary)]' : ''} />
              </button>
            </div>
          )}
        </div>

        {/* Formatting Actions (Edit or Split Mode) */}
        {mode !== 'preview' && (
          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline)]">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**', 'bold')}
              className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              title="Bold (**text**)"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*', 'italic')}
              className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              title="Italic (*text*)"
            >
              <Italic size={13} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('## ', '', 'Heading')}
              className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              title="Heading (## Heading)"
            >
              <Heading size={13} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- [ ] ', '', 'Task')}
              className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              title="Checklist (- [ ] Task)"
            >
              <ListTodo size={13} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`', 'code')}
              className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              title="Inline Code (`code`)"
            >
              <Code size={13} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('> ', '', 'Quote')}
              className="p-1 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              title="Quote (> Quote)"
            >
              <Quote size={13} />
            </button>
          </div>
        )}

        {/* Mode Switcher & Tools */}
        <div className="flex items-center gap-2">
          {/* Mode Segmented Buttons */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline)] text-xs">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                mode === 'edit'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Source Edit Mode"
            >
              <Edit3 size={13} />
              <span className="hidden md:inline">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                mode === 'split'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Split View"
            >
              <Columns size={13} />
              <span className="hidden md:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                mode === 'preview'
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Live Preview Mode"
            >
              <Eye size={13} />
              <span className="hidden md:inline">Read</span>
            </button>
          </div>

          {/* Quick Copy & Download */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
            title="Copy Markdown"
          >
            {copied ? <Check size={14} className="text-[var(--md-sys-color-success)]" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
            title="Download .md file"
          >
            <Download size={14} />
          </button>
        </div>
      </header>

      {/* Editor & Preview Split Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`h-full flex flex-col ${mode === 'split' ? 'w-1/2 border-r border-[var(--md-sys-color-outline)]' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Write Markdown note here... (Markdown, task lists, code blocks)"
              className="w-full h-full p-4 bg-transparent text-[var(--md-sys-color-on-surface)] font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder-[var(--md-sys-color-on-surface-variant)]/40"
              spellCheck="false"
            />
          </div>
        )}

        {/* Preview Area */}
        {(mode === 'preview' || mode === 'split') && (
          <div
            onClick={handlePreviewClick}
            className={`h-full overflow-y-auto p-6 bg-[var(--md-sys-color-surface)] ${
              mode === 'split' ? 'w-1/2' : 'w-full max-w-4xl mx-auto'
            }`}
          >
            <div
              className="prose-note"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <footer className="px-4 py-2 border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] select-none">
        <div className="flex items-center gap-3">
          <span>{metrics.words} words</span>
          <span>{metrics.chars} characters</span>
          {!isScratchpad && note?.filename && (
            <span className="opacity-75 font-mono text-[10px] hidden sm:inline">{note.filename}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && <span className="text-[var(--md-sys-color-primary)]">Saving...</span>}
          {saveStatus === 'saved' && <span className="text-[var(--md-sys-color-success)] flex items-center gap-1"><Check size={12} /> Saved</span>}
          <span className="opacity-60 hidden sm:inline">Ctrl+S to save</span>
        </div>
      </footer>
    </main>
  );
}
