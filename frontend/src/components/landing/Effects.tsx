import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/* ── Text ─────────────────────────────────────────────────────────────── */

/** Word-by-word blur-in reveal for headlines. */
export function SplitReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: '0.35em', filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, delay: delay + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {word + ' '}
        </motion.span>
      ))}
    </span>
  );
}

/** Polar-style two-tone heading: a bright first line, a muted second line. */
export function TwoTone({ title, sub, className, as: Tag = 'h2' }: { title: string; sub?: string; className?: string; as?: 'h1' | 'h2' | 'h3' }) {
  return (
    <Tag className={cn('font-normal tracking-[-0.025em]', className)}>
      <SplitReveal text={title} className="block text-fg" />
      {sub && <SplitReveal text={sub} delay={0.15} className="block text-fg-muted" />}
    </Tag>
  );
}

/** Counts up to `to` when scrolled into view. */
export function Ticker({ to, decimals = 0, suffix = '', prefix = '', duration = 1.8 }: { to: number; decimals?: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, to, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ── Layout primitives ────────────────────────────────────────────────── */

/** Hairline that draws itself from the left when scrolled into view. */
export function Divider() {
  return (
    <motion.div
      className="h-px w-full origin-left bg-line"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

/** Editorial section header: label left, two-tone headline + copy right. */
export function SectionHead({ label, title, sub, children }: { label: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="grid gap-6 pb-14 pt-16 md:grid-cols-2 md:gap-12 md:pb-20 md:pt-24">
      <motion.p
        initial={{ opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="flex items-center gap-3 text-[26px] tracking-[-0.02em] text-fg"
      >
        <span className="size-1.5 rounded-full bg-accent shadow-[0_0_12px_rgb(var(--accent))]" />
        {label}
      </motion.p>
      <div>
        <TwoTone title={title} sub={sub} className="text-[26px] leading-[1.25] sm:text-[30px]" />
        {children && (
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.25 }} className="mt-10 text-[19px] leading-relaxed text-fg-muted">
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Card effects ─────────────────────────────────────────────────────── */

/** Flat card with a cursor spotlight and a light beam travelling its border. */
export function FxCard({ children, className, beam = false, spotlight = true }: { children: ReactNode; className?: string; beam?: boolean; spotlight?: boolean }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const bg = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgb(var(--accent) / 0.10), transparent 65%)`;
  const border = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, rgb(var(--fg) / 0.35), transparent 70%)`;
  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onMouseLeave={() => {
        mx.set(-400);
        my.set(-400);
      }}
      className={cn('group relative isolate overflow-hidden bg-surface', className)}
    >
      {spotlight && (
        <>
          <motion.div className="pointer-events-none absolute inset-0 -z-10" style={{ background: bg }} aria-hidden />
          {/* 1px border that lights up under the cursor */}
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: border, WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: 1 }}
            aria-hidden
          />
        </>
      )}
      {beam && <BorderBeam />}
      {children}
    </div>
  );
}

export function BorderBeam({ duration = 7 }: { duration?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: 1 }}
      aria-hidden
    >
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'conic-gradient(from 0deg, transparent 0 80%, rgb(var(--accent) / 0.9) 90%, transparent 100%)' }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/** Button wrapper that leans toward the cursor. */
export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const x = useSpring(0, { stiffness: 250, damping: 18 });
  const y = useSpring(0, { stiffness: 250, damping: 18 });
  return (
    <motion.div
      className="inline-block"
      style={{ x, y }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Hero: signal field ───────────────────────────────────────────────── */

/** Flowing lines on a canvas that bend away from the cursor. */
export function SignalField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    const mouse = { x: -9999, y: -9999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    function color(alpha: number) {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim().split(' ').slice(0, 3).join(',');
      return `rgba(${v || '245,245,245'},${alpha})`;
    }
    function accent(alpha: number) {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().split(' ').slice(0, 3).join(',');
      return `rgba(${v || '228,228,231'},${alpha})`;
    }
    function frame() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const lines = 34;
      for (let i = 0; i < lines; i++) {
        const base = (h / (lines + 1)) * (i + 1);
        const highlight = i === 17;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8 * dpr) {
          const wave = Math.sin(x / (260 * dpr) + t + i * 0.22) * 18 * dpr + Math.sin(x / (90 * dpr) - t * 1.6 + i) * 4 * dpr;
          const dx = x - mouse.x * dpr;
          const dy = base + wave - mouse.y * dpr;
          const d = Math.sqrt(dx * dx + dy * dy);
          const push = d < 160 * dpr ? ((160 * dpr - d) / (160 * dpr)) * 38 * dpr * Math.sign(dy || 1) : 0;
          const y = base + wave + push;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const fade = 0.04 + 0.12 * Math.sin((i / lines) * Math.PI);
        ctx.strokeStyle = highlight ? accent(0.7) : color(fade);
        ctx.lineWidth = (highlight ? 1.4 : 1) * dpr;
        ctx.stroke();
      }
      t += 0.006;
      raf = requestAnimationFrame(frame);
    }
    resize();
    if (reduce) {
      frame();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
    }
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [reduce]);
  return <canvas ref={ref} className={cn('h-full w-full', className)} aria-hidden />;
}

/* ── Rulers ───────────────────────────────────────────────────────────── */

/** Tick ruler with a labelled marker; `value` is 0-100. */
export function Ruler({ value, labels, format, flip = false }: { value: number; labels: string[]; format: (v: number) => string; flip?: boolean }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const left = useTransform(spring, (v) => `${v}%`);
  // Slide the pill's anchor with the value so it never overflows either end.
  const shift = useTransform(spring, (v) => `-${v}%`);
  const text = useTransform(spring, (v) => format(v));
  useEffect(() => mv.set(value), [value, mv]);
  const ticks = 72;
  const tickRow = (
    <div className="relative flex h-6 items-end justify-between">
      {Array.from({ length: ticks }).map((_, i) => (
        <span key={i} className={cn('w-px bg-fg/25', i % 6 === 0 ? 'h-4' : 'h-2.5')} />
      ))}
      <motion.span className="absolute bottom-0 h-7 w-px bg-fg" style={{ left }} />
    </div>
  );
  const labelRow = (
    <div className="relative mt-3 flex justify-between text-[11px] text-fg-subtle tabular-nums">
      {labels.map((l) => (
        <span key={l}>{l}</span>
      ))}
      <motion.span className="absolute -top-1 whitespace-nowrap rounded-full bg-fg px-2.5 py-0.5 text-[11px] font-medium text-bg shadow-[0_0_24px_rgb(var(--accent)/0.5)]" style={{ left, x: shift }}>
        {text}
      </motion.span>
    </div>
  );
  return <div className={cn('select-none', flip && 'flex flex-col-reverse')}>{flip ? <>{tickRow}<div className="mb-3">{labelRow}</div></> : <>{tickRow}{labelRow}</>}</div>;
}

/* ── Grain wave artwork ───────────────────────────────────────────────── */

/** Procedural grayscale wave field with film grain and slow drift — no image assets. */
export function GrainWave({ className, seed = 0, children }: { className?: string; seed?: number; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const lines = Array.from({ length: 46 }, (_, i) => {
    const off = i * 9;
    const a = 60 + ((seed * 37) % 40);
    return `M -50 ${120 + off} C 180 ${20 + off - a}, 360 ${260 + off + a}, 620 ${120 + off} S 900 ${-40 + off}, 1050 ${160 + off}`;
  });
  return (
    <div ref={ref} className={cn('relative isolate overflow-hidden bg-[#0d0d0d]', className)}>
      <motion.div className="absolute -inset-10" style={{ y }}>
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(60% 70% at ${30 + seed * 20}% ${40 + seed * 10}%, rgba(255,255,255,0.55), transparent 60%),
                         radial-gradient(50% 60% at ${80 - seed * 15}% ${70 - seed * 20}%, rgba(255,255,255,0.35), transparent 60%),
                         radial-gradient(40% 50% at 50% 50%, rgba(0,0,0,0.85), transparent 70%)`,
            filter: 'blur(18px)',
          }}
        />
        <motion.svg
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full mix-blend-overlay"
          animate={{ x: [0, -24, 0] }}
          transition={{ duration: 14 + seed * 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {lines.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="white" strokeOpacity={0.35} strokeWidth={2.2} />
          ))}
        </motion.svg>
      </motion.div>
      <div className="grain absolute inset-0 opacity-40 mix-blend-overlay" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ── Line art (draws itself in) ───────────────────────────────────────── */

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  shown: (i: number) => ({ pathLength: 1, opacity: 1, transition: { pathLength: { duration: 1.4, delay: 0.1 * i, ease: [0.65, 0, 0.35, 1] as const }, opacity: { duration: 0.2, delay: 0.1 * i } } }),
};

function Art({ children, viewBox = '0 0 200 200' }: { children: ReactNode; viewBox?: string }) {
  return (
    <motion.svg viewBox={viewBox} className="h-40 w-40 overflow-visible text-fg" fill="none" stroke="currentColor" strokeWidth={1.2} initial="hidden" whileInView="shown" viewport={{ once: true, margin: '-40px' }}>
      {children}
    </motion.svg>
  );
}

export function OrbitArt() {
  return (
    <Art>
      <motion.circle cx="100" cy="100" r="88" variants={draw} custom={0} />
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '100px 100px', transformBox: 'view-box' }}>
        <motion.circle cx="118" cy="100" r="56" variants={draw} custom={1} />
        <motion.circle cx="90" cy="100" r="22" variants={draw} custom={2} />
      </motion.g>
      <motion.circle cx="148" cy="100" r="3" fill="rgb(var(--accent))" stroke="none" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
    </Art>
  );
}

export function MeanderArt() {
  return (
    <Art>
      <motion.path d="M30 170 V60 a16 16 0 0 1 32 0 V140 a16 16 0 0 0 32 0 V60 a16 16 0 0 1 32 0 V140 a16 16 0 0 0 32 0 V40" variants={draw} custom={0} strokeOpacity={0.7} />
      <motion.path d="M140 54 L158 36 L176 54" variants={draw} custom={4} />
    </Art>
  );
}

export function GlyphArt() {
  return (
    <Art>
      <motion.path d="M32 58 H92 M62 28 V88" variants={draw} custom={0} />
      <motion.path d="M118 32 L168 82 M168 32 L118 82" variants={draw} custom={1} />
      <motion.circle cx="62" cy="142" r="28" variants={draw} custom={2} />
      <motion.path d="M143 108 V176 M113 125 L173 159 M113 159 L173 125" variants={draw} custom={3} />
    </Art>
  );
}

export function ScanArt() {
  return (
    <Art>
      <motion.rect x="34" y="40" width="132" height="120" variants={draw} custom={0} />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.path key={i} d={`M52 ${68 + i * 20} H${148 - (i % 2) * 34}`} variants={draw} custom={1 + i * 0.4} strokeOpacity={0.6} />
      ))}
      <motion.path d="M28 60 H172" stroke="rgb(var(--accent))" strokeWidth={1.6} animate={{ y: [0, 92, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} />
    </Art>
  );
}

export function BurstArt({ variant = 0 }: { variant?: 0 | 1 | 2 }) {
  const n = variant === 1 ? 26 : 14;
  const rays = Array.from({ length: n }, (_, i) => {
    const angle = variant === 2 ? Math.PI * (0.15 + (i / (n - 1)) * 0.7) : (i / n) * Math.PI * 2;
    const r1 = variant === 1 ? 18 + ((i * 37) % 40) : variant === 2 ? 30 : 24;
    const r2 = variant === 1 ? r1 + 14 : variant === 2 ? 70 + (i % 3) * 10 : 72;
    return { x1: 100 + Math.cos(angle) * r1, y1: 100 + Math.sin(angle) * r1, x2: 100 + Math.cos(angle) * r2, y2: 100 + Math.sin(angle) * r2 };
  });
  return (
    <Art>
      <motion.g animate={variant === 0 ? { rotate: 360 } : variant === 1 ? { scale: [1, 1.06, 1] } : {}} transition={{ duration: variant === 0 ? 30 : 3, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '100px 100px', transformBox: 'view-box' }}>
        {rays.map((r, i) => (
          <motion.line key={i} {...r} variants={draw} custom={i * 0.06} strokeOpacity={variant === 0 && i % 2 ? 0.4 : 1} />
        ))}
      </motion.g>
    </Art>
  );
}

export function WaveArt() {
  return (
    <Art>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.path key={i} d={`M10 ${70 + i * 12} C 60 ${30 + i * 12}, 140 ${120 + i * 12}, 190 ${70 + i * 12}`} variants={draw} custom={i * 0.3} strokeOpacity={0.3 + i * 0.12} />
      ))}
    </Art>
  );
}
