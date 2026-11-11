import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Sites Admin", template: "%s · Sites Admin" }, robots: { index: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        {children}
        <footer className="mt-auto w-full border-t border-slate-200/80 bg-white/85 px-4 py-4 text-center text-xs text-slate-600">
          <p>
            ©2026 Raise a Hood All Rights Reserved. Powered by{" "}
            <a
              href="https://dks.com.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-700 underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              DKS
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
