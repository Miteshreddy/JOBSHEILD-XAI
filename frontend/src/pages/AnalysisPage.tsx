import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Image as ImageIcon, Link2, Type, UploadCloud, X, ShieldCheck, Brain, Zap, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alert } from '@/components/ui/Alert';
import { submitFile, submitText, submitUrl } from '@/api/analysis';
import { getApiErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';
import type { Analysis } from '@/types';
import { GradientText } from '@/components/ui/GradientText';
import { BorderBeam } from '@/components/ui/BorderBeam';

type Mode = 'text' | 'url' | 'pdf' | 'image';

const MODES: { key: Mode; label: string; icon: typeof Type; desc: string }[] = [
  { key: 'text', label: 'Paste Text', icon: Type, desc: 'Raw job ad text' },
  { key: 'url', label: 'URL', icon: Link2, desc: 'Job listing URL' },
  { key: 'pdf', label: 'PDF', icon: FileText, desc: 'PDF upload' },
  { key: 'image', label: 'OCR', icon: ImageIcon, desc: 'Screenshot / image' },
];

const LOADING_STEPS = [
  { icon: Brain, label: 'Running BERT inference…' },
  { icon: ShieldCheck, label: 'Computing Trust Score…' },
  { icon: Zap, label: 'Scoring risk severity…' },
  { icon: Eye, label: 'Generating SHAP + LIME explanations…' },
];

function FileDropzone({
  file,
  accept,
  hint,
  icon: DropIcon,
  onChange,
}: {
  file: File | null;
  accept: string;
  hint: string;
  icon: typeof FileText;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onChange(dropped);
  }

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <DropIcon className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
          <span className="truncate text-sm font-medium text-white">{file.name}</span>
          <span className="text-xs text-slate-500">({Math.round(file.size / 1024)} KB)</span>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200',
        isDragging
          ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
          : 'border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.02]'
      )}
    >
      <div className={cn(
        'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
        isDragging ? 'bg-cyan-500/20' : 'bg-white/5'
      )}>
        <UploadCloud className={cn('h-7 w-7 transition-colors', isDragging ? 'text-cyan-400' : 'text-slate-500')} aria-hidden="true" />
      </div>
      <div>
        <span className="text-sm text-slate-300">
          <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
        </span>
        <p className="mt-1 text-xs text-slate-600">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="hidden"
        aria-label={`Upload ${hint}`}
      />
    </label>
  );
}

function LoadingState({ mode }: { mode: Mode }) {
  const [step, setStep] = useState(0);
  
  // Cycle through steps
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-2xl p-8 bg-[#090815]/90 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]"
    >
      {/* Animated shield */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center animate-glow-pulse"
            style={{ boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          {/* Orbit ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-violet-500/30 animate-spin-slow" />
        </div>
      </div>

      <h3 className="text-center text-lg font-bold text-white mb-2">
        Running Neural Inference…
      </h3>
      <p className="text-center text-xs text-slate-400 font-mono mb-8">
        {mode === 'url' ? 'Scraping URL and' : mode === 'pdf' ? 'Extracting PDF text and' : mode === 'image' ? 'Running OCR and' : 'Tokenizing text and'}{' '}
        computing SHAP + LIME attributions
      </p>

      {/* Steps */}
      <div className="space-y-3 max-w-xs mx-auto">
        {LOADING_STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                done ? 'bg-emerald-500/20 text-emerald-400' : active ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40' : 'bg-white/5 text-slate-600'
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={cn(
                'text-xs font-mono transition-colors',
                done ? 'text-emerald-400 line-through' : active ? 'text-white font-medium' : 'text-slate-600'
              )}>
                {s.label}
              </span>
              {active && (
                <span className="ml-auto flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function AnalysisPage() {
  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleModeChange(key: Mode) {
    setMode(key);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      let analysis: Analysis;
      if (mode === 'text') {
        if (!text.trim()) throw new Error('Please paste the job advertisement text.');
        analysis = await submitText(text);
      } else if (mode === 'url') {
        if (!url.trim()) throw new Error('Please enter a job advertisement URL.');
        analysis = await submitUrl(url);
      } else if (mode === 'pdf') {
        if (!pdfFile) throw new Error('Please choose a PDF file to upload.');
        analysis = await submitFile('pdf', pdfFile);
      } else {
        if (!imageFile) throw new Error('Please choose an image file to upload.');
        analysis = await submitFile('image', imageFile);
      }
      navigate(`/analyze/${analysis._id}`, { state: { fresh: true } });
    } catch (err) {
      setError(err instanceof Error && !('response' in err) ? err.message : getApiErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto pt-2 pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg"
              style={{ boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}
            >
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-violet-300">
              BERT + XAI Microservice
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight">
            Analyze a <GradientText>Job Posting</GradientText>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
            Submit raw description text, upload a resume or offer PDF, enter an ATS URL, or drop a screenshot for instant OCR.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative rounded-3xl border border-white/10 bg-[#080712]/95 backdrop-blur-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
        >
          <BorderBeam size={260} duration={8} colorFrom="#c084fc" colorTo="#818cf8" />

          {/* Mode tabs */}
          <div role="tablist" className="flex border-b border-white/[0.08] p-2 gap-1.5 bg-white/[0.02]">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={m.label}
                  onClick={() => handleModeChange(m.key)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl text-xs font-medium transition-all duration-200',
                    active
                      ? 'bg-violet-600/25 text-violet-200 border border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline font-mono">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === 'text' && (
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste the full job advertisement here…&#10;&#10;Include: job title, company name, description, requirements, salary, and contact information for the most accurate analysis."
                      rows={11}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.04] transition-all leading-relaxed"
                    />
                  )}

                  {mode === 'url' && (
                    <div>
                      <div className="relative">
                        <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://example.com/careers/job-123"
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        The page will be scraped automatically. Works best with static job listing pages (LinkedIn, Indeed, company career pages).
                      </p>
                    </div>
                  )}

                  {mode === 'pdf' && (
                    <FileDropzone
                      file={pdfFile}
                      accept="application/pdf"
                      hint="PDF up to 10 MB"
                      icon={FileText}
                      onChange={setPdfFile}
                    />
                  )}

                  {mode === 'image' && (
                    <div>
                      <FileDropzone
                        file={imageFile}
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        hint="PNG, JPG or WEBP up to 5 MB"
                        icon={ImageIcon}
                        onChange={setImageFile}
                      />
                      <p className="mt-2 text-xs text-slate-600">
                        Tip: for best results, copy the text from the image and use the Text tab instead.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && <Alert variant="error">{error}</Alert>}

              <button
                type="submit"
                aria-label="Analyze Job"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_45px_rgba(139,92,246,0.6)] transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Neural Pipeline Running…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Execute Full AI Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Loading state */}
        <AnimatePresence>
          {isSubmitting && <LoadingState mode={mode} />}
        </AnimatePresence>

        {/* Info chips */}
        {!isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex flex-wrap gap-2 justify-center"
          >
            {['BERT AI', 'SHAP Explained', 'Trust Score', 'Risk Category', 'Instant Results'].map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/[0.06] text-slate-500">
                {tag}
              </span>
            ))}
          </motion.div>
        )}
      </div>
    );
}
