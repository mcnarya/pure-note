import React from 'react';
import {
  FileText,
  Pin,
  Calendar,
  ClipboardList,
  Plus,
  Search,
  Trash2,
  Tag,
  Hash
} from 'lucide-react';

import SuiteMenu from './SuiteMenu';

export default function NoteSidebar({
  notes,
  activeNoteId,
  isScratchpadActive,
  onSelectNote,
  onSelectScratchpad,
  onNewNote,
  onDailyNote,
  onDeleteNote,
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  allTags
}) {
  const filteredNotes = notes.filter((n) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchTags = n.tags && n.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchTags) return false;
    }
    if (selectedTag) {
      if (!n.tags || !n.tags.includes(selectedTag)) return false;
    }
    return true;
  });

  // Sort pinned first, then by updatedAt desc
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });

  return (
    <aside className="w-80 h-full flex flex-col border-r border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] flex-shrink-0 select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-[var(--md-sys-color-outline)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center font-bold shadow-sm">
            📝
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">Pure Note</h1>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] opacity-80">Distraction-Free Notes</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <SuiteMenu />
          <button
            type="button"
            onClick={onNewNote}
            className="p-1.5 rounded-md bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            title="Create New Note (Ctrl+N)"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Quick Launch Buttons */}
      <div className="p-2.5 grid grid-cols-2 gap-1.5 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]/50">
        <button
          type="button"
          onClick={onDailyNote}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] transition-colors cursor-pointer"
        >
          <Calendar size={14} className="text-[var(--md-sys-color-primary)]" />
          <span>Today's Log</span>
        </button>

        <button
          type="button"
          onClick={onSelectScratchpad}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
            isScratchpadActive
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] shadow-sm'
              : 'bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-primary)]/15 text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline)]'
          }`}
        >
          <ClipboardList size={14} />
          <span>Scratchpad</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 pb-2 border-b border-[var(--md-sys-color-outline)]">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Search notes & tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 border border-[var(--md-sys-color-outline)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-colors"
          />
        </div>

        {/* Tag Pills */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <button
              type="button"
              onClick={() => onSelectTag('')}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                !selectedTag
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium'
                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onSelectTag(selectedTag === t ? '' : t)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer flex items-center gap-0.5 transition-colors ${
                  selectedTag === t
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium'
                    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <span>#{t}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedNotes.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
            <p>No notes found.</p>
            <button
              type="button"
              onClick={onNewNote}
              className="mt-2 inline-flex items-center gap-1 text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
            >
              <Plus size={12} />
              Create your first note
            </button>
          </div>
        ) : (
          sortedNotes.map((note) => {
            const isSelected = !isScratchpadActive && activeNoteId === note.id;
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group relative p-2.5 rounded-lg cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-surface-container-high)] border-[var(--md-sys-color-primary)] shadow-sm'
                    : 'bg-transparent hover:bg-[var(--md-sys-color-surface)]/60 border-transparent hover:border-[var(--md-sys-color-outline)]'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {note.pinned && (
                      <Pin size={12} className="text-[var(--md-sys-color-primary)] flex-shrink-0 fill-[var(--md-sys-color-primary)]/20" />
                    )}
                    <h3 className="text-xs font-medium text-[var(--md-sys-color-on-surface)] truncate">
                      {note.title || 'Untitled Note'}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-surface-variant)] transition-opacity cursor-pointer rounded"
                    title="Delete Note"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
                  <span>
                    {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span>{note.wordCount || 0} words</span>
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9.5px] px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[var(--md-sys-color-outline)] text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
        <span>{notes.length} notes</span>
        <span className="opacity-70">Flat-File Markdown</span>
      </div>
    </aside>
  );
}
