import * as Accordion from '@radix-ui/react-accordion';
import { AnimatePresence, motion, useInView } from 'motion/react';
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  FileText,
  Globe,
  ImageIcon,
  Link2,
  Loader2,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BorderBeam,
  BurstArt,
  Divider,
  FxCard,
  GlyphArt,
  GrainWave,
  Magnetic,
  MeanderArt,
  OrbitArt,
  Ruler,
  ScanArt,
  SectionHead,
  SignalField,
  SplitReveal,
  Ticker,
  TwoTone,
} from '@/components/landing/Effects';
import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { MODEL_METRICS as M } from '@/lib/metrics';

const fade = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
};

/* ── Demo cases (real outputs from our test suite) ─────────────────────── */

const CASES = [
  { source: 'LinkedIn', who: 'Software Engineer · Microsoft', score: 99, scam: 0, verdict: 'Looks legitimate', tone: 'safe' as const, text: 'Overview — our team builds client and service components within Intune. Required: 3+ years of C# or C++.' },
  { source: 'Screenshot', who: '“Amazon” product reviewer', score: 1, scam: 99, verdict: 'Likely scam', tone: 'danger' as const, text: 'Like and rate products and earn commission per task. Pay Rs 1500 registration fee. Contact HR on Telegram.' },
  { source: 'Email', who: '“Microsoft HR” data entry', score: 1, scam: 89, verdict: 'Likely scam', tone: 'danger' as const, text: 'Contact hr.microsoft.jobs@gmail.com and complete onboarding at micros0ft-careers.com.' },
  { source: 'Pasted text', who: 'Remote package inspector', score: 1, scam: 77, verdict: 'Likely scam', tone: 'danger' as const, text: 'Receive parcels at your residence and reship them to our overseas clients. Weekly pay 2,400 USD.' },
];

function useCycle(length: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % length), ms);
    return () => clearInterval(t);
  }, [length, ms, i]);
  return [i, setI] as const;
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

const INPUTS = [
  { id: 'url', label: 'Link', icon: Link2 },
  { id: 'text', label: 'Text', icon: MessageSquareText },
  { id: 'image', label: 'Screenshot', icon: ImageIcon },
  { id: 'pdf', label: 'PDF', icon: FileText },
] as const;
type InputMode = (typeof INPUTS)[number]['id'];

function HeroChecker() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<InputMode>('url');
  const [value, setValue] = useState('');
  const isFile = mode === 'image' || mode === 'pdf';

  function choose(next: InputMode) {
    // Uploads happen on the Check a job page, opened on the right tab.
    if (next === 'image' || next === 'pdf') {
      navigate('/analyze', { state: { mode: next } });
      return;
    }
    setMode(next);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (isFile) return navigate('/analyze', { state: { mode } });
    navigate('/analyze', { state: { mode, value: value.trim(), autostart: value.trim().length > 0 } });
  }

  return (
    <motion.form {...fade} transition={{ ...fade.transition, delay: 0.5 }} onSubmit={submit} className="relative mx-auto mt-12 w-full max-w-2xl">
      <div className="mb-3 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="What do you want to check?">
        {INPUTS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => choose(id)}
            className={cn(
              'relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] transition-colors',
              mode === id ? 'text-bg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
            )}
          >
            {mode === id && <motion.span layoutId="hero-input-pill" className="absolute inset-0 rounded-full bg-fg" transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }} />}
            <Icon className="relative size-4" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>
      <div className="relative isolate overflow-hidden rounded-full border border-line-strong bg-bg/80 p-1.5 backdrop-blur-xl">
        <BorderBeam duration={9} />
        <div className="flex items-center gap-1">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === 'url' ? 'Paste a job link — LinkedIn, Indeed, a careers page…' : 'Paste the job post or recruiter message…'}
            aria-label={mode === 'url' ? 'Job link' : 'Job text'}
            className="h-10 min-w-0 flex-1 bg-transparent px-4 text-[15px] text-fg outline-none placeholder:text-fg-subtle"
          />
          <button type="submit" className={buttonClasses('primary', 'md', 'shrink-0')}>
            Check it <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </motion.form>
  );
}

