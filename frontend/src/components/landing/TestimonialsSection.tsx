import { Quote, Star, CheckCircle2 } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Software Engineer',
    org: 'Recent Candidate',
    avatar: 'PS',
    quote:
      'I almost applied to a "senior remote developer" role offering $12,000/month for entry-level work. JobShield flagged it as Critical with a Trust Score of 8 — and the LIME explanation showed exactly why the advance equipment fee was the biggest red flag. It saved me from sharing my passport scans.',
    verdictFound: 'CRITICAL FRAUD DETECTED',
    verdictColor: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
  {
    name: 'Marcus Chen',
    role: 'Talent Acquisition Director',
    org: 'Global Talent Partners',
    avatar: 'MC',
    quote:
      'We bulk-analyze every external posting sent to us. The combination of deterministic domain verification with SHAP global explanations helps us verify legitimate recruiting partners in seconds rather than days.',
    verdictFound: 'SUSPICIOUS RECRUITER BLOCKED',
    verdictColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    name: 'Dr. Aisha Patel',
    role: 'Cybersecurity Researcher',
    org: 'Cyber Defense Lab',
    avatar: 'AP',
    quote:
      'The biggest problem with AI fraud detection has always been the black box. JobShield-XAI is the first tool where students and candidates can see the mathematical attribution behind every prediction.',
    verdictFound: 'PEER REVIEWED ACCURACY',
    verdictColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-violet-300 mb-4 backdrop-blur-md">
          <Quote className="w-3.5 h-3.5 text-violet-400" />
          <span>Real-World Impact</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Defending Candidates. <br />
          <span className="gradient-heading-neon">Exposing Sophisticated Scams.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
          Read how candidates, job seekers, and recruiters use JobShield-XAI to protect themselves from financial loss and identity theft.
        </p>
      </div>

      {/* Testimonial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <SpotlightCard
            key={idx}
            spotlightColor="rgba(168, 85, 247, 0.15)"
            className="flex flex-col justify-between h-full p-8"
          >
            <div>
              {/* Stars & Tag */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${t.verdictColor}`}>
                  {t.verdictFound}
                </span>
              </div>

              {/* Quote */}
              <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
            </div>

            {/* Author Info */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
                {t.avatar}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{t.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {t.role} · {t.org}
                </p>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
