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

> Note: card progress is keyed by the card's *position* in the array. Adding
> cards at the end is safe; reordering or deleting mid-list shifts progress
> between cards. For a live tool, append only.

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
  ],
  glossary: [ { term:'…', def:'…' } ],   // searchable, optional
};
```

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
