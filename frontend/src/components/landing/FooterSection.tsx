import { ShieldCheck, Code2, MessageCircle, Globe, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const LINKS = {
  Product: [
    { label: 'Analyze Job Posting', to: '/analyze' },
    { label: 'How It Works', to: '/about' },
    { label: 'Audit History', to: '/history' },
  ],
  Explainability: [
    { label: 'SHAP Global Framework', to: '/about#shap' },
    { label: 'LIME Token Attribution', to: '/about#lime' },
    { label: '0–100 Trust Score Engine', to: '/about#trust' },
    { label: 'Risk Categorization Rules', to: '/about#risk' },
  ],
  Research: [
    { label: 'EMSCAD Benchmark (17k+ Ads)', to: '#', external: true },
    { label: 'FraudBERT Architecture Paper', to: '#', external: true },
    { label: 'FastAPI / OpenAPI Schema', to: '/api-docs', external: true },
    { label: 'Model Evaluation Metrics', to: '#', external: true },
  ],
  Platform: [
    { label: 'Sign In', to: '/login' },
    { label: 'Create Account', to: '/register' },
    { label: 'User Dashboard', to: '/profile' },
  ],
};

export function FooterSection() {
  return (
    <footer className="relative bg-[#030307] border-t border-white/[0.06] overflow-hidden">
      {/* Top subtle radiant horizon line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-50"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6) 30%, rgba(99,102,241,0.6) 70%, transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">JobShield-XAI</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Explainable AI recruitment fraud defense. Built on Fine-Tuned BERT, SHAP, and LIME for job seekers worldwide.
            </p>

            {/* Operational Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>All Systems Operational</span>
            </div>

            {/* Social Links */}
            <div className="flex gap-2.5">
              {[
                { icon: Code2, href: '#', label: 'GitHub' },
                { icon: MessageCircle, href: '#', label: 'Discord' },
                { icon: Globe, href: '#', label: 'Docs' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-violet-500/30 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 font-mono">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-violet-300 transition-colors duration-200"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-sm text-slate-400 hover:text-violet-300 transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>© {new Date().getFullYear()} JobShield-XAI Framework. Academic Open Research Initiative.</p>
          <div className="flex items-center gap-2">
            <span>Core Stack:</span>
            {['PyTorch', 'BERT', 'SHAP', 'LIME', 'FastAPI'].map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-slate-400"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Security Disclosures</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
