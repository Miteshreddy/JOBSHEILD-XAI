import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  y?: number;
}

/** Fades + lifts its children into place the first time they scroll into view. */
export function Reveal({ delay = 0, y = 24, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center = true }: { eyebrow?: string; title: ReactNode; subtitle?: string; center?: boolean }) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.14em] text-accent">{eyebrow}</p>}
      <h2 className="text-gradient text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">{title}</h2>
      {subtitle && <p className="mt-4 text-[17px] leading-relaxed text-fg-muted">{subtitle}</p>}
    </Reveal>
  );
}
