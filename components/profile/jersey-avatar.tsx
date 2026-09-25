import { isJerseyActive, jerseyDaysRemaining } from "@/lib/forfeits/actions";
import { copy } from "@/lib/copy";

type JerseyAvatarProps = {
  displayName: string;
  avatarUrl: string | null;
  jerseyTeam: string | null;
  jerseyUntil: string | null;
  size?: number;
  now?: Date;
};

/**
 * Avatar with the jersey frame while a jersey-swap forfeit is live
 * (BUILD · Profile). The frame uses rival blue — wearing someone else's
 * colors is never your orange (BRAND-BRIEF).
 */
export function JerseyAvatar({
  displayName,
  avatarUrl,
  jerseyTeam,
  jerseyUntil,
  size = 88,
  now = new Date(),
}: JerseyAvatarProps) {
  const active = isJerseyActive({ jerseyTeam, jerseyUntil }, now);
  const days = jerseyDaysRemaining({ jerseyTeam, jerseyUntil }, now);
  const initial = (displayName.trim().charAt(0) || "?").toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div
        className={
          active
            ? "rounded-full p-1 ring-4 ring-[var(--blue)]"
            : "rounded-full p-1"
        }
        data-jersey-frame={active ? "active" : "off"}
        aria-label={
          active && jerseyTeam ? copy.profile.jerseyFrame(jerseyTeam) : undefined
        }
      >
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt=""
            width={size}
            height={size}
            className="rounded-full object-cover"
            style={{ width: size, height: size }}
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex items-center justify-center rounded-full bg-[var(--orange)] font-[family-name:var(--font-barlow)] text-3xl font-extrabold text-[var(--on-accent)]"
            style={{ width: size, height: size }}
          >
            {initial}
          </span>
        )}
      </div>

      {active && jerseyTeam ? (
        <span className="rounded-full border border-[var(--blue)] px-3 py-1 text-xs font-semibold text-[var(--blue)]">
          {copy.forfeit.jerseyActive(jerseyTeam, days)}
        </span>
      ) : null}
    </div>
  );
}
