# Janmashtami Youth Festival 2026

MERN website for the IIIT Allahabad Janmashtami festival.

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create `server/.env` from `server/.env.example`.

3. Start MongoDB locally, or set `MONGODB_URI` to your hosted MongoDB connection string.

4. Run the backend and frontend in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:5000`

## Pages

- `/` festival homepage
- `/crowdfunding` crowd funding total, top-10 leaderboard, and contributor form

Anonymous contributors are stored in the database, but the public API only returns their contribution amount.
