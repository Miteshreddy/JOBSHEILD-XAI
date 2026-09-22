import { motion } from 'motion/react';
import { ShieldAlert, CheckCircle2, AlertOctagon, MapPin } from 'lucide-react';

interface ThreatEvent {
  id: string;
  type: 'CRITICAL' | 'BLOCKED' | 'VERIFIED';
  title: string;
  location: string;
  timeAgo: string;
}

const LIVE_EVENTS: ThreatEvent[] = [
  {
    id: '1',
    type: 'CRITICAL',
    title: '$140k Telegram Data Entry Wire Scam flagged',
    location: 'Austin, TX',
    timeAgo: '14s ago',
  },
  {
    id: '2',
    type: 'BLOCKED',
    title: 'Phishing domain impersonating Meta HR detected',
    location: 'London, UK',
    timeAgo: '42s ago',
  },
  {
    id: '3',
    type: 'VERIFIED',
    title: 'Legitimate Staff Cloud Architect verified',
    location: 'Seattle, WA',
    timeAgo: '1m ago',
  },
  {
    id: '4',
    type: 'CRITICAL',
    title: 'Identity Theft Fake Check scam neutralized',
    location: 'Toronto, CA',
    timeAgo: '2m ago',
  },
  {
    id: '5',
    type: 'BLOCKED',
    title: 'Ghost employer with unverified domain isolated',
    location: 'Sydney, AU',
    timeAgo: '3m ago',
  },
];

export function SecurityTicker() {
  return (
    <div className="w-full border-y border-white/[0.06] bg-black/40 backdrop-blur-md overflow-hidden py-2.5">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        {/* Live Indicator Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="font-bold uppercase tracking-wider">Live Intel</span>
        </div>

        {/* Marquee Ticker */}
        <div className="flex-1 overflow-hidden mask-linear-edges relative">
          <motion.div
            style={{ willChange: 'transform' }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              repeat: Infinity,
              ease: 'linear',
              duration: 35,
            }}
            className="flex items-center gap-8 whitespace-nowrap"
          >
            {[...LIVE_EVENTS, ...LIVE_EVENTS].map((ev, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300 font-mono">
                {ev.type === 'CRITICAL' ? (
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ) : ev.type === 'BLOCKED' ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="text-white font-medium">{ev.title}</span>
                <span className="text-slate-500 flex items-center gap-0.5 text-[11px]">
                  <MapPin className="w-3 h-3" /> {ev.location}
                </span>
                <span className="text-violet-400/80 text-[10px] bg-violet-500/10 px-1.5 py-0.5 rounded">
                  {ev.timeAgo}
                </span>
                <span className="text-slate-700">|</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
