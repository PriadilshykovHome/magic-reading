# Чарівні пригоди Мишка

A Ukrainian reading game for a 5-year-old: syllables → words → sentences.
Live at <https://priadilshykovhome.github.io/magic-reading/>.

- Plan: [docs/PLAN.md](docs/PLAN.md)
- Conventions: [CLAUDE.md](CLAUDE.md)

```bash
npm install
npm run dev     # http://localhost:5173/magic-reading/
npm test
npm run build
```

Every push to `main` is linted, tested, built and deployed to GitHub Pages by
[.github/workflows/deploy.yml](.github/workflows/deploy.yml).
