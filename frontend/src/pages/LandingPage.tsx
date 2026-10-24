import * as Accordion from '@radix-ui/react-accordion';
import { animate, motion, useInView, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  FileText,
  Globe,
  ImageIcon,
  Link2,
  Lock,
  MessageSquareText,
  ScanSearch,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Reveal, SectionHeading } from '@/components/ui/Reveal';
import { cn } from '@/lib/cn';

/* ── Hero ─────────────────────────────────────────────────────────────── */

function HeroChecker() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [value, setValue] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate('/analyze', { state: { mode, value: value.trim(), autostart: value.trim().length > 0 } });
  }

  return (
    <form onSubmit={submit} className="relative mx-auto mt-10 w-full max-w-2xl">
      <div className="absolute -inset-px rounded-[22px] bg-gradient-to-b from-accent/40 via-line-strong to-transparent opacity-70" aria-hidden />
      <div className="relative rounded-[21px] border border-line bg-surface/90 p-2 shadow-2xl shadow-accent/10 backdrop-blur">
        <div className="flex gap-1 px-1 pb-2 pt-1" role="tablist" aria-label="Input type">
          {(['url', 'text'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors', mode === m ? 'bg-surface-2 text-fg' : 'text-fg-subtle hover:text-fg')}
            >
              {m === 'url' ? <Link2 className="size-3.5" /> : <MessageSquareText className="size-3.5" />}
              {m === 'url' ? 'Job link' : 'Paste text'}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {mode === 'url' ? (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/view/…"
              aria-label="Job link"
              className="h-12 w-full rounded-xl bg-bg-subtle sm:flex-1 px-4 text-[15px] text-fg outline-none ring-1 ring-line placeholder:text-fg-subtle focus:ring-2 focus:ring-accent/60"
            />
          ) : (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              placeholder="Paste the job post, recruiter message or WhatsApp text…"
              aria-label="Job text"
              className="w-full resize-none rounded-xl bg-bg-subtle sm:flex-1 px-4 py-3 text-[15px] text-fg outline-none ring-1 ring-line placeholder:text-fg-subtle focus:ring-2 focus:ring-accent/60"
            />
          )}
          <Button type="submit" size="lg" className="sm:self-end" icon={<ScanSearch className="size-4" />}>
            Check it
          </Button>
        </div>
      </div>
    </form>
  );
}

function PreviewCheck({ status, label, detail, delay }: { status: 'pass' | 'warn' | 'fail'; label: string; detail: string; delay: number }) {
  const Icon = status === 'pass' ? CircleCheck : status === 'warn' ? CircleAlert : CircleX;
  const color = status === 'pass' ? 'text-safe' : status === 'warn' ? 'text-warn' : 'text-danger';
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-start gap-3 rounded-xl border border-line bg-bg-subtle px-3.5 py-3"
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', color)} />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-fg">{label}</p>
        <p className="truncate text-[12px] text-fg-muted">{detail}</p>
      </div>
    </motion.div>
  );
}

function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 25%'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.4, 1]);

  return (
    <div ref={ref} className="relative mx-auto mt-20 max-w-5xl [perspective:1400px]">
      <div className="absolute inset-x-10 -top-10 h-64 rounded-full bg-accent/25 blur-[100px]" aria-hidden />
      <motion.div style={{ rotateX, scale, opacity }} className="relative origin-top rounded-[24px] border border-line-strong bg-surface p-2 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-1.5 px-3 py-2">
          <span className="size-2.5 rounded-full bg-fg/15" />
          <span className="size-2.5 rounded-full bg-fg/15" />
          <span className="size-2.5 rounded-full bg-fg/15" />
          <span className="ml-3 truncate rounded-md bg-bg-subtle px-3 py-1 font-mono text-[11px] text-fg-subtle">jobshield.local/report/software-engineer-microsoft</span>
        </div>
        <div className="grid gap-4 rounded-[18px] border border-line bg-bg p-5 sm:p-7 md:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative flex size-24 items-center justify-center rounded-full border-[7px] border-safe/80 shadow-[0_0_30px_-4px_rgb(var(--safe)/0.6)]">
                <span className="text-3xl font-semibold tabular-nums">97</span>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-safe">
                  <BadgeCheck className="size-4" /> Looks legitimate
                </p>
                <p className="mt-1 text-xl font-semibold tracking-tight">Software Engineer · Microsoft</p>
                <p className="mt-0.5 text-[13px] text-fg-muted">Listed on LinkedIn by the employer’s verified page</p>
              </div>
            </div>
            <div className="mt-6 space-y-2.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-fg-subtle">Why</p>
              {[
                'The posting is published under Microsoft’s own company page on LinkedIn.',
                'No fees, deposits or off-platform chat are requested.',
                'Role, requirements and location are consistent with the employer.',
              ].map((t, i) => (
                <motion.p key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.25 }} className="flex gap-2.5 text-[14px] leading-relaxed text-fg-muted">
                  <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent" />
                  {t}
                </motion.p>
              ))}
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-subtle px-3.5 py-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface ring-1 ring-line">
                <Building2 className="size-4 text-fg-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">Microsoft</p>
                <p className="truncate text-[12px] text-accent">microsoft.com · official website</p>
              </div>
              <BadgeCheck className="size-4 text-safe" />
            </div>
            <PreviewCheck status="pass" label="Posting source" detail="LinkedIn · employer’s verified company page" delay={0.3} />
            <PreviewCheck status="pass" label="Employer identified" detail="Widely recognised employer, official site found" delay={0.45} />
            <PreviewCheck status="pass" label="Links in the posting" detail="Point to the employer or a recognised platform" delay={0.6} />
            <PreviewCheck status="pass" label="Scam patterns" detail="No fees, check deposits or chat-app interviews" delay={0.75} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid mask-radial absolute inset-0 -z-10" aria-hidden />
      <div className="absolute left-1/2 top-[-260px] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" aria-hidden />
      <div className="container-page pb-10 pt-16 text-center sm:pt-24">
        <Reveal>
          <a href="#how" className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/70 py-1 pl-1 pr-3 text-[13px] text-fg-muted backdrop-blur transition hover:text-fg">
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[12px] font-medium text-accent">New</span>
            Employer &amp; source verification for every check
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="text-gradient mx-auto mt-7 max-w-4xl text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-7xl">
            Know if a job is real <br className="hidden sm:block" />
            <span className="text-accent-gradient">before you apply.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-fg-muted sm:text-lg">
            Paste a link, message or screenshot. JobShield traces where it came from, confirms who is really hiring, and explains its verdict in plain language.
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <HeroChecker />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-fg-subtle">
            <span className="flex items-center gap-1.5"><CircleCheck className="size-3.5 text-safe" /> Free, no account needed</span>
            <span className="flex items-center gap-1.5"><Lock className="size-3.5" /> Runs on your machine</span>
            <span className="flex items-center gap-1.5"><Sparkles className="size-3.5 text-accent" /> Explains every verdict</span>
          </div>
        </Reveal>
        <ProductPreview />
      </div>
    </section>
  );
}

