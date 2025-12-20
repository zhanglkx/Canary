import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Canary - Full Stack App',
  description: 'Next.js 16 + NestJS 11 Full-Stack Application',
  keywords: ['Next.js', 'NestJS', 'TypeScript', 'Full-stack'],
  authors: [{ name: 'Development Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
