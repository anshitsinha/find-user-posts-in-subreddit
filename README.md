# find-user-posts-in-subreddit

**A tool to see every post a specific user has made inside any subreddit.**

Reddit's native search is limited. History disappears into infinite scroll. There's no easy way to get a clean list of someone's posts in a community. This project — available as both a Chrome extension and a web app — gives you that snapshot.

> This runs entirely in your browser. Nothing is stored, logged, or sent anywhere except to Reddit's public API.

---

## 🔗 Deployed Website

**[find-user-posts-in-subreddit.vercel.app](https://find-user-posts-in-subreddit.vercel.app)** (or your actual Vercel/Netlify URL)

Just enter a subreddit and a username to get results instantly.

---

## 📦 Chrome Extension

The extension adds a **Scan** button next to usernames when you're browsing any subreddit.

### Install (unpacked)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this repository
5. Navigate to any Reddit subreddit (e.g. `https://www.reddit.com/r/AskReddit/`)

### How to use

1. Browse any subreddit — a small **Scan** button appears after each username
2. Click **Scan** — the extension fetches that user's posts in the current subreddit via Reddit's search API
3. A modal shows:
   - UTC timestamp of each post
   - Upvote score
   - Post title (clickable link)
4. Press **Esc** or click the overlay to close

> Only one Scan button appears per unique username on the page (no duplicates in comment threads).

### Extension files

| File | Purpose |
|---|---|
| `manifest.json` | Manifest V3 configuration, permissions for `*.reddit.com/*` |
| `background.js` | Service worker — proxies requests to Reddit's `search.json` API with `User-Agent` header |
| `content.js` | Injects Scan buttons via `MutationObserver`, manages the results modal |
| `styles.css` | Apple-minimal design with system light/dark mode support |

---

## 🌐 Website (Next.js)

A standalone web app with the same functionality, deployed as a static site.

### Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **CSS Modules** with `prefers-color-scheme` light/dark theme
- 100% client-side — calls Reddit's API directly from the browser

### Run locally

```bash
cd website
npm install
npm run dev
```

Open `http://localhost:3000`.

### Build for production

```bash
npm run build
```

Output goes to `website/.next/` (or `website/out/` if using `next export`).

---

## ⚙️ How it works

Both the extension and the website call the same Reddit endpoint:

```
GET https://www.reddit.com/r/{subreddit}/search.json?q=author:{username}&restrict_sr=1&sort=new&limit=100
```

With a custom `User-Agent` header to reduce rate-limit blocks:

```
User-Agent: extension:find-user-posts-in-subreddit:v1.0
```

### Known limitations

- **Max 100 results** — Reddit's search API won't return more
- **Deleted & removed posts** — don't appear in search results
- **Private/quarantined communities** — return 403 errors
- **Rate limits** — frequent requests may get a 429 response (wait and retry)

---

## 🧱 Project structure

```
find-user-posts-in-subreddit/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── styles.css
├── website/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── page.module.css
│   │   └── globals.css
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

---

## 📄 License

MIT — use it, modify it, share it. No affiliation with Reddit.