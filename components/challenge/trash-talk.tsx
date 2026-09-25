"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { copy } from "@/lib/copy";
import type {
  ChallengeLandingProfile,
  TrashTalkMessage,
} from "@/lib/challenges/types";
import { BusyButton } from "@/components/ui/busy-button";

type TrashTalkProps = {
  challengeId: string;
  viewer: ChallengeLandingProfile;
  creator: ChallengeLandingProfile;
  opponent: ChallengeLandingProfile;
  demoMode?: boolean;
};

type MessageRow = {
  id: number;
  body: string;
  author_id: string;
  created_at: string;
};

function mapMessage(row: MessageRow): TrashTalkMessage {
  return {
    id: row.id,
    body: row.body,
    authorId: row.author_id,
    createdAt: row.created_at,
  };
}

export function TrashTalk({
  challengeId,
  viewer,
  creator,
  opponent,
  demoMode = false,
}: TrashTalkProps) {
  const [messages, setMessages] = useState<TrashTalkMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayName = useCallback(
    (authorId: string) => {
      if (authorId === creator.id) return creator.displayName;
      if (authorId === opponent.id) return opponent.displayName;
      return "Someone";
    },
    [creator.displayName, creator.id, opponent.displayName, opponent.id],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (demoMode) {
      return;
    }

    const supabase = createClient();

    void supabase
      .from("messages")
      .select("id, body, author_id, created_at")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: true })
      .then(({ data, error: loadError }) => {
        if (loadError || !data) {
          return;
        }
        setMessages(data.map((row) => mapMessage(row as MessageRow)));
      });

    const channel = supabase
      .channel(`live-messages-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `challenge_id=eq.${challengeId}`,
        },
        (payload) => {
          const next = mapMessage(payload.new as MessageRow);
          setMessages((current) => {
            if (current.some((m) => m.id === next.id)) {
              return current;
            }
            return [...current, next];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [challengeId, demoMode]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || demoMode || sending) {
      return;
    }

    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("messages").insert({
      challenge_id: challengeId,
      author_id: viewer.id,
      body: trimmed.slice(0, 280),
    });
    setSending(false);

    if (insertError) {
      setError(copy.live.trashSendError);
      return;
    }

    setBody("");
  }

  return (
    <section className="flex min-h-48 flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        {copy.live.trashTitle}
      </h2>

      <div className="flex max-h-56 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            {demoMode ? copy.live.trashDemoEmpty : copy.live.trashEmpty}
          </p>
        ) : (
          messages.map((message) => {
            const isViewer = message.authorId === viewer.id;
            return (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  isViewer
                    ? "ml-auto bg-[var(--orange)] text-[var(--on-accent)]"
                    : "mr-auto bg-[var(--raised)] text-[var(--text)]"
                }`}
              >
                <p className="text-xs font-semibold opacity-80">
                  {displayName(message.authorId)}
                </p>
                <p>{message.body}</p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(event) => void handleSend(event)} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={280}
          placeholder={copy.live.trashPlaceholder}
          disabled={demoMode || sending}
          className="min-h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--raised)] px-3 text-base text-[var(--text)] placeholder:text-[var(--muted)] disabled:opacity-60"
        />
        <BusyButton
          type="submit"
          disabled={demoMode || !body.trim()}
          loading={sending}
          loadingLabel={copy.live.trashSending}
        >
          {copy.live.trashSend}
        </BusyButton>
      </form>
      {error ? <p className="text-sm text-[var(--rose)]">{error}</p> : null}
    </section>
  );
}