function Hero() {
  const [i] = useCycle(CASES.length, 4200);
  const c = CASES[i];
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]">
        <SignalField />
      </div>
      <div className="container-page pb-20 pt-14 sm:pt-20">
        <h1 className="text-[34px] font-normal leading-[1.15] tracking-[-0.03em] sm:text-[40px]">
          <SplitReveal text="Meet JobShield" className="block text-fg" />
          <SplitReveal text="The verification layer for every job offer" delay={0.15} className="block text-fg-muted" />
        </h1>

        <motion.div {...fade} transition={{ ...fade.transition, delay: 0.3 }} className="mt-16">
          <Ruler value={c.score} labels={['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100']} format={(v) => `${Math.round(v)} legit`} />
        </motion.div>

        <div className="py-14 text-center">
          <p className="text-[44px] font-normal leading-[1.08] tracking-[-0.04em] sm:text-[64px]">
            <SplitReveal text="Postings in," delay={0.35} className="block text-fg" />
            <SplitReveal text="verdicts out" delay={0.5} className="block text-fg-muted" />
          </p>
          <div className="mt-6 h-6 text-[13px] text-fg-subtle">
            <AnimatePresence mode="wait">
              <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
                <span className="text-fg-muted">{c.source}</span> · {c.who} · <span className={c.tone === 'safe' ? 'text-safe' : 'text-danger'}>{c.verdict}</span>
              </motion.p>
            </AnimatePresence>
          </div>
          <HeroChecker />
        </div>

        <motion.div {...fade} transition={{ ...fade.transition, delay: 0.4 }}>
          <Ruler value={c.scam} flip labels={['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%']} format={(v) => `${Math.round(v)}% scam-like`} />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Signals ──────────────────────────────────────────────────────────── */

