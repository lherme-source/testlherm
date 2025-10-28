import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel WJ — Amber',
  description: 'Painel com templates, contatos, broadcast e dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
