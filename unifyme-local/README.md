# UnifyMe — Local Setup Guide

This is your UnifyMe project migrated from Replit to run locally with **VS Code + MongoDB**.

## What Changed from Replit

| Replit Version | Local Version |
|---|---|
| PostgreSQL + Drizzle ORM | MongoDB + Mongoose |
| Replit OIDC (Google login) | Local username/password auth + JWT |
| Workspace packages (`@workspace/db`, etc.) | Everything in one flat structure |
| Replit env variables (`REPL_ID`, etc.) | Standard `.env` file |
| `PORT` required by Vite | Vite uses default port 5173 |
| Replit vite-plugin-runtime-error-modal | Removed (dev-only Replit tool) |

---

## Prerequisites

Install these before starting:

1. **Node.js 20+** — https://nodejs.org
2. **MongoDB** (one of these options):
   - **Local install**: https://www.mongodb.com/try/download/community
   - **MongoDB Atlas (free cloud)**: https://www.mongodb.com/atlas (no local install needed)
3. **VS Code** — https://code.visualstudio.com

---

## Project Structure

```
unifyme-local/
├── api-server/          # Express + TypeScript backend (port 3001)
│   ├── src/
│   │   ├── models/      # Mongoose models (User, Post, Like, Comment, Follow, Message)
│   │   ├── routes/      # API routes (auth, users, posts, messages)
│   │   ├── middlewares/ # JWT auth middleware
│   │   ├── lib/         # DB connection, auth utilities
│   │   ├── app.ts       # Express app setup
│   │   └── index.ts     # Server entry point
│   ├── .env.example     # Copy to .env and fill in
│   └── package.json
│
└── unifyme/             # Vanilla JS frontend (port 5173)
    ├── src/             # All frontend JS/CSS files
    ├── public/          # Static assets
    ├── index.html
    ├── vite.config.js   # Proxies /api → localhost:3001
    └── package.json
```

---

## Step 1: Set Up MongoDB

### Option A — Local MongoDB
1. Install MongoDB Community from the link above
2. Start it: `mongod` (or it runs as a service automatically)
3. Your connection string will be: `mongodb://localhost:27017/unifyme`

### Option B — MongoDB Atlas (Free Cloud)
1. Create a free account at https://www.mongodb.com/atlas
2. Create a free M0 cluster
3. Go to **Database Access** → Add a user with username + password
4. Go to **Network Access** → Add your IP (or `0.0.0.0/0` for anywhere)
5. Go to **Connect** → Copy your connection string, it looks like:
   `mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/unifyme`

---

## Step 2: Configure the Backend

```bash
cd api-server
cp .env.example .env
```

Open `api-server/.env` and fill in:

```env
# If using local MongoDB:
MONGODB_URI=mongodb://localhost:27017/unifyme

# If using Atlas, paste your connection string:
# MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/unifyme

# Make this a long random string (keep it secret):
JWT_SECRET=replace-this-with-a-long-random-secret-string

PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## Step 3: Install Dependencies

Open two terminals in VS Code.

**Terminal 1 — Backend:**
```bash
cd api-server
npm install
```

**Terminal 2 — Frontend:**
```bash
cd unifyme
npm install
```

---

## Step 4: Run the App

**Terminal 1 — Start the API server:**
```bash
cd api-server
npm run dev
```
You should see:
```
✅ Connected to MongoDB
🚀 API server listening on http://localhost:3001
```

**Terminal 2 — Start the frontend:**
```bash
cd unifyme
npm run dev
```
You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser. ✅

---

## Step 5: Create Your First Account

The app uses local username/password auth now (no Google login).
- Go to http://localhost:5173
- Click **Sign Up** and create an account
- Log in and start using the app

---

## VS Code Recommended Extensions

Install these for the best experience:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **MongoDB for VS Code** (`mongodb.mongodb-vscode`) — browse your DB visually
- **Thunder Client** (`rangav.vscode-thunder-client`) — test API endpoints

---

## API Endpoints Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register `{ username, password, displayName? }` |
| POST | `/api/auth/login` | Login `{ username, password }` |
| GET | `/api/auth/user` | Get current user |
| GET | `/api/auth/logout` | Logout |

### Posts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts` | Get all posts (feed) |
| POST | `/api/posts` | Create post `{ imageUrl, caption? }` |
| DELETE | `/api/posts/:id` | Delete your post |
| POST | `/api/posts/:id/likes` | Like a post |
| DELETE | `/api/posts/:id/likes` | Unlike a post |
| GET | `/api/posts/:id/comments` | Get comments |
| POST | `/api/posts/:id/comments` | Add comment `{ content }` |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List users (optional `?q=search`) |
| GET | `/api/users/:username` | Get user profile |
| GET | `/api/users/:username/posts` | Get user's posts |
| POST | `/api/users/:username/follow` | Follow user |
| DELETE | `/api/users/:username/follow` | Unfollow user |
| PATCH | `/api/profile` | Update your profile |

### Messages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages/conversations` | Get all conversations |
| GET | `/api/messages/:username` | Get messages with user |
| POST | `/api/messages/:username` | Send message `{ content }` |

---

## Deploying to a Server

When you're ready to host this:

1. Build the frontend: `cd unifyme && npm run build` → static files in `unifyme/dist/`
2. Build the backend: `cd api-server && npm run build` → compiled JS in `api-server/dist/`
3. Serve the static files with Nginx/Caddy
4. Run the API with `node dist/index.js` (or use PM2: `pm2 start dist/index.js`)
5. Set `NODE_ENV=production` and a strong `JWT_SECRET` in production `.env`

---

## Troubleshooting

**"Cannot connect to MongoDB"**
- Make sure MongoDB is running (`mongod` or check Atlas)
- Double-check your `MONGODB_URI` in `.env`

**"CORS error" in browser**
- Make sure `CLIENT_URL=http://localhost:5173` is set in `api-server/.env`
- Make sure both servers are running

**"Port already in use"**
- Change `PORT=3001` in `api-server/.env` and update Vite proxy in `unifyme/vite.config.js`

**"JWT_SECRET is required"**
- You must copy `.env.example` to `.env` and set a value for `JWT_SECRET`
