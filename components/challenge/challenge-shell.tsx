import type { ReactNode } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

type ChallengeShellProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function ChallengeShell({ children, footer }: ChallengeShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="px-5 pt-6">
        <Link
          href="/"
          className="inline-block font-[family-name:var(--font-barlow)] text-2xl font-extrabold italic text-[var(--orange-strong)]"
        >
          {APP_NAME}
        </Link>
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 py-8">{children}</main>
      {footer ? (
        <footer className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--surface)] p-5">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
