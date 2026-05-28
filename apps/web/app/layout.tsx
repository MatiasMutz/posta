import type { Metadata } from 'next';
import { Instrument_Serif, Geist, JetBrains_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Posta — Hub de Gestión',
  description: 'Gestión comercial y financiera para PyMEs argentinas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${instrumentSerif.variable} ${geist.variable} ${jetbrainsMono.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
