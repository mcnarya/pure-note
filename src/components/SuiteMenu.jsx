import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  ExternalLink,
  Radio,
  KeyRound,
  BookOpen,
  Cloud,
  FileText,
  Activity
} from 'lucide-react';

export default function SuiteMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const apps = [
    { name: 'Pure Hub', desc: 'Minimalist dashboard & launcher', icon: LayoutGrid, host: 'https://pure.mcnarya.com', current: false },
    { name: 'Pure Read', desc: 'Distraction-free article stash', icon: BookOpen, host: 'https://read.mcnarya.com', current: false },
    { name: 'Pure Feed', desc: 'Zero-distraction stream & RSS', icon: Radio, host: 'https://pure.mcnarya.com', current: false },
    { name: 'Pure OTP', desc: 'Two-factor authenticator', icon: KeyRound, host: 'https://otp.mcnarya.com', current: false },
    { name: 'Pure Clone', desc: 'Cloud storage web client', icon: Cloud, host: 'https://clone.mcnarya.com', current: false },
    { name: 'Pure Note', desc: 'Markdown scratchpad & daily notes', icon: FileText, host: '#', current: true },
    { name: 'Pure Ping', desc: 'Homelab uptime & heartbeat', icon: Activity, host: 'https://ping.mcnarya.com', current: false },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
        title="Pure Suite"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider">
            Pure Suite
          </div>
          <div className="space-y-1">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <a
                  key={app.name}
                  href={app.host}
                  target={app.current ? '_self' : '_blank'}
                  rel="noreferrer"
                  onClick={() => !app.current && setOpen(false)}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs transition-colors ${
                    app.current
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-semibold'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      app.current
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                        : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{app.name}</span>
                      {app.current && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-success)] shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] opacity-75 truncate leading-tight">
                      {app.desc}
                    </div>
                  </div>
                  {!app.current && <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
