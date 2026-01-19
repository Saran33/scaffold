'use client';

import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { siteConfig } from '@/config/site';

const text = siteConfig.tagline;

export const MarketingIntroText = () => {
  return (
    <TextGenerateEffect
      words={text}
      startDelay={1}
      className="max-w-2xl text-2xl leading-tight text-muted-foreground sm:text-3xl sm:leading-8"
    />
  );
};
