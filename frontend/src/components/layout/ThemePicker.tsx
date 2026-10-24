import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ACCENTS, useThemeStore, type Mode } from '@/store/themeStore';

const MODES: { id: Mode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export function ThemeControls({ compact = false }: { compact?: boolean }) {
  const { mode, accent, setMode, setAccent } = useThemeStore();
  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div>
        <p className="mb-2 text-[12px] font-medium text-fg-subtle">Appearance</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-bg-subtle p-1" role="radiogroup" aria-label="Appearance">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="radio"
              aria-checked={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-colors',
                mode === id ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-fg-muted hover:text-fg'
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-medium text-fg-subtle">Accent colour</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent colour">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              role="radio"
              aria-checked={accent === a.id}
              aria-label={a.label}
              title={a.label}
              onClick={() => setAccent(a.id)}
              className={cn(
                'relative flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110',
                accent === a.id && 'ring-2 ring-fg/60'
              )}
              style={{ background: a.swatch }}
            >
              {accent === a.id && <Check className="size-3.5 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThemePicker() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        aria-label="Theme settings"
      >
        <Palette className="size-[18px]" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-72 rounded-2xl border border-line-strong bg-surface p-4 shadow-2xl shadow-black/20 data-[state=open]:animate-in"
        >
          <ThemeControls compact />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
