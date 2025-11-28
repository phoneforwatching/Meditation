import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    googleId: text('google_id').unique(),
    displayName: text('display_name'),
    timezone: text('timezone').default('UTC'),
    dailyGoalMinutes: integer('daily_goal_minutes').default(10),
    createdAt: timestamp('created_at').defaultNow(),
});

export const meditationSessions = pgTable('meditation_sessions', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    sessionType: text('session_type').notNull(),
    moodRating: integer('mood_rating'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    completedAt: timestamp('completed_at').defaultNow(),
});

export const nudges = pgTable('nudges', {
    id: serial('id').primaryKey(),
    senderId: integer('sender_id').references(() => users.id).notNull(),
    receiverId: integer('receiver_id').references(() => users.id).notNull(),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const sleepLogs = pgTable('sleep_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    bedtime: timestamp('bedtime').notNull(),
    wakeTime: timestamp('wake_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    quality: integer('quality').default(3), // 1-5
    createdAt: timestamp('created_at').defaultNow(),
});
