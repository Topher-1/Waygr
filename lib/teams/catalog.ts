import type { League } from "@/lib/scores/types";
import { tokens } from "@/lib/theme";

export type TeamInfo = {
  code: string;
  league: League;
  abbr: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
};

/** Display names for common teams; colors use brand tokens only. */
const TEAM_NAMES: Record<string, string> = {
  "nfl:KC": "Chiefs",
  "nfl:BUF": "Bills",
  "nfl:DAL": "Cowboys",
  "nfl:PHI": "Eagles",
  "nfl:SF": "49ers",
  "nfl:GB": "Packers",
  "nfl:DET": "Lions",
  "nfl:BAL": "Ravens",
  "nfl:CIN": "Bengals",
  "nfl:MIA": "Dolphins",
  "nfl:NYJ": "Jets",
  "nfl:NE": "Patriots",
  "nfl:LAR": "Rams",
  "nfl:SEA": "Seahawks",
  "nba:LAL": "Lakers",
  "nba:BOS": "Celtics",
  "nba:GSW": "Warriors",
  "nba:NYK": "Knicks",
  "mlb:NYY": "Yankees",
  "mlb:LAD": "Dodgers",
  "mlb:BOS": "Red Sox",
  "mlb:CHC": "Cubs",
  "mlb:ATL": "Braves",
  "mlb:HOU": "Astros",
};

const TOKEN_PAIRS = [
  { primary: tokens.dark.orange, secondary: tokens.dark.onAccent },
  { primary: tokens.dark.blue, secondary: tokens.dark.onAccent },
  { primary: tokens.dark.green, secondary: tokens.dark.onAccent },
  { primary: tokens.dark.orangeStrong, secondary: tokens.dark.onAccent },
];

function colorPairForCode(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash + code.charCodeAt(i)) % TOKEN_PAIRS.length;
  }
  return TOKEN_PAIRS[hash];
}

export function parseTeamCode(code: string): { league: League; abbr: string } {
  const [league, abbr] = code.split(":");
  return { league: league as League, abbr };
}

/** Resolve display info for a team code. Colors stay on brand tokens. */
export function resolveTeamInfo(code: string): TeamInfo {
  const { league, abbr } = parseTeamCode(code);
  const colors = colorPairForCode(code);
  return {
    code,
    league,
    abbr,
    name: TEAM_NAMES[code] ?? abbr,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
  };
}
