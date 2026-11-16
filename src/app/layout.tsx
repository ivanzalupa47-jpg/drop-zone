import type { Metadata } from 'next';
import './globals.css';
import { DemoStateProvider } from '@/context/DemoStateContext';
import { LiveDropsTicker } from '@/components/layout/LiveDropsTicker';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'DROP ZONE — CS2 Case Arena (DEMO MODE)',
  description:
    'Интерактивная CS2 веб-платформа открытия кейсов и апгрейда скинов в безопасном режиме DEMO_MODE=true.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-dz-bg text-slate-100 antialiased">
        <DemoStateProvider>
          <div className="flex min-h-screen flex-col">
            <LiveDropsTicker />
            <Navbar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:pt-8">
              {children}
            </main>
            <Footer />
          </div>
        </DemoStateProvider>
      </body>
    </html>
  );
}
