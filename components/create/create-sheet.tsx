"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import {
  defaultLine,
  stepLine,
  type CreateChallengeInput,
  type ForfeitKind,
  type Market,
  type Pick,
} from "@/lib/challenges/create";
import { formatKickoff } from "@/lib/challenges/format";
import {
  FORFEIT_PRESET_CATEGORIES,
  FORFEIT_PRESETS,
  type ForfeitPreset,
} from "@/lib/forfeit-presets";
import { CustomForfeitChip } from "@/components/create/custom-forfeit-chip";
import { screenCustomForfeit } from "@/lib/forfeit-screen";

type GameItem = {
  id: string;
  league: string;
  startsAt: string;
  status: string;
  homeTeam: {
    code: string;
    abbr: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
  };
  awayTeam: {
    code: string;
    abbr: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
  };
};

export type CreatePrefill = Partial<CreateChallengeInput>;

type CreateSheetProps = {
  open: boolean;
  onClose: () => void;
  prefill?: CreatePrefill | null;
  quickGameId?: string | null;
  onCreated?: (slug: string) => void;
};

type Step = "game" | "market" | "side" | "line" | "forfeit" | "preview";
type ForfeitMode = "presets" | "custom" | "custom_money";

const LAST_FORFEIT_KEY = "waygr-last-forfeit";

function groupGamesByDay(games: GameItem[]): Map<string, GameItem[]> {
  const groups = new Map<string, GameItem[]>();
  for (const game of games) {
    const day = new Date(game.startsAt).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const list = groups.get(day) ?? [];
    list.push(game);
    groups.set(day, list);
  }
  return groups;
}

function sideOptions(
  market: Market,
  game: GameItem | null,
): { value: Pick; label: string; color?: string }[] {
  if (!game) return [];
  if (market === "total") {
    return [
      { value: "over", label: "Over" },
      { value: "under", label: "Under" },
    ];
  }
  return [
    {
      value: "home",
      label: game.homeTeam.abbr,
      color: game.homeTeam.primaryColor,
    },
    {
      value: "away",
      label: game.awayTeam.abbr,
      color: game.awayTeam.primaryColor,
    },
  ];
}

