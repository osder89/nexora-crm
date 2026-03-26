import type { AppProps } from "next/app";
import { Geist, Geist_Mono } from "next/font/google";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { SuperLayout } from "@/features/super/screens/super-layout";
import { SessionActivityGuard } from "@/shared/components/session-activity-guard";
import { ToastProvider } from "@/shared/components/toast-provider";
import { TenantShell } from "@/shared/components/tenant-shell";
import type { PagePropsWithShell } from "@/services/pages/guards";

import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type ExtendedPageProps = PagePropsWithShell & {
  session?: Session | null;
};

type ExtendedAppProps = AppProps<ExtendedPageProps>;

export default function App({ Component, pageProps }: ExtendedAppProps) {
  const bodyClassName = `${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-100 text-slate-900 antialiased`;
  const shell = pageProps.appShell;
  const content = <Component {...pageProps} />;

  return (
    <main className={bodyClassName}>
      <SessionProvider session={pageProps.session} refetchOnWindowFocus={false} refetchWhenOffline={false}>
        <ToastProvider>
          <SessionActivityGuard />

          {shell?.kind === "tenant" ? (
            <TenantShell tenantName={shell.tenantName} role={shell.role} email={shell.email} links={shell.links}>
              {content}
            </TenantShell>
          ) : shell?.kind === "super" ? (
            <SuperLayout email={shell.email}>{content}</SuperLayout>
          ) : (
            content
          )}
        </ToastProvider>
      </SessionProvider>
    </main>
  );
}
