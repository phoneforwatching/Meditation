import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    // New fields
    emailVerified: timestamp('email_verified'),
    passwordHash: text('password_hash'),
    role: text('role', { enum: ['user', 'admin'] }).default('user'),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastActiveAt: timestamp('last_active_at'),

    createdAt: timestamp('created_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
    userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    timezone: text('timezone').default('UTC'),
    dailyGoalMinutes: integer('daily_goal_minutes').default(10),
});

export const accounts = pgTable('accounts', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: timestamp('expires_at'),
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

export const dailyCheckins = pgTable('daily_checkins', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    photoUrl: text('photo_url'), // Nullable for text-only notes
    mood: integer('mood').notNull(), // 1-5
    caption: text('caption'),
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

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    senderId: integer('sender_id').references(() => users.id).notNull(),
    receiverId: integer('receiver_id').references(() => users.id).notNull(),
    content: text('content').notNull(),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});
