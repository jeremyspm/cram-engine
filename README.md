# Cram Engine

The shared shell of the BN1 single-file cram tools (bn1-exam-cram, TEST 3 CRAM
TOOL, …) extracted into a **reusable template**. Making a new cram tool for a
test now costs *writing the cards*, not rebuilding the app.

Everything is one file, 100% offline, no dependencies, progress in
`localStorage` — the house philosophy.

## How to make a new tool

1. Copy `template.html` → e.g. `../bn1-pharm-test1/index.html` (its own folder
   if it'll be a GitHub Pages repo).
2. Replace everything between these two markers near the top of the script:

   ```
   /* ===== CONTENT PACK START ===== */
   ...your PACK object...
   /* ===== CONTENT PACK END ===== */
   ```

3. Open it. Done. A yellow banner appears at the top if the pack has schema
   errors (unknown topic ids, MCQs without a correct answer, etc.).

**Give every pack a unique `id`** — it namespaces saved progress, so two tools
never clobber each other's stats.

> Note: card progress is keyed by a hash of the card's type + question text,
> so reordering, inserting, or deleting cards is safe. Editing a question's
> *wording* resets that one card's progress (it's treated as a new card).
> Old index-keyed progress from v1 tools migrates automatically on first load.

## PACK schema

```js
const PACK = {
  id: 'bn1-pharm-test1',        // REQUIRED, unique per tool
  title: 'Pharmacology — Test 1',
  subtitle: 'BN1 semester 2',
  exam: { mcq: 20, saq: 4, minutes: 40, pass: 80 },  // exam-sim recipe
  topics: [ { id:'anti', name:'Antimicrobials', icon:'🦠' }, ... ],
  cards: [
    // Flashcard — used by Learn (SRS)
    { type:'flash', topic:'anti', q:'Question?', a:'Answer (HTML ok, <b> for emphasis)' },

    // MCQ — used by MCQ drill and Exam sim. correct = index into options.
    { type:'mcq', topic:'anti', q:'Stem?', options:['a','b','c','d'], correct:2,
      why:'Shown after answering — why the right answer is right.' },

    // Marked short-answer — used by Learn, Marked drill, and Exam sim.
    // points = the marking schedule (one tick each). model = extra notes.
    { type:'saq', topic:'anti', q:'List five… (5 marks)', marks:5,
      points:['p1','p2','p3','p4','p5'], model:'Also acceptable: …' },

    // Put in order — steps authored in the CORRECT sequence, shown shuffled.
    // Tap a bank item to fill the next slot; tap a filled slot to put it back.
    { type:'order', topic:'anti', q:'Place these steps in order.',
      steps:['first','second','third'], why:'…' },

    // Fill the blanks — .text carries [[1]] … [[n]], one per blank.
    { type:'cloze', topic:'anti', q:'Complete the passage.',
      text:'The dose is [[1]] and the route is [[2]].',
      blanks:[ {options:['a','b'],correct:0}, {options:['c','d'],correct:1} ], why:'…' },

    // True/false SET — ONE mark for getting every statement right, unless you
    // pass partial:true. That mirrors how the real Canvas paper scores them.
    { type:'tfset', topic:'anti', q:'True or false?',
      statements:[ {s:'…',v:true}, {s:'…',v:false} ], why:'…' },

    // Matching — right-hand values must be unique (scoring compares by value).
    // distractors are extra wrong options thrown into every dropdown.
    { type:'match', topic:'anti', q:'Match each term to its definition.',
      pairs:[ ['left','right'], ['left2','right2'] ], distractors:['nope'] },
  ],
  glossary: [ { term:'…', def:'…' } ],   // searchable, optional
};
```

### Card types at a glance

| type | view | marks (default) |
|---|---|---|
| `flash` | Learn (SRS) | — |
| `saq` | Learn, Marked drill, Exam | `points.length` |
| `mcq` | Drill, Exam | 1 |
| `order` | Drill, Exam | `steps.length` |
| `cloze` | Drill, Exam | `blanks.length` |
| `tfset` | Drill, Exam | **1** (all-or-nothing) |
| `match` | Drill, Exam | `pairs.length` |

Override any of them with an explicit `marks:`. Every card may also carry:

- `fig:'<svg…>'` + `figcap:'…'` — an inline figure above the answer area.
- `lean:'exam'` — keep it in Learn and Drill but **exclude it from the exam sim**
  (for content the lecturer has said is final-exam-only).
- `crit:'cvs-7'` — the blueprint criterion this card covers (see below).

### Optional: criterion coverage

If a course publishes a list of assessment criteria, declare them and the
validator will *prove* the pack covers them:

```js
criteria: [ { id:'cvs-7', name:'Heart sounds and where best detected', blind:true }, … ],
coverage: { min:6, blindMin:10, blindNeedsSaq:true },
```

`blind:true` marks a criterion no practice material covers. Those get a higher
card floor, must include at least one SAQ, and the exam sim **oversamples them
2×** until you've scored full marks on them. Packs without `criteria` skip all
of this.

### Exam sim recipe

```js
exam: { auto: 32, saq: 3, minutes: 65, pass: 65, noPaper: true,
        mix: { mcq:.40, cloze:.20, match:.15, tfset:.15, order:.10 } },
```

`auto` draws across every machine-marked type; `mix` sets each type's share and
the remainder is filled at random. `noPaper:true` shows a "no rough paper"
warning on the setup screen. The old `{mcq: N}` key still works as an alias for
`auto`.

## What the shell provides

- **Learn** — flashcards + SAQs on a 5-box Leitner SRS (Again/Hard/Good/Easy;
  due cards first, falls back to the full pool so cramming never blocks).
- **MCQ drill** — shuffled options, instant feedback with the `why`.
- **Marked drill** — reveal the marking schedule, tick what you got; your
  tick-rate feeds the SRS box for that card.
- **Exam sim** — mixes MCQs + SAQs per `PACK.exam`, optional countdown, no
  feedback until the end, honest self-marking screen, pass/fail vs `pass`,
  attempt history.
- **Search** — full-text across all cards + glossary.
- **Stats** — per-topic box-3+ counts, MCQ accuracy, exam history, reset.
- **Extras** — 🔊 read-aloud toggle (speech synthesis), dark/light theme,
  mobile-first, Enter-key driving throughout.

## For future Claude sessions

When Jeremy says "new test on X, here are the notes": copy `template.html`,
write a PACK from the notes (verbatim wording from his course material beats
paraphrase — his exams reuse phrasing), keep `id` unique, and sanity-check the
loaded page shows **no yellow validator banner**. Card counts in the hundreds
are fine — the shell is content-agnostic.
