import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { PageTransition } from '@/components/PageTransition';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clinic Management System",
  description: "Healthcare clinic management solution",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50" suppressHydrationWarning>
        <NavigationProvider>
          <WorkflowProvider>
            <ToastProvider>
              <AuthProvider>
                <PageTransition>{children}</PageTransition>
              </AuthProvider>
            </ToastProvider>
          </WorkflowProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
