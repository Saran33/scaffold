'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { siteConfig } from '@/config/site';
import { LogoBorderGradient } from '@/components/ui/logo-hover-border-gradient';

// const heading = siteConfig.name
const heading = siteConfig.name;

export function MarketingHeading() {
  return (
    <AnimatePresence>
      <LogoBorderGradient />
      <motion.h1
        key="marketing-heading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ ease: 'easeIn', duration: 1 }}
        className="font-brand text-3xl sm:text-5xl md:text-6xl lg:text-7xl"
      >
        {heading}
      </motion.h1>
    </AnimatePresence>
  );
}