export function CreateSheet({
  open,
  onClose,
  prefill,
  quickGameId,
  onCreated,
}: CreateSheetProps) {
  const [games, setGames] = useState<GameItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [step, setStep] = useState<Step>("game");
  const [gameId, setGameId] = useState<string | null>(null);
  const [market, setMarket] = useState<Market>("spread");
  const [creatorPick, setCreatorPick] = useState<Pick>("home");
  const [line, setLine] = useState(defaultLine("spread"));
  const [quarter, setQuarter] = useState<number>(1);
  const [forfeitKind, setForfeitKind] = useState<ForfeitKind>("concession");
  const [forfeitText, setForfeitText] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [forfeitMode, setForfeitMode] = useState<ForfeitMode>("presets");
  const [customMoney, setCustomMoney] = useState("");
  const [rematchOf, setRematchOf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const selectedGame = useMemo(
    () => games.find((g) => g.id === gameId) ?? null,
    [games, gameId],
  );

  const customScreenResult = useMemo(() => {
    if (forfeitMode === "custom") {
      return screenCustomForfeit(forfeitText);
    }
    if (forfeitMode === "custom_money") {
      const amount = customMoney.trim();
      if (!amount) {
        return { ok: false as const, reason: "empty" as const };
      }
      const normalized = amount.startsWith("$") ? amount : `$${amount}`;
      return screenCustomForfeit(normalized);
    }
    return { ok: true as const };
  }, [forfeitMode, forfeitText, customMoney]);

  const loadGames = useCallback(async () => {
    setLoadingGames(true);
    const res = await fetch("/api/games");
    const body = (await res.json()) as { games?: GameItem[] };
    setGames(body.games ?? []);
    setLoadingGames(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCreatedSlug(null);
    void loadGames();
  }, [open, loadGames]);

  useEffect(() => {
    if (!open) return;

    const stored = localStorage.getItem(LAST_FORFEIT_KEY);
    const lastForfeit = stored as ForfeitKind | null;

    if (prefill) {
      setGameId(prefill.gameId ?? null);
      setMarket(prefill.market ?? "spread");
      setCreatorPick(prefill.creatorPick ?? "home");
      setLine(prefill.line ?? defaultLine(prefill.market ?? "spread"));
      setQuarter(prefill.quarter ?? 1);
      setForfeitKind(prefill.forfeitKind ?? lastForfeit ?? "concession");
      setForfeitText(prefill.forfeitText ?? "");
      setRematchOf(prefill.rematchOf ?? null);
      setForfeitMode("presets");
      setSelectedPresetId(null);
      setCustomMoney("");
      setStep(prefill.gameId ? "market" : "game");
      return;
    }

    if (quickGameId) {
      setGameId(quickGameId);
      setMarket("spread");
      setCreatorPick("home");
      setLine(defaultLine("spread"));
      setForfeitKind(lastForfeit ?? "concession");
      setForfeitMode("presets");
      setStep("market");
      return;
    }

    setStep("game");
    setGameId(null);
    setMarket("spread");
    setCreatorPick("home");
    setLine(defaultLine("spread"));
    setQuarter(1);
    setForfeitKind(lastForfeit ?? "concession");
    setForfeitText("");
    setSelectedPresetId(null);
    setForfeitMode("presets");
    setCustomMoney("");
    setRematchOf(null);
  }, [open, prefill, quickGameId]);

  useEffect(() => {
    if (!open || !quickGameId || games.length === 0) return;
    if (games.some((g) => g.id === quickGameId)) {
      setGameId(quickGameId);
    }
  }, [open, quickGameId, games]);

  const grouped = useMemo(() => groupGamesByDay(games), [games]);

  function advanceFromMarket() {
    if (market === "quarter_winner") {
      setStep("side");
      return;
    }
    if (market === "spread" || market === "total") {
      setStep("side");
      return;
    }
    setStep("side");
  }

  function advanceFromSide() {
    if (market === "spread" || market === "total") {
      setLine(defaultLine(market));
      setStep("line");
      return;
    }
    if (market === "quarter_winner") {
      setStep("forfeit");
      return;
    }
    setStep("forfeit");
  }

  async function handleCreate(overrides?: {
    kind?: ForfeitKind;
    text?: string;
  }) {
    if (!gameId) return;
    const kind = overrides?.kind ?? forfeitKind;
    const text = overrides?.text ?? forfeitText;
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      gameId,
      market,
      creatorPick,
      forfeitKind: kind,
      rematchOf,
    };
    if (market === "spread" || market === "total") {
      payload.line = line;
    }
    if (market === "quarter_winner") {
      payload.quarter = quarter;
    }
    if (kind === "custom") {
      payload.forfeitText = text;
    }

    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as { ok?: boolean; slug?: string; reason?: string };
    setSubmitting(false);

    if (!res.ok || !body.ok || !body.slug) {
      setError(
        body.reason === "kickoff_soon"
          ? "Kickoff is under 2 minutes away."
          : body.reason === "forfeit_screened"
            ? copy.screening.rejected
            : body.reason === "adult_required"
              ? copy.auth.adultConfirmError
              : "Could not create. Try again.",
      );
      return;
    }

    setForfeitKind(kind);
    if (kind === "custom") {
      setForfeitText(text);
    }
    localStorage.setItem(LAST_FORFEIT_KEY, kind);
    setCreatedSlug(body.slug);
    setStep("preview");
    onCreated?.(body.slug);
  }

  function selectPreset(preset: ForfeitPreset) {
    setSelectedPresetId(preset.id);
    setForfeitMode("presets");
    setCustomMoney("");
    setForfeitKind(preset.kind);
    setForfeitText(preset.text ?? "");
    if (preset.kind === "custom" && preset.text) {
      void handleCreate({ kind: "custom", text: preset.text });
      return;
    }
    void handleCreate({ kind: preset.kind, text: preset.text ?? "" });
  }

  function submitCustomForfeit() {
    if (!customScreenResult.ok) {
      return;
    }
    const text =
      forfeitMode === "custom_money"
        ? customMoney.trim().startsWith("$")
          ? customMoney.trim()
          : `$${customMoney.trim()}`
        : forfeitText.trim();
    setForfeitKind("custom");
    setForfeitText(text);
    void handleCreate({ kind: "custom", text });
  }

  async function handleShare() {
    if (!createdSlug) return;
    const url = `${window.location.origin}/c/${createdSlug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: copy.appName,
          text: "You're on the line.",
          url,
        });
      } catch {
        await navigator.clipboard.writeText(url);
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
    onClose();
  }

  const showScreeningError =
    !customScreenResult.ok && customScreenResult.reason !== "empty";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={copy.create.pickGame}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-[family-name:var(--font-barlow)] text-xl font-bold">
            {step === "game"
              ? copy.create.pickGame
              : step === "market"
                ? copy.create.pickMarket
                : step === "side"
                  ? copy.create.pickSide
                  : step === "line"
                    ? copy.create.pickLine
                    : step === "forfeit"
                      ? copy.create.pickForfeit
                      : copy.create.preview}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="mb-3 text-sm text-[var(--rose)]" role="alert">{error}</p>
          ) : null}

          {step === "game" && (
            <div className="space-y-6">
              {loadingGames ? (
                <p className="text-[var(--muted)]">Loading games…</p>
              ) : games.length === 0 ? (
                <p className="text-[var(--muted)]">No games in the next 7 days.</p>
              ) : (
                [...grouped.entries()].map(([day, dayGames]) => (
                  <section key={day}>
                    <h3 className="mb-2 text-sm font-semibold text-[var(--muted)]">
                      {day}
                    </h3>
                    <ul className="space-y-2">
                      {dayGames.map((game) => (
                        <li key={game.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setGameId(game.id);
                              setStep("market");
                            }}
                            className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--raised)] p-3 text-left hover:border-[var(--orange)]"
                          >
                            <span
                              className="h-8 w-1 rounded-full"
                              style={{ background: game.awayTeam.primaryColor }}
                            />
                            <span
                              className="h-8 w-1 rounded-full"
                              style={{ background: game.homeTeam.primaryColor }}
                            />
                            <div className="flex-1">
                              <p className="font-semibold">
                                {game.awayTeam.abbr} at {game.homeTeam.abbr}
                              </p>
                              <p className="text-xs text-[var(--muted)]">
                                {game.league.toUpperCase()} · {formatKickoff(game.startsAt)}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              )}
            </div>
          )}

          {step === "market" && selectedGame && (
            <div className="grid grid-cols-2 gap-2">
              {(
                ["spread", "winner", "total", "half_leader", "quarter_winner"] as Market[]
              ).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMarket(m);
                    advanceFromMarket();
                  }}
                  className={`rounded-xl border px-4 py-3 text-left font-semibold ${
                    market === m
                      ? "border-[var(--orange)] bg-[var(--raised)]"
                      : "border-[var(--border)] bg-[var(--raised)]"
                  }`}
                >
                  {copy.create.markets[m]}
                </button>
              ))}
            </div>
          )}

          {step === "side" && selectedGame && (
            <div className="space-y-4">
              {market === "quarter_winner" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuarter(q)}
                      className={`flex-1 rounded-xl border py-2 font-semibold ${
                        quarter === q
                          ? "border-[var(--orange)]"
                          : "border-[var(--border)]"
                      }`}
                    >
                      Q{q}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {sideOptions(market, selectedGame).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setCreatorPick(opt.value);
                      advanceFromSide();
                    }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-6 text-center font-bold"
                    style={opt.color ? { borderColor: opt.color } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "line" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <p className="font-[family-name:var(--font-barlow)] text-5xl font-extrabold">
                {line > 0 ? `+${line}` : line}
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setLine(stepLine(line, "down"))}>
                  −0.5
                </Button>
                <Button variant="secondary" onClick={() => setLine(stepLine(line, "up"))}>
                  +0.5
                </Button>
              </div>
              <Button className="w-full" onClick={() => setStep("forfeit")}>
                {copy.create.next}
              </Button>
            </div>
          )}

          {step === "forfeit" && (
            <div className="space-y-5">
              <p className="text-sm text-[var(--muted)]">{copy.create.honorNote}</p>

              {FORFEIT_PRESET_CATEGORIES.map((category) => {
                const presets = FORFEIT_PRESETS.filter(
                  (preset) => preset.category === category.id,
                );
                return (
                  <section key={category.id}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {category.label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {presets.map((preset) => {
                        const selected =
                          selectedPresetId === preset.id && forfeitMode === "presets";
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={submitting}
                            onClick={() => selectPreset(preset)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                              selected
                                ? "border-[var(--orange)] bg-[var(--orange)] text-[var(--on-accent)]"
                                : "border-[var(--border)] bg-[var(--raised)] text-[var(--text)] hover:border-[var(--orange)]"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                      {category.id === "money" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setForfeitMode("custom_money");
                            setSelectedPresetId(null);
                          }}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                            forfeitMode === "custom_money"
                              ? "border-[var(--orange)] bg-[var(--orange)] text-[var(--on-accent)]"
                              : "border-[var(--border)] bg-[var(--raised)] text-[var(--text)] hover:border-[var(--orange)]"
                          }`}
                        >
                          {copy.create.customMoneyLabel}
                        </button>
                      ) : null}
                    </div>
                  </section>
                );
              })}

              <div className="border-t border-[var(--border)] pt-4">
                <CustomForfeitChip
                  selected={forfeitMode === "custom"}
                  onSelect={() => {
                    setForfeitMode("custom");
                    setSelectedPresetId(null);
                  }}
                />

                {forfeitMode === "custom" ? (
                  <textarea
                    value={forfeitText}
                    onChange={(e) => setForfeitText(e.target.value)}
                    maxLength={80}
                    rows={3}
                    placeholder={copy.create.customPlaceholder}
                    className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3"
                  />
                ) : null}

                {forfeitMode === "custom_money" ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    maxLength={12}
                    value={customMoney}
                    onChange={(e) => setCustomMoney(e.target.value)}
                    placeholder={copy.create.customMoneyPlaceholder}
                    className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-3 text-[var(--text)]"
                  />
                ) : null}

                {showScreeningError ? (
                  <p className="mb-3 text-sm text-[var(--rose)]" role="alert">
                    {copy.screening.rejected}
                  </p>
                ) : null}

                {forfeitMode === "custom" || forfeitMode === "custom_money" ? (
                  <Button
                    className="w-full"
                    disabled={!customScreenResult.ok || submitting}
                    onClick={() => submitCustomForfeit()}
                  >
                    {copy.create.next}
                  </Button>
                ) : null}
              </div>
            </div>
          )}

          {step === "preview" && createdSlug && selectedGame && (
            <div className="space-y-4 text-center">
              <p className="text-lg font-semibold">
                {selectedGame.awayTeam.abbr} at {selectedGame.homeTeam.abbr}
              </p>
              <p className="text-[var(--muted)]">
                {market} · {creatorPick}
                {market === "spread" || market === "total" ? ` ${line}` : ""}
              </p>
              <Button
                className="w-full"
                onClick={() => void handleShare()}
                disabled={submitting}
              >
                {copy.create.share}
              </Button>
            </div>
          )}
        </div>

        {step !== "preview" && step !== "forfeit" && step !== "line" && (
          <div className="border-t border-[var(--border)] p-4">
            {step !== "game" && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  const order: Step[] = ["game", "market", "side", "line", "forfeit", "preview"];
                  const idx = order.indexOf(step);
                  if (idx > 0) setStep(order[idx - 1]);
                }}
              >
                Back
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
