import { copy } from "@/lib/copy";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-5">
      <h1 className="text-title font-semibold text-[var(--text)]">
        {copy.live.lagging}
      </h1>
    </main>
  );
}
