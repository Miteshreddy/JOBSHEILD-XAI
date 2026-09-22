import { HeroSection } from '@/components/landing/HeroSection';
import { SecurityTicker } from '@/components/ui/SecurityTicker';
import { MarqueeBar } from '@/components/landing/MarqueeBar';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { StatsSection } from '@/components/landing/StatsSection';
import { DemoSection } from '@/components/landing/DemoSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { FooterSection } from '@/components/landing/FooterSection';

export function LandingPage() {
  return (
    <div className="w-full relative">
      <HeroSection />
      <SecurityTicker />
      <MarqueeBar />
      <FeaturesGrid />
      <HowItWorks />
      <StatsSection />
      <DemoSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
