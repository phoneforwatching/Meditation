CREATE TABLE "meditation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"session_type" text NOT NULL,
	"mood_rating" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"timezone" text DEFAULT 'UTC',
	"daily_goal_minutes" integer DEFAULT 10,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "meditation_sessions" ADD CONSTRAINT "meditation_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;