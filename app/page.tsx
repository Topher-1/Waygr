import { copy } from "@/lib/copy";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-5">
      <h1
        className="font-[family-name:var(--font-barlow)] text-4xl font-extrabold italic text-[var(--orange-strong)]"
      >
        {copy.appName}
      </h1>
      <p className="text-center text-[var(--muted)]">
        {copy.home.empty("Cowboys at Eagles, 7:20")}
      </p>
    </main>
  );
}
