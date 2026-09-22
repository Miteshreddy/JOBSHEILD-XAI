import { type ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export function GradientText({
  children,
  className = '',
  animate = true,
}: GradientTextProps) {
  return (
    <span
      className={`
        bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-300
        bg-[length:200%_auto]
        bg-clip-text text-transparent
        ${animate ? 'animate-shimmer' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export function AuroraText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-white via-purple-200 to-violet-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

export function NeonText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

export function CyanText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

export function VioletText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

export function DangerText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}
