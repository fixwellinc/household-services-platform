'use client';

import { EnhancedHeroSection } from '@/components/ui/hero/EnhancedHeroSection';

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className }: HeroSectionProps) {
  return (
    <div className={className}>
      <EnhancedHeroSection 
        variant="gradient-mesh"
        showStats={true}
        showTrustIndicators={true}
      />
    </div>
  );
}