import type { Metadata } from 'next';
import './globals.css';
import { ApolloWrapper } from '@/lib/apollo-wrapper';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/navbar';

export const metadata: Metadata = {
  title: 'Learning NestJS + Next.js + GraphQL',
  description: 'A learning project with NestJS, Next.js, and GraphQL',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