function Signals() {
  const cards = [
    { art: <OrbitArt />, title: 'Language analysis', body: 'A model trained on 22,000+ real and fraudulent postings scores the wording, and shows which words moved it.' },
    { art: <MeanderArt />, title: 'Source tracing', body: 'Follows the link to where the posting really lives: the employer’s site, a job board, or an anonymous form.' },
    { art: <GlyphArt />, title: 'Scam patterns', body: 'Fees, fake checks, crypto pay, reshipping, task schemes, ID harvesting and chat-app interviews.' },
    { art: <ScanArt />, title: 'Reasoning', body: 'A private AI model weighs all the evidence like an investigator and explains its conclusion.' },
  ];
  return (
    <section id="features" className="container-page scroll-mt-16">
      <Divider />
      <SectionHead label="Signals" title="Four independent signals" sub="that check what scammers can’t fake">
        A convincing description can’t outweigh a fake email address, and a famous logo can’t hide a fee request. Each signal is judged on its own, then combined.
      </SectionHead>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.title} {...fade} transition={{ ...fade.transition, delay: i * 0.08 }}>
            <FxCard className="flex h-full min-h-[420px] flex-col justify-between p-8">
              <div className="flex flex-1 items-center justify-center py-8">{c.art}</div>
              <div>
                <h3 className="text-[19px] tracking-[-0.01em]">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{c.body}</p>
              </div>
            </FxCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Live report mock ─────────────────────────────────────────────────── */

function ReportMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const rows = [
    ['Posting source', 'LinkedIn · employer page'],
    ['Employer', 'Microsoft · microsoft.com'],
    ['Links & emails', 'match the employer'],
    ['Scam patterns', 'none found'],
  ];
  return (
    <div ref={ref} className="grid items-end gap-0 lg:grid-cols-[1fr_1.35fr_1fr]">
      <motion.div {...fade} className="hidden h-full min-h-[440px] border border-r-0 border-line p-4 lg:block">
        <p className="flex items-center gap-2 text-[13px] text-fg-muted">
          <span className="flex size-5 items-center justify-center bg-surface-2 text-[10px] text-fg">in</span> LinkedIn · shared link
        </p>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }} className="mt-4 break-all bg-surface-2 p-3 text-[14px] leading-relaxed">
          linkedin.com/jobs/view/software-engineer-at-microsoft-4480367579
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.9 }} className="mt-3 flex items-center gap-2 text-[12px] text-fg-subtle">
          <Loader2 className="size-3.5 animate-spin" /> Checking…
        </motion.div>
      </motion.div>

      <motion.div {...fade} transition={{ ...fade.transition, delay: 0.1 }} className="relative isolate min-h-[520px] border border-line bg-bg">
        <BorderBeam duration={8} />
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[14px]">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> Microsoft <span className="text-fg-muted">on LinkedIn</span>
          </span>
          <span className="text-[12px] text-fg-subtle">Report</span>
        </div>
        <div className="border-b border-line px-4 py-5">
          <p className="text-[32px] tracking-[-0.02em]">{inView ? <Ticker to={99} duration={2.2} /> : 0}</p>
          <p className="text-[14px] text-fg-muted">legitimacy</p>
        </div>
        <div className="px-4 py-4">
          <div className="flex justify-between text-[12px] text-fg-muted">
            <span>Checks</span>
            <span>4 of 4 passed</span>
          </div>
          <ul className="mt-2 space-y-2.5">
            {rows.map(([k, v], idx) => (
              <motion.li key={k} initial={{ opacity: 0, x: -8 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.5 + idx * 0.25 }} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex items-center gap-2 font-mono text-fg-muted">
                  <Check className="size-3.5 text-safe" /> {k}
                </span>
                <span className="text-right">{v}</span>
              </motion.li>
            ))}
          </ul>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.6 }} className="mt-5 bg-surface p-4">
            <div className="flex justify-between text-[12px] text-fg-muted">
              <span className="flex items-center gap-1.5 text-fg">
                <BadgeCheck className="size-3.5" /> microsoft.com
              </span>
              <span>official website</span>
            </div>
            {[
              ['Language analysis', '0% scam-like'],
              ['Reasoning engine', 'legitimate · 95%'],
              ['Verification', '4 passed'],
            ].map(([k, v]) => (
              <div key={k} className="mt-2.5 flex justify-between text-[12px] text-fg-muted">
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="text-[14px]">Verdict</span>
              <span className="text-[20px] text-safe">Looks legitimate</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div {...fade} transition={{ ...fade.transition, delay: 0.2 }} className="flex h-full flex-col justify-center gap-10 py-10 lg:pl-16">
        <p className="text-[21px] leading-snug tracking-[-0.01em]">
          Paste one link. <span className="text-fg-muted">JobShield traces it, verifies it and explains it.</span>
        </p>
        <div>
          <p className="text-[14px] text-fg-muted">Every report includes</p>
          <ul className="mt-3 space-y-2 text-[15px]">
            {['Employer’s official website', 'Where it was published', 'Step-by-step reasoning', 'What to do next'].map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

function LiveReport() {
  return (
    <section className="container-page">
      <Divider />
      <div className="pb-14 pt-16 md:pt-24">
        <TwoTone title="Verification for every job offer" sub="an answer in a minute, not days" className="text-[30px] leading-[1.2] sm:text-[36px]" />
      </div>
      <ReportMock />
    </section>
  );
}

/* ── How it works (banner + bursts) ───────────────────────────────────── */

function TypingPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-100px' });
  const text = 'Congratulations! You are selected for Amazon work-from-home. Pay Rs 1500 registration fee and contact HR on Telegram.';
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setN((v) => (v >= text.length + 40 ? 0 : v + 1)), 38);
    return () => clearInterval(t);
  }, [inView, text.length]);
  const flags = [
    { at: 52, label: 'Brand named: Amazon' },
    { at: 88, label: 'Asks for a fee' },
    { at: 116, label: 'Telegram-only contact' },
  ];
  return (
    <div ref={ref} className="w-[min(640px,90%)] bg-[#0b0b0b] p-5 text-white shadow-2xl shadow-black/60">
      <div className="relative overflow-hidden bg-[#161616] p-4">
        <p className="flex items-center gap-2 text-[12px] text-white/50">
          <span className="flex size-5 items-center justify-center bg-white/10 text-[10px] text-white">J</span> JobShield · live check
        </p>
        <p className="mt-3 min-h-[72px] font-mono text-[13px] leading-relaxed text-white/85">
          {text.slice(0, n)}
          <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-white/80" />
        </p>
        <motion.div className="pointer-events-none absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent" animate={{ top: ['-20%', '110%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />
      </div>
      <div className="mt-3 flex min-h-8 flex-wrap gap-2">
        {flags.map((f) =>
          n > f.at ? (
            <motion.span key={f.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 bg-[#f87171]/15 px-2.5 py-1 text-[12px] text-[#fca5a5]">
              <CircleAlert className="size-3.5" /> {f.label}
            </motion.span>
          ) : null
        )}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { art: <BurstArt variant={0} />, title: 'Read it', body: 'Links, messages, screenshots and PDFs become clean text plus the employer, contacts, links and pay.' },
    { art: <BurstArt variant={1} />, title: 'Verify it', body: 'Every claim is checked against the outside world: official domains, job boards, domain age, look-alikes.' },
    { art: <BurstArt variant={2} />, title: 'Explain it', body: 'Evidence is weighed into one verdict, with the reasoning, the deciding factors and what to do next.' },
  ];
  return (
    <section id="how" className="container-page scroll-mt-16">
      <Divider />
      <SectionHead label="How it works" title="Every posting becomes a verdict" sub="the moment you paste it">
        Recruiter DMs, WhatsApp forwards and polished career pages go through the same pipeline, so a scam can’t slip through just by changing its format.
      </SectionHead>
      <motion.div {...fade}>
        <GrainWave seed={2} className="h-[420px]">
          <div className="flex h-[420px] items-center justify-center">
            <TypingPanel />
          </div>
        </GrainWave>
      </motion.div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div key={s.title} {...fade} transition={{ ...fade.transition, delay: i * 0.08 }}>
            <FxCard className="flex h-full min-h-[440px] flex-col justify-between p-10">
              <div className="flex flex-1 items-center justify-center">{s.art}</div>
              <div>
                <h3 className="text-[19px]">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            </FxCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Transparency (real metrics) ──────────────────────────────────────── */

function MetricBar({ label, value, note, delay }: { label: string; value: number; note: string; delay: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[14px]">{label}</span>
        <span className="text-[22px] tracking-tight">
          <Ticker to={value * 100} decimals={1} suffix="%" />
        </span>
      </div>
      <div className="mt-2 h-1 bg-surface-2">
        <motion.div className="h-full bg-fg" initial={{ width: 0 }} whileInView={{ width: `${value * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }} />
      </div>
      <p className="mt-1.5 text-[12px] text-fg-subtle">{note}</p>
    </div>
  );
}

function Transparency() {
  return (
    <section id="transparency" className="container-page scroll-mt-16">
      <Divider />
      <SectionHead label="Transparency" title="The only scam checker" sub="that shows its work">
        Every number below comes from {M.testSize.toLocaleString()} held-out postings the model never saw while training, after removing duplicates so it can’t cheat by memorising. Each report also shows which words moved the score.
      </SectionHead>
      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
        <FxCard className="flex flex-col justify-between p-8" beam>
          <p className="text-[14px] text-fg-muted">Ranking quality (ROC-AUC)</p>
          <p className="my-8 text-[72px] leading-none tracking-[-0.05em] sm:text-[88px]">
            <Ticker to={M.rocAuc * 100} decimals={1} suffix="%" duration={2.2} />
          </p>
          <svg viewBox="0 0 300 120" className="w-full text-fg" fill="none" aria-hidden>
            <motion.path d="M0 118 C 4 30, 20 8, 60 5 S 200 2, 300 2" stroke="currentColor" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2, ease: 'easeInOut' }} />
            <path d="M0 118 L300 2" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />
          </svg>
          <p className="mt-3 text-[12px] text-fg-subtle">How well the model ranks scams above genuine posts. 50% is a coin flip.</p>
        </FxCard>
        <FxCard className="grid gap-7 p-8 sm:grid-cols-2">
          <MetricBar label="Scams caught" value={M.recall} note={`Recall — ${Math.round(M.recall * M.testScams)} of ${M.testScams} test scams flagged`} delay={0} />
          <MetricBar label="Flags that were scams" value={M.precision} note="Precision of the language model alone" delay={0.1} />
          <MetricBar label="Overall accuracy" value={M.accuracy} note={`Across ${M.testSize.toLocaleString()} test postings`} delay={0.2} />
          <MetricBar label="Real LinkedIn jobs passed" value={M.linkedinLegitAccuracy} note={`${M.linkedinPostings} genuine 2023–24 postings`} delay={0.3} />
          <MetricBar label="F1 score" value={M.f1} note="Balance of catching scams and avoiding false alarms" delay={0.4} />
          <MetricBar label="PR-AUC" value={M.prAuc} note="Precision–recall area — robust when scams are rare" delay={0.5} />
        </FxCard>
      </div>
      <p className="mt-4 text-[13px] text-fg-subtle">These figures are for the language model alone. Final verdicts also use source verification and reasoning, which catch impersonation that wording can’t reveal.</p>
    </section>
  );
}

/* ── Examples (auto-advancing tabs) ───────────────────────────────────── */

function Cases() {
  const [i, setI] = useCycle(CASES.length, 6000);
  const c = CASES[i];
  return (
    <section className="container-page">
      <Divider />
      <SectionHead label="Examples" title="Same brands, opposite verdicts" sub="real results from our test suite" />
      <FxCard className="px-6 pb-10 pt-16 sm:px-16">
        <div className="mx-auto min-h-[220px] max-w-3xl text-center">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }} transition={{ duration: 0.5 }}>
              <p className="text-[22px] leading-[1.4] tracking-[-0.015em] sm:text-[28px]">“{c.text}”</p>
              <p className="mt-6 flex items-center justify-center gap-2 text-[14px]">
                {c.tone === 'safe' ? <CircleCheck className="size-4 text-safe" /> : <CircleX className="size-4 text-danger" />}
                <span className={c.tone === 'safe' ? 'text-safe' : 'text-danger'}>{c.verdict}</span>
                <span className="text-fg-muted">· {c.score}/100 legitimacy</span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4" role="tablist" aria-label="Examples">
          {CASES.map((x, idx) => (
            <button key={x.who} role="tab" aria-selected={idx === i} onClick={() => setI(idx)} className="text-left">
              <div className="h-px bg-line">{idx === i && <motion.div key={i} className="h-px bg-fg" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} />}</div>
              <div className={cn('mt-3 flex items-center gap-3 transition-opacity', idx === i ? 'opacity-100' : 'opacity-45 hover:opacity-75')}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2">{x.source === 'LinkedIn' ? <Globe className="size-3.5" /> : <MessageSquareText className="size-3.5" />}</span>
                <span className="min-w-0 text-[13px]">
                  <span className="block truncate">{x.who}</span>
                  <span className="text-fg-muted">{x.source}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </FxCard>
    </section>
  );
}

/* ── FAQ + CTA ────────────────────────────────────────────────────────── */

const FAQS = [
  { q: 'How accurate is it?', a: `The language model catches ${Math.round(M.recall * 100)}% of scams in a held-out test set and ranks scams above genuine posts ${(M.rocAuc * 100).toFixed(1)}% of the time. Verification and reasoning add checks wording can’t reveal, like look-alike domains. No tool is perfect, so every verdict shows its evidence.` },
  { q: 'Why did a famous company get a low score?', a: 'Scammers borrow famous names because people trust them. If the recruiter writes from a free email address, links to a look-alike domain, moves you to Telegram or asks for payment, the brand name doesn’t help.' },
  { q: 'Does it work for WhatsApp or Telegram messages?', a: 'Yes — paste the message or upload a screenshot. Many modern scams never appear on a job board, and that is itself one of the signals JobShield weighs.' },
  { q: 'Is my data private?', a: 'Analysis runs on your own computer. Only public lookups — fetching a job link, finding an employer’s website, checking a domain’s age — leave your machine.' },
];

function Faq() {
  return (
    <section id="faq" className="container-page scroll-mt-16">
      <Divider />
      <SectionHead label="FAQ" title="Questions, answered" sub="before you ask them" />
      <Accordion.Root type="single" collapsible className="grid gap-3 md:ml-[50%]">
        {FAQS.map((f) => (
          <Accordion.Item key={f.q} value={f.q} className="group bg-surface">
            <Accordion.Header>
              <Accordion.Trigger className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[16px]">
                {f.q}
                <ChevronDown className="size-4 shrink-0 text-fg-muted transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-6 pb-5 text-[15px] leading-relaxed text-fg-muted">{f.a}</Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative mt-16 overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]">
        <SignalField />
      </div>
      <div className="container-page py-32 text-center sm:py-40">
        <TwoTone title="From posting to proof" sub="know in under a minute" className="text-[40px] leading-[1.1] sm:text-[56px]" />
        <motion.div {...fade} transition={{ ...fade.transition, delay: 0.3 }} className="mt-10">
          <Magnetic>
            <Link to="/analyze" className={buttonClasses('primary', 'lg')}>
              <ScanSearch className="size-4" /> Check a job <ChevronRight className="size-4" />
            </Link>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <Signals />
      <LiveReport />
      <HowItWorks />
      <Transparency />
      <Cases />
      <Faq />
      <FinalCta />
    </>
  );
}
