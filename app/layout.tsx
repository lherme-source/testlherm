import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WJ Chat Prototype',
  description: 'Painel de disparo e conversas com acento amarelo (amber).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
