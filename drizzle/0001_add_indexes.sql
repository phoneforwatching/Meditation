-- Performance Indexes for Meditation App
-- Run this migration to significantly speed up queries

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Profiles table (already has PK on user_id)

-- Meditation Sessions - Most queried table
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_completed_at ON meditation_sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_completed ON meditation_sessions(user_id, completed_at DESC);

-- Messages - For chat queries
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Nudges
CREATE INDEX IF NOT EXISTS idx_nudges_receiver_id ON nudges(receiver_id);
CREATE INDEX IF NOT EXISTS idx_nudges_sender_id ON nudges(sender_id);

-- Daily Checkins
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_created_at ON daily_checkins(created_at DESC);

-- Sleep Logs
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_id ON sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_created ON sleep_logs(user_id, created_at DESC);

-- Accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, provider_account_id);
