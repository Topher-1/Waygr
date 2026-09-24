import { copy } from "@/lib/copy";

type CustomForfeitChipProps = {
  selected: boolean;
  onSelect: () => void;
};

export function CustomForfeitChip({ selected, onSelect }: CustomForfeitChipProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mb-3 inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-[var(--orange)] bg-[var(--orange)] text-[var(--on-accent)]"
          : "border-[var(--border)] bg-[var(--raised)] text-[var(--text)] hover:border-[var(--orange)]"
      }`}
    >
      {copy.create.forfeits.custom}
    </button>
  );
}
