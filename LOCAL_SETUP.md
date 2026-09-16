# SOLEN — Local Setup Guide

Everything you need to run SOLEN on your own PC.

---

## 1. One-time installs

| Tool       | Why                                   | Get it from                          |
| ---------- | ------------------------------------- | ------------------------------------ |
| **Node.js 20+** | runs both servers (npm comes with it) | https://nodejs.org — pick the **LTS** version |
| **Git**    | version history is included in the zip | https://git-scm.com |
| **VS Code** (optional) | best editor experience        | https://code.visualstudio.com |

Verify after installing (in a new terminal):

```bash
node --version   # v20.x or higher
npm --version
git --version
```

> **Windows tip:** use PowerShell or the built-in terminal in VS Code.
> All `npm` commands below work the same on Windows, macOS and Linux.

---

## 2. Run the project

```bash
# from the folder you extracted (the one containing package.json)
cd solen

npm install        # installs frontend + backend (a few minutes, once)
npm run dev        # starts BOTH servers
```

You should see:

```text
[frontend]   VITE ready        →  http://localhost:5173/
[backend]    [solen-api] ...   →  http://localhost:4000
```

Open **http://localhost:5173** — that's SOLEN.

Stop everything with `Ctrl + C`.

---

## 3. Verify it all works

| Check | What to do | Expected |
| ----- | ---------- | -------- |
| Homepage | open `http://localhost:5173` | hero, 7 destination cards, globe |
| Destination page | click any destination card | editorial page loads |
| Planner | “Build My Journey” → pick options → generate | full itinerary + budget |
| API | open `http://localhost:4000/api/health` | `{"status":"ok",...}` |
| Proxy | open `http://localhost:5173/api/health` | same JSON (frontend proxying to API) |

---

## 4. Useful commands

```bash
npm run dev             # frontend + backend together
npm run dev:frontend    # only the website
npm run dev:backend     # only the API
npm run build           # production build of the frontend
npm run lint            # code checks (should be 0 errors)
npm run format          # Prettier formatting pass

git status              # see what changed
git log --oneline       # history
git diff                # review your edits
```

---

## 5. Recommended VS Code extensions

- **EditorConfig for VS Code** — picks up `.editorconfig` automatically
- **Prettier** — format on save (config is in `.prettierrc.json`)
- **ESLint** — live linting for both frontend and backend

---

## 6. Troubleshooting

**`npm install` fails on `better-sqlite3`**
It normally downloads a ready-made binary. If it tries to compile and
fails, switch to Node 20 or 22 LTS (the project pins Node ≥ 20 in
`.nvmrc`) and run `npm install` again.

**Port already in use (5173 or 4000)**
Something else is running on that port — close it, or change the port:
frontend in `frontend/vite.config.js`, backend in `backend/.env`
(copy `backend/.env.example` first).

**Blank page after edits**
Check the terminal running `npm run dev` — syntax errors show up there.

---

## 7. Keeping in sync (next step)

This zip includes the full **git history**. The recommended way to sync
changes between your PC and the shared workspace is a private GitHub
repository:

1. Create a **private** repo on https://github.com (free account).
2. On your PC, inside the `solen` folder:
   ```bash
   git remote add origin https://github.com/<you>/solen.git
   git push -u origin main
   ```
3. Share the repo with the workspace (a fine-grained access token with
   Contents: read/write on this repo only is enough).

After that, both sides just `git pull` / `git push` — no more zips.
