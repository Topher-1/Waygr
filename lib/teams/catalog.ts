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

/** Official-ish team identity colors for accent bars (not general UI palette). */
const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  "nfl:KC": { primary: "#E31837", secondary: "#FFB612" },
  "nfl:BUF": { primary: "#00338D", secondary: "#C60C30" },
  "nfl:DAL": { primary: "#003594", secondary: "#869397" },
  "nfl:PHI": { primary: "#004C54", secondary: "#A5ACAF" },
  "nfl:SF": { primary: "#AA0000", secondary: "#B3995D" },
  "nfl:GB": { primary: "#203731", secondary: "#FFB612" },
  "nfl:DET": { primary: "#0076B6", secondary: "#B0B7BC" },
  "nfl:BAL": { primary: "#241773", secondary: "#000000" },
  "nfl:CIN": { primary: "#FB4F14", secondary: "#000000" },
  "nfl:MIA": { primary: "#008E97", secondary: "#FC4C02" },
  "nfl:NYJ": { primary: "#125740", secondary: "#000000" },
  "nfl:NE": { primary: "#002244", secondary: "#C60C30" },
  "nfl:LAR": { primary: "#003594", secondary: "#FFA300" },
  "nfl:SEA": { primary: "#002244", secondary: "#69BE28" },
  "nfl:ATL": { primary: "#A71930", secondary: "#000000" },
  "nfl:HOU": { primary: "#03202F", secondary: "#A71930" },
  "nfl:NYG": { primary: "#0B2265", secondary: "#A71930" },
  "nfl:WAS": { primary: "#5A1414", secondary: "#FFB612" },
  "nfl:CHI": { primary: "#0B162A", secondary: "#C83803" },
  "nfl:MIN": { primary: "#4F2683", secondary: "#FFC62F" },
  "nfl:NO": { primary: "#D3BC8D", secondary: "#101820" },
  "nfl:TB": { primary: "#D50A0A", secondary: "#FF7900" },
  "nfl:CAR": { primary: "#0085CA", secondary: "#101820" },
  "nfl:ARI": { primary: "#97233F", secondary: "#000000" },
  "nfl:LV": { primary: "#000000", secondary: "#A5ACAF" },
  "nfl:IND": { primary: "#002C5F", secondary: "#A2AAAD" },
  "nfl:TEN": { primary: "#0C2340", secondary: "#4B92DB" },
  "nfl:JAX": { primary: "#101820", secondary: "#D7A22A" },
  "nfl:CLE": { primary: "#311D00", secondary: "#FF3C00" },
  "nfl:PIT": { primary: "#101820", secondary: "#FFB612" },
  "nfl:DEN": { primary: "#002244", secondary: "#FB4F14" },
  "nba:LAL": { primary: "#552583", secondary: "#FDB927" },
  "nba:BOS": { primary: "#007A33", secondary: "#BA9653" },
  "nba:GSW": { primary: "#1D428A", secondary: "#FFC72C" },
  "nba:NYK": { primary: "#006BB6", secondary: "#F58426" },
  "mlb:NYY": { primary: "#003087", secondary: "#E4002C" },
  "mlb:LAD": { primary: "#005A9C", secondary: "#EF3E42" },
  "mlb:BOS": { primary: "#BD3039", secondary: "#0C2340" },
  "mlb:CHC": { primary: "#0E3386", secondary: "#CC3433" },
  "mlb:ATL": { primary: "#CE1141", secondary: "#13274F" },
  "mlb:HOU": { primary: "#002D62", secondary: "#EB6E1F" },
  "mlb:OAK": { primary: "#003831", secondary: "#EFB21E" },
  "mlb:ATH": { primary: "#003831", secondary: "#EFB21E" },
  "mlb:LAA": { primary: "#BA0021", secondary: "#003263" },
  "mlb:SEA": { primary: "#0C2C56", secondary: "#005C5C" },
  "mlb:SD": { primary: "#2F241D", secondary: "#FFC425" },
  "mlb:BAL": { primary: "#DF4601", secondary: "#000000" },
  "mlb:NYM": { primary: "#002D72", secondary: "#FF5910" },
  "mlb:PHI": { primary: "#E81828", secondary: "#002D72" },
  "mlb:SF": { primary: "#FD5A1E", secondary: "#27251F" },
  "mlb:STL": { primary: "#C41E3A", secondary: "#0C2340" },
  "mlb:TB": { primary: "#092C5C", secondary: "#8FBCE6" },
  "mlb:TEX": { primary: "#003278", secondary: "#C0111F" },
  "mlb:TOR": { primary: "#134A8E", secondary: "#1D2D5C" },
  "mlb:WSH": { primary: "#AB0003", secondary: "#14225A" },
  "mlb:CLE": { primary: "#E31937", secondary: "#0C2340" },
  "mlb:DET": { primary: "#0C2340", secondary: "#FA4616" },
  "mlb:KC": { primary: "#004687", secondary: "#BD9B60" },
  "mlb:MIA": { primary: "#00A3E0", secondary: "#EF3340" },
  "mlb:MIL": { primary: "#12284B", secondary: "#FFC52F" },
  "mlb:MIN": { primary: "#002B5C", secondary: "#D31145" },
  "mlb:CIN": { primary: "#C6011F", secondary: "#000000" },
  "mlb:COL": { primary: "#33006F", secondary: "#C4CED4" },
  "mlb:ARI": { primary: "#A71930", secondary: "#E3D4AD" },
  "mlb:CWS": { primary: "#27251F", secondary: "#C4CED4" },
  "mlb:PIT": { primary: "#FDB827", secondary: "#27251F" },
};

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
  "nfl:ATL": "Falcons",
  "nfl:HOU": "Texans",
  "nfl:NYG": "Giants",
  "nfl:WAS": "Commanders",
  "nfl:CHI": "Bears",
  "nfl:MIN": "Vikings",
  "nfl:NO": "Saints",
  "nfl:TB": "Buccaneers",
  "nfl:CAR": "Panthers",
  "nfl:ARI": "Cardinals",
  "nfl:LAC": "Chargers",
  "nfl:LV": "Raiders",
  "nfl:IND": "Colts",
  "nfl:TEN": "Titans",
  "nfl:JAX": "Jaguars",
  "nfl:CLE": "Browns",
  "nfl:PIT": "Steelers",
  "nfl:DEN": "Broncos",
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
  "mlb:OAK": "Athletics",
  "mlb:LAA": "Angels",
  "mlb:SEA": "Mariners",
  "mlb:SD": "Padres",
  "mlb:BAL": "Orioles",
};

const TOKEN_PAIRS = [
  { primary: tokens.dark.orange, secondary: tokens.dark.onAccent },
  { primary: tokens.dark.blue, secondary: tokens.dark.onAccent },
  { primary: tokens.dark.green, secondary: tokens.dark.onAccent },
  { primary: tokens.dark.orangeStrong, secondary: tokens.dark.onAccent },
];

function fallbackColorPair(code: string) {
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

/** Resolve display info for a team code (official colors when known). */
export function resolveTeamInfo(code: string): TeamInfo {
  const { league, abbr } = parseTeamCode(code);
  const colors = TEAM_COLORS[code] ?? fallbackColorPair(code);
  return {
    code,
    league,
    abbr,
    name: TEAM_NAMES[code] ?? abbr,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
  };
}
