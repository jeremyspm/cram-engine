# Cram Engine

The shared shell of the BN1 single-file cram tools (bn1-exam-cram, TEST 3 CRAM
TOOL, …) extracted into a **reusable template**. Making a new cram tool for a
test now costs *writing the cards*, not rebuilding the app.

Everything is one file, 100% offline, no dependencies, progress in
`localStorage` — the house philosophy.

> **`index.html` is a byte-identical copy of `template.html`** — it is the runnable demo
> at the repo root. It has silently drifted twice now (it was three engine versions
> behind before this pass), because there is nothing enforcing it. **After any edit to
> `template.html`, run `cp template.html index.html`.** Verify with `cmp template.html
> index.html`.

## How to make a new tool

1. Copy `template.html` → e.g. `../bn1-pharm-test1/index.html` (its own folder
   if it'll be a GitHub Pages repo).
2. Replace everything between these two markers near the top of the script:

   ```
   /* ===== CONTENT PACK START ===== */
   ...your PACK object...
   /* ===== CONTENT PACK END ===== */
   ```

3. Open it. Done.

**Validation output never reaches the student.** Schema and coverage failures go to
`console.warn` and to the **Sources** view; open with **`?dev=1`** to get them back as
a banner while you are authoring. The build script is the real gate — see
*Ship gate* below. A student's first sight of a tool must not be a lint result written
in vocabulary they do not have.

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
  lecturer: 'Dr Rangi',         // OPTIONAL — see "Naming the lecturer" below
  // Mock-test recipe. `date` is optional and drives the days-left counter.
  exam: { auto: 20, saq: 4, minutes: 40, pass: 80, date: '2026-08-23' },
  topics: [ { id:'anti', name:'Antimicrobials', icon:'🦠' }, ... ],
  cards: [
    // Flashcard — self-graded recall on the SRS
    { type:'flash', topic:'anti', q:'Question?', a:'Answer (HTML ok, <b> for emphasis)' },

    // MCQ — machine-marked, also drawn by the mock test. correct = index into options.
    { type:'mcq', topic:'anti', q:'Stem?', options:['a','b','c','d'], correct:2,
      why:'Shown after answering — why the right answer is RIGHT. Not a sourcing note.' },

    // Written answer — reveal the marking points and tick them; also in the mock test.
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
| `flash` | Study (self-graded, SRS) | — |
| `saq` | Study (marking points), Mock test | `points.length` |
| `mcq` | Study (machine-marked), Mock test | 1 |
| `order` | Study (machine-marked), Mock test | `steps.length` |
| `cloze` | Study (machine-marked), Mock test | `blanks.length` |
| `tfset` | Study (machine-marked), Mock test | **1** (all-or-nothing) |
| `match` | Study (machine-marked), Mock test | `pairs.length` |

Every type is dealt from **one queue**. A card's type decides how it is presented and
scored, not which tab it lives in — see *What the shell provides*.

Override any of them with an explicit `marks:`. Every card may also carry:

- `fig:'<svg…>'` + `figcap:'…'` — an inline figure above the answer area.
- `lean:'exam'` — keep it in Study but **exclude it from the mock test**
  (for content the lecturer has said is final-exam-only).
- `crit:'cvs-7'` — the focus point this card covers (see below).
- `bg:true` — **background reading**: real content, but not what the course has asked
  about. Out of the default queue, one tap puts it back. See *Background reading*.
- `tier:` + `ev:` + `srcNote:` — where the card came from (see *Sourcing*).

### Optional: focus-point coverage

If a course publishes a list of assessment criteria, declare them and the
validator will *prove* the pack covers them:

```js
criteria: [ { id:'cvs-7', name:'Heart sounds and where best detected', blind:true }, … ],
coverage: { min:6, blindMin:10, blindNeedsSaq:true },
```

The **key stays `criteria`** — every pack and build script already speaks it — but the
student never meets the word. Every rendered string calls them **focus points**, which
is what the course's own document calls them. Same for `blind:true`, which renders as
**"never practised"**: it means *the course lists this as examinable and no practice
test covers it*, and that sentence is what a reader needs, not the adjective.

Never-practised focus points get a higher card floor, must include at least one written
answer, and the mock test **oversamples them 2×** until you've scored full marks.
Packs without `criteria` skip all of this.

Declaring `criteria` also switches on the **Brief** — see below. That is the main
reason to declare them even for a course that publishes no formal blueprint:
group your cards under half a dozen named headings and the pack gains a readable
study guide for free.

### Naming the lecturer

```js
lecturer: 'Hannetjie',
```

**The engine carries no name and no pronouns.** With no `lecturer` every string reads
"the lecturer"; with one they read "Hannetjie's own past questions". Both work. Do not
put a pronoun in a card either where you can name the person instead — "her slides"
requires the reader to already know who is being discussed, and this template is shared
across courses, so a gendered shell is wrong for the next one by construction.

The one place pronouns belong is **clinical scenarios**: a patient in a case study has a
gender and the prose should say so. If you ever automate a voice pass, whitelist the
fields that describe the lecturer (`a`, `model`, `why`, `srcNote`) and never touch
`text`, `points`, `options`, `statements`, `steps`, `pairs` or `blanks` —
`hs2-test1/audit/apply-migration.mjs` has a worked example, including why a blind
regex over the file would have corrupted base64 image data.

### Sourcing: `tier`, `ev`, `srcNote`

A pack may record where each card came from. Declaring `tier` on any card switches on
the source badge and the **Sources** view.

| `tier` | badge | what it means |
|---|---|---|
| `verbatim` | **📄 From a past quiz** (green, loudest) | the lecturer's own question, unedited |
| `taught` | **📘 From the lecture slides** (indigo) | pinned to the course material by a checked quote |
| `textbook` | **Background reading** (grey, silent) | written for the pack; normal, and not a warning |
| `unverified` | **⛔ Unchecked** (red) | cites something that is not on disk |

**The loudness is inverted from the obvious choice, on purpose.** Background reading is
the majority of a well-made pack — 61% of `hs2-test1` — and putting a ⚠️ on two cards in
three does not make the tool honest, it makes it look faulty and teaches the reader to
discount it. It is also untrue: that content is ordinary physiology that happens not to
be in the slides, which is what a study guide is *for*. So background reading is quiet,
the rare valuable signal is loud, and alarm styling is spent only on the tier that
really does mean nobody has checked this.

**`why` explains the answer. `srcNote` explains the sourcing.** Keep them apart. In
`hs2-test1` the sourcing note was filed in `why`, so 123 drill cards answered *"why was
I wrong?"* with *"no citation — standard textbook content written for the pack"* — and
overwriting `why` destroyed ~97 real authored explanations that already existed in the
source pack. One field, one job.

### The Brief — write flash answers as prose

The Brief is generated from the pack, not authored separately. For each criterion
it renders that criterion's **`flash` cards, in pack order**, as question-heading
and answer-paragraph. A criterion with no flash card at all falls back to its
**`saq` marking points**.

Two things follow for anyone writing a pack:

- **Order flash cards within a criterion so they build.** The Brief reads them top
  to bottom, so they should teach in sequence — define the thing, then the numbers,
  then why it matters. `hs2-test1`'s gas-exchange run (atmospheric air → alveolar
  air → why they differ → why that stability matters → dead space) is the model.
- **Write `a:` as a complete statement, not a bare answer.** "60–100 bpm" works on a
  flip card and reads as nothing in the Brief. The flash answers are the only prose
  the tool has.

Other card types are drills and are deliberately excluded from the prose. If a
criterion's content lives entirely in MCQs, its Brief section will be thin — that
is a signal to write it a few flash cards, not a bug.

### Mock-test recipe

```js
exam: { auto: 32, saq: 3, minutes: 65, pass: 65, noPaper: true, date: '2026-08-23',
        mix: { mcq:.40, cloze:.20, match:.15, tfset:.15, order:.10 } },
```

`auto` draws across every machine-marked type; `mix` sets each type's share and
the remainder is filled at random. `noPaper:true` shows a "no rough paper"
warning on the setup screen. The old `{mcq: N}` key still works as an alias for
`auto`.

**`date`** (`YYYY-MM-DD`, optional) puts a **days-left** pill in the header and gives the
first-run panel its "on 23 August". It is parsed as *local* midnight, not UTC — `new
Date('2026-08-23')` is UTC midnight, which in NZ is already midday, and would report a
day fewer than the student actually has. Omit `date` and neither renders.

The same block drives the **mark projection** in Progress: the split between
machine-marked and written marks is computed from `auto`, `saq`, `mix` and each type's
`cardMarks()`. On `hs2-test1` that lands on 19.5% written, against the paper's stated
20% — so if your projection looks wrong, check the mix before the maths.

## What the shell provides

- **Brief** — *the only view that explains rather than asks.* One section per focus
  point, in the order the course publishes them, built from the pack's flash answers
  as prose; read ticks and a progress bar; **▸ Drill this** scopes Study to
  that one focus point (announced in a banner with a one-tap clear). A reader with no
  saved progress **lands here**, because opening in Study asks them to retrieve facts
  they have not encoded yet. Hidden entirely unless the pack declares `criteria`.
- **Study** — **one queue holding every card in the pack**, dealt from the deck below.
  Each card renders in its own form: a `flash` card flips and you grade yourself on the
  Leitner SRS (Again/Hard/Good/Easy); an `saq` reveals its marking points for you to
  tick, feeding both the SRS and the mark projection; the machine-marked types run their
  runner with the explanation floor below.

  This used to be three tabs — Learn, Drill and Written — split by *how a card is
  marked*. That is a fact about the code, not about studying, and it cost the reader
  three things: no screen could state an honest card count (Drill spoke for only the
  machine-marked types, so on `hs2-test1` it announced "all 300 cards" of a 586-card
  pack); every `saq` appeared in two tabs at once, since Learn's set is flash+saq and
  Written's is saq; and three decks meant three passes with nowhere that could say you
  had been through the pack. **If a tab name is a card type, it is not a tab.**
  `?mode=learn|mcq|saq` still resolve, aliased onto Study.
- **Mock test** — mixes machine-marked + written per `PACK.exam`, optional countdown,
  no feedback until the end, honest self-marking screen, pass/fail, attempt history.
- **All cards · Search · Progress · Sources** — behind the `···` overflow. Three primary
  tabs is the tool; these are things you go and look for, not things you do.
- **All cards** — the whole pack, standing still. Group by topic, focus point, source
  tier or question type, open a group, read every question with its answer straight
  through, filter within it. It ignores the background-reading pool for the same reason
  Search and the Brief do: this is the one view that must be able to say *everything*.
  Every card carries a **⚑ Flag** button, and so does the study card and the mock-test
  review — see below.
- **Extras** — dark/light theme, days-left pill, dismissible first-run panel,
  mobile-first (verified at 375px), Enter-key driving throughout.

**Five things a reader must be able to do**, and the test any change to this shell has
to survive: know what test it is for and when within ten seconds · know what to do
first without reading about the tool · learn something from *every* wrong answer ·
meet no word they would have to look up · never wonder whether the tool is broken.

## The explanation floor

**No drill card may render a mark with nothing beside it.** An authored `why:` is
always used where one exists; where it is missing the engine synthesises an honest line
from what the card already knows — the correct option, the pairs missed, the blanks
missed, the statements flipped — and every drill card ends with **→ Read the full
explanation**, deep-linking to that focus point's Brief section.

The two halves are additive, not either/or: what the right answer *was* always shows,
because an authored `why` explains the reasoning and rarely restates the answer.

This is a floor, not a substitute. A synthesised line is enormously better than a bare
red box and clearly worse than a written one — **`why:` on every machine-marked card is
still the highest-value authoring left in any pack.**

## Flagging a bad card

Packs are built from a lecturer's own quizzes, and lecturers publish wrong answer keys.
Writing `hs2-test1`'s 172 explanations turned up three: an ABG marked *metabolic*
alkalosis whose values are a textbook *respiratory* one, a tamponade filed as
cardiogenic in one question and obstructive in the next of the same quiz, and a
diuretic card whose key takes the fluid route while the potassium answer sits on the
same card. **Every one was found by a human reading the card.** So the engine ships the
means to report one.

**⚑ Flag** appears on every card in All cards, on the study card, and in the mock-test
review — deliberately *not* during the mock test itself, same rule as the source badges:
mid-question it is a hint the real paper will not give you. The panel asks what is wrong
(seven reasons) plus an optional note.

- **Flags are stored under `S.flags`, keyed by `ckey`** — `hash(type | question |
  content signature)`, the same key progress records and `explanations.json` use. Edit
  the card and the key changes, so a flag against a rewritten card stops resolving.
  **That is the feature.** The flagged list shows those separately, with the question as
  it read when it was flagged, rather than dropping them or re-attaching them to a
  neighbouring card.
- **They ride `Cloud.sync` for free**, because they live in the same state blob as
  progress. A card flagged on a phone is waiting on the laptop that can fix it.
- **There is no server, and the panel says so in those words.** "Saved on this device …
  nothing is sent anywhere." Claiming a report had been *sent* when it went into
  `localStorage` would break the self-explaining rule in the one place the reader
  cannot check.
- **All cards → ⚑ Flagged** copies or downloads them as JSON:
  `{pack, exported, n, flags:[{ck, reason, note, at, type, topic, crit, stillInPack, q}]}`.

The other end of that round trip is a per-tool script — **`hs2-test1/audit/flags.mjs` is
the reference implementation, copy it.** It resolves each `ck` back to a card and prints
the question, the answer, the explanation and the source, worst reason first. It is not
a build gate: a flag is a reader's report, not a schema error, and blocking a ship on a
subjective one would be wrong. It does carry one gate of its own — it re-derives `ckey`
in Node, so before trusting a single result it **proves its copy of the hash still
agrees** with the one that built the pack, by checking that every key in
`explanations.json` resolves. Without that check a drifted hash would report all flags
as stale and look entirely plausible doing it.

## Theme

The engine is on the estate palette — neutral surfaces plus one indigo accent, values
lifted whole from `hub/index.html`. Two traps if you touch it:

- **`--miss` is this engine's name for the house `--bad`.** It is aliased, not renamed;
  it appears throughout the stylesheet and in `.opt.wrong` / `.slot.wrong` / `.tfrow.wrong`.
- **`--gGood / --gHard / --gMiss` are derived with `color-mix`, never hand-mixed.** They
  used to be literals baked from the old accents, which meant a palette change left
  every correct/incorrect state wearing a colour from a dead theme.

Per the house rule this takes the hub's palette and material and **not its chrome**.
The cram tool keeps its own shape — which includes **`--maxw`**. The hub's 620px is a
reading measure for a link directory; this engine renders ported anatomical figures,
and 12 of `hs2-test1`'s rasters are 1100px wide. At 620px they land at **50% scale**,
against 63% at this engine's own 760px and 68% in `hs2-module1`, where they were
checked for legibility and which they are copied from byte for byte. Taking the hub's
measure halves a labelled diagram. `--r` is material and comes across; `--maxw` does not.

## Ship gate

`build.mjs` in a pack's folder **exits non-zero** on any coverage failure. That is
what makes it safe for the page to stop warning the reader on the author's behalf:
if the pack is short of its declared floors, the build does not produce a page at all.
Keep the build's rule identical to the engine's `validateCoverage` — including counting
`alsoCrit` — or a build can pass while the page it produced disagrees.

## Background reading

A pack whose honest card count is too big to get through is a pack nobody starts.
`hs2-test1` is 586 cards for a 65-minute test, and **346 of them are standard
physiology sitting on focus points the lecturer's own questions already cover** — real
content, but padding on ground the real thing already holds.

Mark those `bg:true` and they leave the **default queue**.

**Do not call this set "background reading" in the UI.** That is already the badge on
every `textbook`-tier card, and the load-bearing ones stay in the queue — so the phrase
put a card badged *Background reading* directly beneath a line saying background
reading had been excluded. Describe the set by *why* it is out instead.

What this must never become is a hidden pack, so:

- the switch sits above the queue **under both doors**, states both counts, and
  restores everything in one tap;
- they stay in the **Brief** and in **Search**, in full, always;
- the **mock test** draws from the same pool you are studying, so it cannot ask you
  something the queue has never shown you — and it says so on the setup screen;
- **Progress** and per-topic readiness count that pool too, and say which one.

Two gates keep it honest, and both are in `validateCoverage` **and** in `build.mjs`
because the two must not drift: a focus point still has to clear its card floor, and a
focus point whose cards are **all** `bg` fails the build. The floor counts the pack;
the second counts what the reader is actually dealt. Without it a focus point can pass
the floor on background cards alone and still answer "▸ Drill this" with an empty view.

A pack that sets `bg` on nothing is unaffected: the switch never renders and the pool
filter is the identity.

## Long cloze passages

Cloze cards with **4 or more blanks** are rendered as a sequence of blocks rather than
one paragraph, with a `3 of 10 filled` counter beneath. `hs2-test1`'s biggest is 393
words with twenty dropdowns — met as a single grey wall it was the most demoralising
card in the pack.

The card is **not** edited. Harvested cards are the lecturer's content reproduced
unaltered and proven so by a diff against the capture, so splitting one into several
would break that proof and change its progress key. Only the rendering is segmented:
same text, same blanks, same marks, same key.

Cuts are taken on the **raw** text — before any `<select>` exists, so a boundary can
never land inside generated markup — at sentence ends, dash bullets and newlines, and
each piece keeps its trailing separator so **`segments.join('') === text` exactly**.
That is the property to preserve if you touch `clozeSegments`: it cannot drop,
duplicate or reorder a word, and cannot orphan a `[[n]]` between two blocks. Any block
that still holds too many blanks — the harvested slide dumps run 128 words with no full
stop — is re-cut on blank boundaries, so no block is ever a wall.

## How cards are chosen — the deck

Study deals from an **ordered deck**, not a random draw. Four rules, in this order of
precedence:

1. **Every card in the pool is in the deck.** Priority sets *order*, never
   membership. Nothing is withheld under either door. (The pool is the whole pack
   unless the reader has left *background reading* switched off — see above.)
2. **Body systems are the outermost loop, when the pack declares them.** Add
   `systems:[{id,name}]` and give each topic a `sys:` and the deck is dealt one system
   at a time, in the declared order, finishing one before starting the next. Omit them
   and rule 3 applies to the whole pack, exactly as before.
3. **Topics are the next loop.** Within a system, cards are grouped by topic and the
   topics stride-merged so a topic holding *n* of *N* cards is dealt every *N/n* slots
   — proportional to its size, and reached in that system's opening handful.
4. **Rank orders the cards inside a topic** — questions the lecturer has set before
   and parts of the course no practice test covers, then what you have been getting
   wrong, then what is due for review, then the rest.

Rule 2 exists because stride-merging *every* topic is a round-robin: on `hs2-test1`
twelve consecutive cards ran gas exchange → terminology → vessels → control of
breathing → blood pressure → heart anatomy → … Twelve cold starts, and no way to
finish a system. Declare the systems in the order the course itself publishes its
focus points, and the door note can say so truthfully.

**One trap when reporting the deck to the reader.** `cardWeak()` counts a
never-attempted card as weak — right for ranking, since untouched is as unproven as
failed, and false as a sentence. Reported raw it tells a cold reader that hundreds of
cards are ones "you have been getting wrong". `deckStats` filters those out with
`cardSeen()`; **re-derive any ranking predicate before it becomes user-facing prose.**

No card repeats until the deck is exhausted, so one pass is full coverage. A card
you get wrong is spliced back in 4 cards ahead (10 if you were only partly wrong),
which is what makes it a cram tool rather than a reading order. The deck rebuilds
and re-ranks when it runs out, or when the door, topic or focus scope changes.

**Why the outer loop matters.** The obvious construction — rank bands first, topics
spread inside each band — was tried and is wrong. On `hs2-test1` rank band 0 holds
no gas exchange, cardiac output or terminology card at all, so those topics could
not be reached until card 70 of 288. The predecessor of this deck was worse still:
it rendered only the single lowest rank present, which put **356 of 587 cards out
of reach entirely** and starved three topics to zero. If you change the ordering,
test topic reach at a cold start before anything else.

## Duplicate cards

A card's progress key is a hash of its type, its question **and a signature of its
own content**. The signature matters because harvested questions share stems —
`hs2-test1` has nine true/false sets all asking *"Are the following true or false?"*.
Keyed on the question alone they collapsed onto one progress record, so answering
one marked all nine answered.

Two cards that still land on the same key are genuinely the same card, and the deck
deals only the first. That is a safety net, not a licence: **duplicates are a content
bug and should be removed from the pack.**

When you remove one, check *why* it was there first. `hs2-test1` had five, and they were
not an import bug — the lecturer had genuinely set the same five questions on two
different lab quizzes. Deleting one card and dropping its evidence would have thrown
away the more interesting half of the fact, so the survivor carries **both** `ev`
records (`ev` may be an array) and the reader now sees that the question has been set
twice. That is the strongest signal a pack can carry.

## For future Claude sessions

When Jeremy says "new test on X, here are the notes": copy `template.html`, write a
PACK from the notes (verbatim wording from the course material beats paraphrase — these
exams reuse phrasing), keep `id` unique, and check the pack with **`?dev=1`** — the
student build no longer shows a validator banner, so an author who does not open dev
mode will not see their own errors. Card counts in the hundreds are fine; the shell is
content-agnostic.

Before shipping, hold it against the five-things test above. The most common way to
fail it is not a bug: it is writing the tool in the voice of the person who built it.
Words like *criterion*, *blind spot*, *tier*, *provenance*, *box 3*, *SAQ* and *exam
sim* are all things we know and the reader does not.
