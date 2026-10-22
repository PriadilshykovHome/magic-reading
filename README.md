# Чарівні пригоди Мишка

A Ukrainian reading game for a 5-year-old: syllables → words → sentences.
Live at <https://priadilshykovhome.github.io/magic-reading/>.

- Vision and roadmap: [docs/PLAN.md](docs/PLAN.md)
- Curriculum and content format: [docs/curriculum.md](docs/curriculum.md)
- How it is built: [docs/architecture.md](docs/architecture.md)
- Conventions: [CLAUDE.md](CLAUDE.md)

```bash
npm install
npm run dev     # http://localhost:5173/magic-reading/
npm test
npm run build
```

Every push to `main` is linted, tested, built and deployed to GitHub Pages by
[.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## How to add a world

1. Create `content/worlds/<world-id>/world.json` (its units: letters + a row of templates) and
   `lexicon.json` (the words and sentences first taught there); see
   [docs/curriculum.md](docs/curriculum.md) → "Content format & adding levels".
2. `npm run validate-content -- --report`: fix every error, then read the progress curve.
3. `npm run review-list -- <world-id>`: send `docs/review/<world-id>.md` to a native speaker.
4. `npm test && npm run e2e`, then push. Pictures and recordings can follow; missing ones are
   warnings, and browser speech stands in for missing audio.

Never rename or reorder a unit key that has shipped: saved progress is keyed by level ids.