/* ── Marquee ──────────────────────────────────────────────────────────── */

const PLATFORMS = ['LinkedIn', 'Indeed', 'Glassdoor', 'Naukri', 'Wellfound', 'Greenhouse', 'Lever', 'Workday', 'ZipRecruiter', 'Internshala', 'SEEK', 'Company career sites', 'WhatsApp messages', 'Telegram messages', 'Email offers', 'Screenshots', 'PDF offer letters'];

function Marquee() {
  return (
    <section className="border-y border-line py-10">
      <p className="text-center text-[13px] text-fg-subtle">Checks postings and messages from</p>
      <div className="mask-fade-x mt-6 overflow-hidden">
        <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
            <span key={i} className="whitespace-nowrap rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-fg-muted">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ─────────────────────────────────────────────────────────── */

function BentoCard({ className, icon, title, body, children, delay = 0 }: { className?: string; icon: ReactNode; title: string; body: string; children?: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !ref.current) return;
    ref.current.style.setProperty('--x', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--y', `${e.clientY - r.top}px`);
  }
  return (
    <Reveal delay={delay} className={className}>
      <div
        ref={ref}
        onMouseMove={onMove}
        className="group relative h-full overflow-hidden rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-line-strong sm:p-7"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: 'radial-gradient(400px circle at var(--x) var(--y), rgb(var(--accent) / 0.09), transparent 60%)' }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">{icon}</div>
          <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{body}</p>
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </Reveal>
  );
}

function TypingLines({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="space-y-2 rounded-2xl border border-line bg-bg-subtle p-4 font-mono text-[12.5px] leading-relaxed text-fg-muted">
      {lines.map((l, i) => (
        <motion.p key={l} initial={{ opacity: 0, y: 6 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.55 }}>
          <span className="text-accent">{String(i + 1).padStart(2, '0')}</span> {l}
        </motion.p>
      ))}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="container-page scroll-mt-20 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Product"
        title="A second pair of eyes on every offer."
        subtitle="Scams have moved from shady job boards to LinkedIn DMs, WhatsApp groups and convincing career pages. JobShield checks the things scammers can’t fake."
      />
      <div className="mt-16 grid gap-4 md:grid-cols-6">
        <BentoCard
          className="md:col-span-4"
          icon={<Globe className="size-5" />}
          title="Traces where the posting really lives"
          body="Is it on the employer’s own site, an established job board under the employer’s verified page, an anonymous form, or a chat link? The channel says more than the wording."
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { k: 'Official site', v: 'careers.microsoft.com', s: 'pass' },
              { k: 'Job board', v: 'LinkedIn · verified page', s: 'pass' },
              { k: 'Anonymous', v: 'forms.gle/x8Yq…', s: 'fail' },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-line bg-bg-subtle p-3">
                <p className="text-[11px] uppercase tracking-wider text-fg-subtle">{x.k}</p>
                <p className={cn('mt-1 truncate text-[13px] font-medium', x.s === 'pass' ? 'text-safe' : 'text-danger')}>{x.v}</p>
              </div>
            ))}
          </div>
        </BentoCard>
        <BentoCard className="md:col-span-2" delay={0.05} icon={<Building2 className="size-5" />} title="Confirms who is hiring" body="Finds the employer’s official website and checks that every email and link belongs to them — not a look-alike like micros0ft-careers.com." />
        <BentoCard className="md:col-span-3" delay={0.05} icon={<Workflow className="size-5" />} title="Reasons like an investigator" body="Every verdict comes with the steps that led to it, so you can see exactly why — and disagree if you know better.">
          <TypingLines
            lines={[
              'Offer names Amazon but replies come from a Gmail address.',
              'Asks for a ₹2,000 “training kit” fee before joining.',
              'Interview happens only over Telegram.',
              'Verdict: likely scam — do not pay or share ID.',
            ]}
          />
        </BentoCard>
        <BentoCard className="md:col-span-3" delay={0.1} icon={<ScanSearch className="size-5" />} title="Knows today’s scam playbook" body="Fake-check equipment scams, task-and-commission apps, crypto payroll, reshipping, ID harvesting, visa-fee rackets and brand impersonation.">
          <div className="flex flex-wrap gap-2">
            {['Upfront fees', 'Fake checks', 'Task scams', 'Crypto salary', 'Reshipping', 'ID harvesting', 'Look-alike domains', 'Chat-only interviews'].map((t) => (
              <span key={t} className="rounded-full border border-line bg-bg-subtle px-3 py-1 text-[12.5px] text-fg-muted">{t}</span>
            ))}
          </div>
        </BentoCard>
        <BentoCard className="md:col-span-2" delay={0.05} icon={<ImageIcon className="size-5" />} title="Any format" body="Links, pasted text, recruiter messages, screenshots and PDF offer letters all go through the same checks." />
        <BentoCard className="md:col-span-2" delay={0.1} icon={<Lock className="size-5" />} title="Private by design" body="Analysis runs locally. Only public lookups — like an employer’s website — ever reach the internet." />
        <BentoCard className="md:col-span-2" delay={0.15} icon={<FileText className="size-5" />} title="A report you can keep" body="Sign in to keep a history of every check, revisit reports, and share a verdict with friends or family." />
      </div>
    </section>
  );
}

