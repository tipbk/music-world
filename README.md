# 🎵 Music World

Learn music theory in plain, simple words, made for composing **rhythm game songs** and **game BGM**.
Every lesson has sounds to play, things to click, and a small quiz. All sound is made in the browser (Web Audio), so there is no backend.

See the lesson list in [docs/LESSON_PLAN.md](docs/LESSON_PLAN.md).

## Open it online (GitHub Pages)

1. On GitHub, open this repo and go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Merge to `main` (or run the "Deploy to GitHub Pages" workflow from the **Actions** tab).
4. After about a minute, the site is at `https://<your-user>.github.io/music-world/`.

Every push to `main` updates the site automatically.

## Run it on your computer

```bash
npm install
npm run dev      # open the link it prints
npm run build    # makes the static site in dist/
```

Built with Vite + React + TypeScript.
