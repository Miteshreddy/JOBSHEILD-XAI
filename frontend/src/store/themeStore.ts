import { create } from 'zustand';

export type Mode = 'light' | 'dark' | 'system';
export type Accent = 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'mono';

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: 'mono', label: 'Monochrome', swatch: '#d4d4d4' },
  { id: 'indigo', label: 'Indigo', swatch: '#6366f1' },
  { id: 'violet', label: 'Violet', swatch: '#8b5cf6' },
  { id: 'sky', label: 'Sky', swatch: '#0ea5e9' },
  { id: 'emerald', label: 'Emerald', swatch: '#10b981' },
  { id: 'amber', label: 'Amber', swatch: '#f59e0b' },
  { id: 'rose', label: 'Rose', swatch: '#f43f5e' },
];

const MODE_KEY = 'jobshield-theme';
const ACCENT_KEY = 'jobshield-accent';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: the choice still applies for this visit.
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(mode: Mode, accent: Accent) {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark' || (mode === 'system' && systemPrefersDark()));
  root.dataset.accent = accent;
}

function storedMode(): Mode {
  const v = read(MODE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'dark';
}

function storedAccent(): Accent {
  const v = read(ACCENT_KEY);
  return ACCENTS.some((a) => a.id === v) ? (v as Accent) : 'mono';
}

interface ThemeState {
  mode: Mode;
  accent: Accent;
  setMode: (mode: Mode) => void;
  setAccent: (accent: Accent) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: storedMode(),
  accent: storedAccent(),
  setMode: (mode) => {
    write(MODE_KEY, mode);
    applyTheme(mode, get().accent);
    set({ mode });
  },
  setAccent: (accent) => {
    write(ACCENT_KEY, accent);
    applyTheme(get().mode, accent);
    set({ accent });
  },
}));

export function resolvedIsDark(mode: Mode) {
  return mode === 'dark' || (mode === 'system' && systemPrefersDark());
}