/* ── How it works (sticky scroll) ─────────────────────────────────────── */

const STEPS = [
  { title: 'Read', body: 'Extracts the posting from a link, screenshot, PDF or message — including the employer, contacts, links and pay.', icon: FileText },
  { title: 'Trace', body: 'Works out where it was published and whether that channel holds employers accountable, or lets anyone post anonymously.', icon: Globe },
  { title: 'Verify', body: 'Looks up the employer’s official website and checks every email domain and link against it, including domain age and look-alikes.', icon: BadgeCheck },
  { title: 'Decide', body: 'Weighs language patterns, scam red flags and verification results together, then explains the verdict step by step.', icon: Sparkles },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 60%', 'end 60%'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)))));
  const barHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section id="how" className="scroll-mt-20 border-t border-line bg-bg-subtle">
      <div className="container-page py-24 sm:py-32">
        <div ref={ref} className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <SectionHeading center={false} eyebrow="How it works" title="Four checks. One clear answer." subtitle="Each check is independent, so a convincing description can’t outweigh a fake email address — and a famous logo can’t hide a fee request." />
            <div className="mt-10 hidden gap-2 lg:flex">
              {STEPS.map((s, i) => (
                <div key={s.title} className={cn('h-1 flex-1 rounded-full transition-colors duration-500', i <= active ? 'bg-accent' : 'bg-line-strong')} />
              ))}
            </div>
          </div>
          <div className="relative space-y-6 pl-8">
            <div className="absolute bottom-0 left-[11px] top-0 w-px bg-line-strong" aria-hidden />
            <motion.div className="absolute left-[11px] top-0 w-px bg-accent" style={{ height: barHeight }} aria-hidden />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className={cn('relative rounded-3xl border p-6 transition-all duration-500 sm:p-8', i === active ? 'border-accent/40 bg-surface shadow-xl shadow-accent/5' : 'border-line bg-surface/50 opacity-60')}>
                  <span className={cn('absolute -left-[29px] top-8 flex size-[22px] items-center justify-center rounded-full border text-[11px] font-semibold transition-colors', i <= active ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-bg text-fg-subtle')}>
                    {i + 1}
                  </span>
                  <Icon className="size-5 text-accent" />
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Examples ─────────────────────────────────────────────────────────── */

function ExampleCard({ score, tone, title, source, points }: { score: number; tone: 'safe' | 'danger'; title: string; source: string; points: string[] }) {
  return (
    <div className="h-full rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <span className={cn('rounded-full px-3 py-1 text-[12px] font-medium', tone === 'safe' ? 'bg-safe/10 text-safe' : 'bg-danger/10 text-danger')}>{tone === 'safe' ? 'Looks legitimate' : 'Likely scam'}</span>
        <span className={cn('text-4xl font-semibold tabular-nums', tone === 'safe' ? 'text-safe' : 'text-danger')}>{score}</span>
      </div>
      <p className="mt-6 text-lg font-semibold tracking-tight">{title}</p>
      <p className="mt-1 text-[13px] text-fg-subtle">{source}</p>
      <ul className="mt-6 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-[14px] leading-relaxed text-fg-muted">
            {tone === 'safe' ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-safe" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-danger" />}
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Examples() {
  return (
    <section className="container-page py-24 sm:py-32">
      <SectionHeading eyebrow="Examples" title="Same brand. Opposite verdicts." subtitle="A famous name proves nothing on its own. What matters is whether the channel, contacts and asks are consistent with the real employer." />
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <Reveal>
          <ExampleCard score={97} tone="safe" title="Software Engineer II — Amazon" source="amazon.jobs · employer’s official careers site" points={['Hosted on Amazon’s own careers domain', 'Standard interview process, no payment requested', 'Contact and apply links all on amazon.jobs']} />
        </Reveal>
        <Reveal delay={0.08}>
          <ExampleCard score={3} tone="danger" title="“Amazon” work-from-home product reviewer" source="WhatsApp message" points={['Recruiter uses a Gmail address, not an Amazon domain', 'Pays per “task”, then asks you to top up a wallet', 'Moves the conversation to Telegram for “onboarding”']} />
        </Reveal>
      </div>
    </section>
  );
}

/* ── Stats ────────────────────────────────────────────────────────────── */

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setVal(Math.round(v)) });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

function Stats() {
  const items = [
    { n: 4, s: '', label: 'independent checks on every posting' },
    { n: 45, s: '+', label: 'job boards & hiring platforms recognised' },
    { n: 130, s: '+', label: 'major employers pre-verified' },
    { n: 0, s: '', label: 'postings stored off your machine' },
  ];
  return (
    <section className="border-y border-line bg-bg-subtle">
      <div className="container-page grid grid-cols-2 gap-8 py-16 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 0.06}>
            <p className="text-gradient text-4xl font-semibold tracking-tight sm:text-5xl">
              <Counter to={it.n} suffix={it.s} />
            </p>
            <p className="mt-2 text-sm text-fg-muted">{it.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */

const FAQS = [
  { q: 'How accurate is it?', a: 'No tool can guarantee a posting is safe, so every verdict shows its evidence. JobShield combines a language model trained on over 20,000 real and fraudulent job postings with source and employer verification. When the posting is published by a verified employer channel with no red flags, you’ll see a high score. When the evidence conflicts, it says so instead of guessing.' },
  { q: 'Why did a famous company get a low score?', a: 'Scammers borrow famous names precisely because people trust them. If the recruiter writes from a free email address, links to a look-alike domain, moves you to Telegram or asks for any payment, the brand name doesn’t help — the posting is judged on whether it really comes from that employer.' },
  { q: 'What should I do if a job looks suspicious?', a: 'Don’t pay anything or share ID or bank details. Find the employer’s official website yourself (the report links to it when it can) and look for the same role on their careers page, or contact their HR through official channels.' },
  { q: 'Does it work for WhatsApp or Telegram messages?', a: 'Yes. Paste the message or upload a screenshot. Many modern scams never appear on a job board at all, which is itself one of the signals JobShield weighs.' },
  { q: 'Is my data private?', a: 'Analysis runs on your own computer. Only public lookups — fetching a job link, finding an employer’s website, checking a domain’s age — leave your machine. Sign-in is optional and only used to keep your history.' },
];

function Faq() {
  return (
    <section id="faq" className="container-page scroll-mt-20 py-24 sm:py-32">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." />
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <Accordion.Root type="single" collapsible className="divide-y divide-line rounded-3xl border border-line bg-surface">
          {FAQS.map((f) => (
            <Accordion.Item key={f.q} value={f.q} className="group">
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[15px] font-medium text-fg">
                  {f.q}
                  <ChevronDown className="size-4 shrink-0 text-fg-subtle transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden px-6 text-[15px] leading-relaxed text-fg-muted data-[state=closed]:h-0 data-[state=open]:pb-5">
                {f.a}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Reveal>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-page pb-24 sm:pb-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-surface px-6 py-16 text-center sm:px-16 sm:py-24">
          <div className="bg-grid mask-radial absolute inset-0" aria-hidden />
          <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-accent/25 blur-[100px]" aria-hidden />
          <div className="relative">
            <h2 className="text-gradient mx-auto max-w-2xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Got an offer that feels too good?</h2>
            <p className="mx-auto mt-4 max-w-lg text-[17px] text-fg-muted">Check it in under a minute — before you reply, pay, or share a single document.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to="/analyze" size="lg">
                Check a job now <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink to="/register" size="lg" variant="secondary">
                Create a free account
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <Examples />
      <Stats />
      <Faq />
      <FinalCta />
    </>
  );
}
