-- Enable Supabase Realtime for live page (BUILD-BRIEF · architecture.md)
-- Client subscriptions: games (score updates), challenges (state), messages (trash talk)

ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
