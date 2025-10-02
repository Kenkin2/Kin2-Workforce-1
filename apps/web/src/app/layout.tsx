import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@kin2/ui';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Kin2 Workforce',
  description: 'Production-ready workforce management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={cn(inter.className, "min-h-screen bg-background")}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}