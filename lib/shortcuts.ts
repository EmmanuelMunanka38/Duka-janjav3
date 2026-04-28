'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
  descriptionSw?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[], enabled: boolean = true) {
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      if (e.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function usePageShortcuts(context: string, onNew: () => void, onPrint: () => void) {
  const router = useRouter();
  
  const shortcuts: ShortcutHandler[] = [
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search',
      descriptionSw: 'Fuatilia utafutaji',
    },
    {
      key: 'n',
      action: onNew,
      description: 'New record',
      descriptionSw: 'Rekodi mpya',
    },
    {
      key: 'p',
      ctrl: true,
      action: onPrint,
      description: 'Print',
      descriptionSw: 'Chapisha',
    },
    {
      key: 'Escape',
      action: () => {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
          modal.remove();
        }
      },
      description: 'Close modal',
      descriptionSw: 'Funga modali',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

export function KeyboardShortcutsHelp({ language = 'en' }: { language?: 'sw' | 'en' }) {
  const isSwahili = language === 'sw';
  const shortcuts = [
    { key: '/', desc: isSwahili ? 'Fuatilia utafutaji' : 'Focus search' },
    { key: 'N', desc: isSwahili ? 'Rekodi mpya' : 'New record' },
    { key: 'Ctrl+P', desc: isSwahili ? 'Chapisha' : 'Print' },
    { key: 'Esc', desc: isSwahili ? 'Funga modali' : 'Close modal' },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50">
      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
        {isSwahili ? 'Shortcut za Kibodi' : 'Keyboard Shortcuts'}
      </p>
      <div className="space-y-1">
        {shortcuts.map((s) => (
          <div key={s.key} className="flex items-center justify-between text-sm">
            <kbd className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{s.key}</kbd>
            <span className="text-slate-600">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}