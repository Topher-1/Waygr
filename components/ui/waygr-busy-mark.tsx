type WaygrBusyMarkProps = {
  className?: string;
  /** When the mark sits on an orange busy button (ink ring + W). */
  onAccent?: boolean;
};

/** Compact orange Waygr brand-ring spinner — not a generic beach ball. */
export function WaygrBusyMark({
  className = "",
  onAccent = false,
}: WaygrBusyMarkProps) {
  const ringClass = onAccent
    ? "border-[var(--on-accent)]/30 border-t-[var(--on-accent)]"
    : "border-[var(--orange)]/25 border-t-[var(--orange)]";
  const wClass = onAccent ? "fill-[var(--on-accent)]" : "fill-[var(--orange)]";

  return (
    <span
      className={`relative inline-flex h-4 w-4 shrink-0 items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <span
        className={`absolute inset-0 animate-spin rounded-[3px] border-2 ${ringClass}`}
      />
      <svg viewBox="0 0 1024 1024" className="relative h-2.5 w-2.5" role="img">
        <path
          className={wClass}
          d="M228.045 859.136 177.869 166.912Q177.869 153.6 190.157 153.6H335.565Q347.853 153.6 347.853 164.864L350.925 501.76Q350.925 504.832 353.485 504.832Q356.045 504.832 357.069 501.76L443.085 164.864Q446.157 153.6 457.421 153.6H573.133Q584.397 153.6 584.397 164.864L592.589 501.76Q593.613 504.832 595.661 504.832Q597.709 504.832 597.709 501.76L680.653 164.864Q681.677 153.6 692.941 153.6H836.301Q848.589 153.6 845.517 166.912L632.525 859.136Q629.453 870.4 618.189 870.4H491.213Q479.949 870.4 479.949 859.136L472.781 508.928Q472.781 505.856 470.221 505.856Q467.661 505.856 466.637 508.928L380.621 859.136Q377.549 870.4 367.309 870.4H240.333Q228.045 870.4 228.045 859.136Z"
        />
      </svg>
    </span>
  );
}
