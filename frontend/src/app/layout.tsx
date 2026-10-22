import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CurrencyProvider } from '@/lib/currency-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { FloatingAiChatbot } from '@/components/ai/FloatingAiChatbot';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ACME - Enterprise Salary Management & Analytics',
  description: 'Multinational Salary Management & AI-Powered Analytics for 10,000 Employees',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={`${inter.className} bg-[#f4f7fb] text-slate-800 h-full overflow-hidden antialiased select-none`}>
        <AuthProvider>
          <CurrencyProvider>
            <div className="h-full w-full overflow-hidden relative">
              <Sidebar />
              <TopNav />
              <main className="fixed top-16 left-64 right-0 bottom-0 overflow-hidden bg-[#f4f7fb]">
                <div className="w-full h-full p-4 overflow-hidden flex flex-col min-h-0">
                  {children}
                </div>
              </main>
              {/* Global Floating AI Chatbot in bottom-right corner */}
              <FloatingAiChatbot />
            </div>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
