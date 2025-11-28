# Meditation App

A SvelteKit-based meditation application designed to help users relax and meditate.

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Database**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication & Backend**: [Supabase](https://supabase.com/)

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: Install Node.js (v18 or later recommended).
- **Supabase Project**: You need a Supabase project set up for authentication and database hosting.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd Meditation
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

## Configuration

1.  **Environment Variables:**

    Copy the example environment file and update it with your credentials:

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your specific configuration (Supabase URL, Anon Key, Database URL, etc.).

## Database Setup

This project uses Drizzle ORM. To push the schema to your database:

```bash
npx drizzle-kit push
```

To generate migrations (if configured):

```bash
npx drizzle-kit generate
```

## Running the App

Start the development server:

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

## Building for Production

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with:

```bash
npm run preview
```
# Meditation
