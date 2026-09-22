import { motion } from 'motion/react';

export function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#030307]"
      style={{ contain: 'paint', willChange: 'transform' }}
    >
      {/* Dynamic Cyber Grid */}
      <div className="absolute inset-0 bg-grid-cyber opacity-[0.35] mask-radial-faded" />

      {/* Cyber Dots Pattern */}
      <div className="absolute inset-0 bg-dots-cyber opacity-[0.2]" />

      {/* Radiant Aurora Orbs (Hardware-Accelerated on GPU Compositor) */}
      {/* Orb 1 - Deep Violet Core */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 35, 0],
          y: [0, -25, 0],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
        className="absolute -top-[15%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/18 blur-[120px]"
      />

      {/* Orb 2 - Electric Indigo Accent */}
      <motion.div
        animate={{
          scale: [1.15, 0.95, 1.15],
          x: [0, -40, 0],
          y: [0, 35, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
        className="absolute top-[25%] -right-[10%] w-[550px] h-[550px] rounded-full bg-indigo-500/14 blur-[130px]"
      />

      {/* Orb 3 - Hot Fuchsia Flare */}
      <motion.div
        animate={{
          scale: [0.95, 1.1, 0.95],
          x: [0, 25, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
        className="absolute top-[65%] -left-[10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/12 blur-[130px]"
      />

      {/* Orb 4 - Cyber Cyan Flare */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, -35, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
        className="absolute bottom-0 right-[25%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[110px]"
      />

      {/* Top subtle vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030307]/50 to-[#030307]" />
    </div>
  );
}
