import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { PageTransition } from "@/components/PageTransition";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clinic Management System",
  description: "Healthcare clinic management solution",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50" suppressHydrationWarning>
        <NavigationProvider>
          <ToastProvider>
            <AuthProvider>
              <PageTransition>{children}</PageTransition>
            </AuthProvider>
          </ToastProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
