/** Small orange Waygr W mark for indeterminate busy states (not a generic spinner). */
export function WaygrBusyMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 animate-pulse ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1024 1024"
        className="h-4 w-4"
        role="img"
        aria-label=""
      >
        <rect
          width="1024"
          height="1024"
          rx="184"
          ry="184"
          className="fill-[var(--orange)]"
        />
        <path
          className="fill-[var(--on-accent)]"
          d="M228.045 859.136 177.869 166.912Q177.869 153.6 190.157 153.6H335.565Q347.853 153.6 347.853 164.864L350.925 501.76Q350.925 504.832 353.485 504.832Q356.045 504.832 357.069 501.76L443.085 164.864Q446.157 153.6 457.421 153.6H573.133Q584.397 153.6 584.397 164.864L592.589 501.76Q593.613 504.832 595.661 504.832Q597.709 504.832 597.709 501.76L680.653 164.864Q681.677 153.6 692.941 153.6H836.301Q848.589 153.6 845.517 166.912L632.525 859.136Q629.453 870.4 618.189 870.4H491.213Q479.949 870.4 479.949 859.136L472.781 508.928Q472.781 505.856 470.221 505.856Q467.661 505.856 466.637 508.928L380.621 859.136Q377.549 870.4 367.309 870.4H240.333Q228.045 870.4 228.045 859.136Z"
        />
      </svg>
    </span>
  );
}
