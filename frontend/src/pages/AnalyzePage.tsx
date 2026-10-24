import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { BadgeCheck, FileText, Globe, ImageIcon, Link2, MessageSquareText, ScanSearch, Sparkles, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { submitFile, submitText, submitUrl } from '@/api/analysis';
import { getApiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Badge';
import { PageIntro } from '@/components/landing/Effects';
import { cn } from '@/lib/cn';
import type { Analysis } from '@/types';

type Mode = 'url' | 'text' | 'image' | 'pdf';

const MODES: { id: Mode; label: string; icon: typeof Link2; hint: string }[] = [
  { id: 'url', label: 'Link', icon: Link2, hint: 'LinkedIn, Indeed, company career pages and more' },
  { id: 'text', label: 'Text', icon: MessageSquareText, hint: 'Job posts, emails, WhatsApp or Telegram messages' },
  { id: 'image', label: 'Screenshot', icon: ImageIcon, hint: 'PNG, JPG or WEBP up to 5 MB' },
  { id: 'pdf', label: 'PDF', icon: FileText, hint: 'Offer letters and job descriptions up to 10 MB' },
];

const STAGES = [
  { label: 'Reading the posting', icon: FileText },
  { label: 'Tracing where it was published', icon: Globe },
  { label: 'Verifying the employer', icon: BadgeCheck },
  { label: 'Reasoning about the evidence', icon: Sparkles },
];

const MAX_BYTES = { image: 5 * 1024 * 1024, pdf: 10 * 1024 * 1024 };
const ACCEPT = { image: 'image/png,image/jpeg,image/webp', pdf: 'application/pdf' };

function ProgressPanel() {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => {
      const s = (Date.now() - started) / 1000;
      setElapsed(Math.floor(s));
      // Reading + tracing are quick; reasoning takes most of the time.
      setStage(s < 2 ? 0 : s < 5 ? 1 : s < 9 ? 2 : 3);
    }, 250);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-line bg-surface p-6 sm:p-8" role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="font-medium">Checking this job…</p>
        <span className="font-mono text-[12px] text-fg-subtle">{elapsed}s</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
        <motion.div className="h-full rounded-full bg-accent" initial={{ width: '4%' }} animate={{ width: `${Math.min(92, 12 + stage * 22 + elapsed)}%` }} transition={{ ease: 'easeOut', duration: 0.6 }} />
      </div>
      <ul className="mt-6 space-y-3">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const state = i < stage ? 'done' : i === stage ? 'active' : 'todo';
          return (
            <li key={s.label} className={cn('flex items-center gap-3 text-[15px] transition-colors', state === 'todo' ? 'text-fg-subtle' : 'text-fg')}>
              <span className={cn('flex size-8 items-center justify-center rounded-lg ring-1 transition-colors', state === 'done' ? 'bg-safe/10 text-safe ring-safe/30' : state === 'active' ? 'bg-accent/10 text-accent ring-accent/30' : 'ring-line')}>
                <Icon className={cn('size-4', state === 'active' && 'animate-pulse-soft')} />
              </span>
              {s.label}
              {state === 'done' && <span className="ml-auto text-[12px] text-safe">Done</span>}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-[13px] text-fg-subtle">Reasoning runs privately on your own machine — usually 20–90 seconds, depending on your computer.</p>
    </motion.div>
  );
}

function Dropzone({ mode, file, onFile }: { mode: 'image' | 'pdf'; file: File | null; onFile: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const preview = file && mode === 'image' ? URL.createObjectURL(file) : null;
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  if (file) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-bg-subtle p-4">
        {preview ? <img src={preview} alt="" className="size-16 rounded-lg object-cover ring-1 ring-line" /> : <FileText className="size-10 text-accent" />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-[13px] text-fg-subtle">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button type="button" onClick={() => onFile(null)} className="rounded-lg p-2 text-fg-subtle hover:bg-surface-2 hover:text-fg" aria-label="Remove file">
          <X className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn('flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors', dragging ? 'border-accent bg-accent/5' : 'border-line-strong hover:border-accent/60 hover:bg-bg-subtle')}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Upload className="size-5" />
      </span>
      <span className="font-medium">Drop a {mode === 'image' ? 'screenshot' : 'PDF'} here, or click to browse</span>
      <span className="text-[13px] text-fg-subtle">{MODES.find((m) => m.id === mode)?.hint}</span>
      <input ref={inputRef} type="file" accept={ACCEPT[mode]} className="hidden" aria-label={`Upload ${mode}`} onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </button>
  );
}

function normalizeUrl(raw: string) {
  const v = raw.trim();
  return v.includes('://') ? v : `https://${v}`;
}

interface PrefillState {
  mode?: Mode;
  value?: string;
  autostart?: boolean;
}

export function AnalyzePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state ?? {}) as PrefillState;
  const [mode, setMode] = useState<Mode>(prefill.mode ?? 'url');
  const [url, setUrl] = useState(prefill.mode === 'url' ? prefill.value ?? '' : '');
  const [text, setText] = useState(prefill.mode === 'text' ? prefill.value ?? '' : '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<Analysis, unknown, void>({
    mutationFn: () => {
      if (mode === 'url') return submitUrl(normalizeUrl(url));
      if (mode === 'text') return submitText(text.trim());
      return submitFile(mode, file as File);
    },
    onSuccess: (analysis) => navigate(`/report/${analysis._id}`),
    onError: (err) => setError(getApiErrorMessage(err, 'We couldn’t check this job. Please try again.')),
  });

  const validate = useCallback((): string | null => {
    if (mode === 'url') {
      if (!url.trim()) return 'Paste a job link to check.';
      try {
        const u = new URL(normalizeUrl(url));
        if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) throw new Error();
      } catch {
        return 'That doesn’t look like a valid web address.';
      }
    }
    if (mode === 'text' && text.trim().length < 30) return 'Paste a bit more of the posting (at least a couple of sentences).';
    if ((mode === 'image' || mode === 'pdf') && !file) return `Choose a ${mode === 'image' ? 'screenshot' : 'PDF'} to upload.`;
    return null;
  }, [mode, url, text, file]);

  function run(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    mutation.mutate();
  }

  // Started from the landing-page checker: run immediately, once.
  const autostarted = useRef(false);
  useEffect(() => {
    if (prefill.autostart && !autostarted.current) {
      autostarted.current = true;
      navigate(location.pathname, { replace: true, state: null });
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseFile(f: File | null) {
    setError(null);
    if (f && (mode === 'image' || mode === 'pdf')) {
      const okType = mode === 'pdf' ? f.type === 'application/pdf' : ['image/png', 'image/jpeg', 'image/webp'].includes(f.type);
      if (!okType) {
        toast.error(mode === 'pdf' ? 'Please choose a PDF file.' : 'Please choose a PNG, JPG or WEBP image.');
        return;
      }
      if (f.size > MAX_BYTES[mode]) {
        toast.error(`That file is too large (max ${MAX_BYTES[mode] / 1024 / 1024} MB).`);
        return;
      }
    }
    setFile(f);
  }

  const busy = mutation.isPending;

  return (
    <div className="relative">
      <div className="container-page max-w-3xl py-14 sm:py-20">
        <PageIntro label="Check a job" title="Share it however you received it" sub="get a verdict and the evidence behind it" />
        <div className="mt-10">
          <AnimatePresence mode="wait">
            {busy ? (
              <ProgressPanel key="progress" />
            ) : (
              <motion.form key="form" onSubmit={run} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-3xl border border-line bg-surface p-3 shadow-xl shadow-black/5 sm:p-4">
                <div className="grid grid-cols-4 gap-1 rounded-2xl bg-bg-subtle p-1" role="tablist" aria-label="Input type">
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="tab"
                        aria-selected={mode === m.id}
                        onClick={() => {
                          setMode(m.id);
                          setFile(null);
                          setError(null);
                        }}
                        className={cn('relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-colors sm:text-sm', mode === m.id ? 'text-fg' : 'text-fg-subtle hover:text-fg')}
                      >
                        {mode === m.id && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-xl bg-surface shadow-sm ring-1 ring-line" transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />}
                        <Icon className="relative size-4" />
                        <span className="relative">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 pt-5 sm:p-3 sm:pt-6">
                  {mode === 'url' && (
                    <div>
                      <label htmlFor="job-url" className="sr-only">Job link</label>
                      <div className="relative">
                        <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
                        <input
                          id="job-url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          autoFocus
                          placeholder="https://www.linkedin.com/jobs/view/…"
                          className="h-14 w-full rounded-2xl border border-line-strong bg-bg-subtle pl-11 pr-4 text-[15px] outline-none transition placeholder:text-fg-subtle focus:border-accent focus:ring-4 focus:ring-accent/15"
                        />
                      </div>
                      <p className="mt-2.5 text-[13px] text-fg-subtle">{MODES[0].hint}</p>
                    </div>
                  )}
                  {mode === 'text' && (
                    <div>
                      <label htmlFor="job-text" className="sr-only">Job text</label>
                      <textarea
                        id="job-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        autoFocus
                        rows={10}
                        placeholder={'Paste the full posting or message — include the company, contact details and any links.'}
                        className="w-full resize-y rounded-2xl border border-line-strong bg-bg-subtle px-4 py-3.5 text-[15px] leading-relaxed outline-none transition placeholder:text-fg-subtle focus:border-accent focus:ring-4 focus:ring-accent/15"
                      />
                      <div className="mt-2 flex justify-between text-[13px] text-fg-subtle">
                        <span>{MODES[1].hint}</span>
                        <span className="tabular-nums">{text.length.toLocaleString()} chars</span>
                      </div>
                    </div>
                  )}
                  {(mode === 'image' || mode === 'pdf') && <Dropzone mode={mode} file={file} onFile={chooseFile} />}

                  {error && (
                    <div className="mt-4">
                      <Alert>{error}</Alert>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="mt-5 w-full" icon={<ScanSearch className="size-4" />}>
                    Check this job
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
