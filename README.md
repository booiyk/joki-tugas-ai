# ✦ AI Joki Tugas

Website jasa satu lot: **joki tugas**, **pembuatan website**, dan **solusi AI** untuk mahasiswa serta bisnis.

Built with vanilla HTML/CSS/JS + Three.js 3D hero animation. Static site → deploy to GitHub Pages.

## File Structure

```
joki-tugas-ai/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
└── README.md
```

## Run Locally

```bash
# No build step. Open in browser or serve statically:
npx serve .
# or
python3 -m http.server 8000
```

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g. `joki-tugas-ai`).
2. Push this folder to the repo.
3. In GitHub repo **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` / `gh-pages` → `/ (root)`
4. GitHub Pages URL: `https://<username>.github.io/joki-tugas-ai/`

## Notes

- The hero 3D scene uses [Three.js](https://threejs.org) from CDN (no build required).
- WhatsApp links are placeholders — replace `6281234567890` and `hi@jajokiai.example` with real contact details.
