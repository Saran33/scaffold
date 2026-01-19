// fonts.ts
import {
  JetBrains_Mono as FontMono,
  Inter as FontSans,
  Exo_2,
  Nunito_Sans,
  Fredoka,
} from 'next/font/google';

export const fontBrand = Fredoka({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-brand',
  display: 'swap',
});

export const fontExo = Exo_2({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-exo', // keep the same CSS var name
  display: 'swap',
});

export const fontNunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// optional exports
export const fontBrandClass = fontBrand.variable;
export const fontExoClass = fontExo.variable;
export const fontNunitoClass = fontNunito.variable;
export const fontSansClass = fontSans.variable;
export const fontMonoClass = fontMono.variable;
