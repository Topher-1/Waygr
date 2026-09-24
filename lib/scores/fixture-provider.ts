import type { BdlGame } from '@/lib/scores/balldontlie';
import { mapBalldontlieGame, mapBalldontlieUpdate } from '@/lib/scores/balldontlie';
import type { GameUpdate, GameUpsert, League, ScoreProvider } from '@/lib/scores/types';

export type FixtureTimelineStep = {
  label: string;
  status: string;
  statusText: string;
  period: number;
  homeScore: number;
  awayScore: number;
  periodScores: { period: number; home: number; away: number }[];
};

export type NflFullGameFixture = {
  providerGameId: string;
  league: League;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  timeline: FixtureTimelineStep[];
};

function toBdlGame(fixture: NflFullGameFixture, step: FixtureTimelineStep): BdlGame {
  const homeQ = [null, null, null, null, null] as (number | null)[];
  const awayQ = [null, null, null, null, null] as (number | null)[];
  for (const ps of step.periodScores) {
    const idx = ps.period - 1;
    homeQ[idx] = ps.home;
    awayQ[idx] = ps.away;
  }

  return {
    id: Number(fixture.providerGameId),
    date: fixture.startsAt,
    status: step.statusText,
    status_state: step.status,
    home_team: { abbreviation: fixture.homeTeam.split(':')[1] },
    visitor_team: { abbreviation: fixture.awayTeam.split(':')[1] },
    home_team_score: step.homeScore,
    visitor_team_score: step.awayScore,
    home_team_q1: homeQ[0],
    home_team_q2: homeQ[1],
    home_team_q3: homeQ[2],
    home_team_q4: homeQ[3],
    home_team_ot: homeQ[4],
    visitor_team_q1: awayQ[0],
    visitor_team_q2: awayQ[1],
    visitor_team_q3: awayQ[2],
    visitor_team_q4: awayQ[3],
    visitor_team_ot: awayQ[4],
    time: null,
  };
}

export class FixtureScoreProvider implements ScoreProvider {
  readonly name = 'fixture';
  private stepIndex = 0;

  constructor(private readonly fixture: NflFullGameFixture) {}

  setStepIndex(index: number): void {
    this.stepIndex = index;
  }

  get currentStep(): FixtureTimelineStep {
    return this.fixture.timeline[this.stepIndex];
  }

  async listGames(league: League, _from: Date, _to: Date): Promise<GameUpsert[]> {
    if (league !== this.fixture.league) return [];
    const step = this.fixture.timeline[0];
    const mapped = mapBalldontlieGame(league, toBdlGame(this.fixture, step));
    return [
      {
        ...mapped,
        homeTeamCode: this.fixture.homeTeam,
        awayTeamCode: this.fixture.awayTeam,
        startsAt: new Date(this.fixture.startsAt),
      },
    ];
  }

  async getLive(providerGameIds: string[]): Promise<GameUpdate[]> {
    if (!providerGameIds.includes(this.fixture.providerGameId)) return [];
    const step = this.fixture.timeline[this.stepIndex];
    return [mapBalldontlieUpdate(toBdlGame(this.fixture, step))];
  }
}
