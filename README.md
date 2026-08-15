# LessonEditor — Curriculum Studio

Frontend-only studio for authoring the `Chapter → Units → Lessons → Activities`
curriculum structure. It imports, edits and exports the canonical JSON verbatim,
so the exported file drops straight into the consuming app with no conversion.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # reducer / schema / validation suite
npm run build
```

## The JSON is the model

Application state *is* the exported shape — there is no separate internal model:

```
{ "chapter": {…}, "units": [ { …, "lessonIds": ["a","b"] } ], "lessons": [ { …, "activities": [] } ] }
```

- Units reference lessons **by id**; lesson objects live only in the top-level
  `lessons` array and are never duplicated inside a unit.
- Optional keys (`isBoss`, `visual`, `hint`, `explanation`, `acceptableAnswers`)
  are written **only when present** — never as `null` or `""`.
- Unknown keys a consuming app has added survive import → edit → export
  (`src/lib/schema.ts`, `withExtras`).
- Export writes exactly one file, `<chapter.id>.json`, 2-space indented.

## Where things live

| Path | Role |
| --- | --- |
| `src/types/curriculum.ts` | Canonical types |
| `src/lib/schema.ts` | Zod schemas, paste detection, serialisation |
| `src/lib/validation.ts` | Pre-export checks (errors block, warnings don't) |
| `src/state/store.tsx` | Reducer — every edit is a pure curriculum transform |
| `src/components/CurriculumTree.tsx` | Tree + unit/lesson drag-and-drop |
| `src/components/editors/` | Chapter / Unit / Lesson / Activity editors |
| `src/components/dialogs/` | Import, Preview, Validation, Search, JSON view |

## Reference integrity

The reducer keeps `lessonIds` honest, so no edit can silently break a reference:

- Renaming a lesson id rewrites every `lessonIds` entry that points at it.
- Deleting a lesson removes its id from every unit.
- Duplicating a lesson (or a unit) mints fresh unique ids, including activity ids.
- Colliding ids are suffixed (`indexes` → `indexes-2`) rather than overwritten.
- Reordering MCQ options remaps `answer` so it stays on its own option.

These invariants are covered by `src/lib/curriculum.test.ts` (24 tests).

## Keyboard

`⌘K` search · `⌘Z` / `⇧⌘Z` undo-redo · `⌘I` import · `⌘S` export

## Scope

No backend, database, auth or cloud storage. `localStorage` holds the working
copy between sessions; the exported `.json` is the portable source of truth.
