import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { Verdict } from '@/types';

export const VERDICT_COPY: Record<Verdict, { label: string; tone: 'safe' | 'warn' | 'danger'; icon: typeof ShieldCheck }> = {
  legitimate: { label: 'Looks legitimate', tone: 'safe', icon: ShieldCheck },
  suspicious: { label: 'Needs verification', tone: 'warn', icon: ShieldQuestion },
  fraudulent: { label: 'Likely scam', tone: 'danger', icon: ShieldAlert },
};
