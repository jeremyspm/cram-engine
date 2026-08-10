#!/usr/bin/env node
/* Audit a content pack against the typed-recall matcher.
 *
 *   node audit-typed.mjs ../hs2-test1/pack.js
 *
 * Two questions, and neither can be answered by reading the cards:
 *
 *   1. Does every key match ITSELF? A key the matcher rejects when typed verbatim is a
 *      card that cannot be answered correctly. Must always be zero.
 *   2. Would any DISTRACTOR be accepted? On hs2-test1 six cards said yes before the
 *      distractor test was moved ahead of the containment test — "Parasympathetic
 *      nervous system" contains "sympathetic nervous system", so typing the option the
 *      card calls wrong was scored correct. Must always be zero.
 *
 * The matcher is READ OUT OF template.html rather than copied here, because a second
 * copy is a copy that drifts and this whole script exists to catch drift.
 * Exits non-zero on any finding, so it can gate a pack build.                        */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const packPath = process.argv[2];
if (!packPath) { console.error('usage: node audit-typed.mjs <path/to/pack.js>'); process.exit(2); }

/* ---- lift the matcher out of the template, unmodified ---- */
const tpl = readFileSync(new URL('./template.html', import.meta.url), 'utf8');
const from = tpl.indexOf('const STOPW=');
const to = tpl.indexOf('/* ═══════════════ THE CRAM SESSION');
if (from < 0 || to < 0) {
  console.error('✗ could not find the matcher block in template.html — has it been renamed?');
  process.exit(2);
}
const shim = join(tmpdir(), `cram-matcher-${process.pid}.mjs`);
writeFileSync(shim,
  'const S={typed:{},ovr:[]}; const save=()=>{};\n' + tpl.slice(from, to) +
  '\nexport {matchAnswer,typedMCQ,typedCloze};\n');
const { matchAnswer, typedMCQ, typedCloze } = await import('file://' + shim);
unlinkSync(shim);

/* ---- load the pack without executing the page's figure helpers ---- */
const raw = readFileSync(packPath, 'utf8');
const a = raw.indexOf('const PACK'), b = raw.lastIndexOf('};') + 1;
if (a < 0 || b < 1) { console.error('✗ no `const PACK = {…}` found in ' + packPath); process.exit(2); }
const PACK = JSON.parse(
  raw.slice(raw.indexOf('{', a), b).replace(/[A-Za-z_$][\w$]*\((['"])(?:(?!\1).)*\1\)/g, 'null'));

const plain = s => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
let mcq = 0, cloze = 0, slots = 0;
const selfFail = [], ambiguous = [];

for (const c of PACK.cards || []) {
  const m = typedMCQ(c), z = typedCloze(c);
  const plan = m ? [m] : z;
  if (!plan) continue;
  m ? mcq++ : cloze++;
  for (const s of plan) {
    slots++;
    if (matchAnswer(plain(s.answer), s.answer, s.wrongs) !== 'hit')
      selfFail.push({ q: plain(c.q).slice(0, 70), key: plain(s.answer) });
    for (const w of s.wrongs) {
      const v = matchAnswer(plain(w), s.answer, s.wrongs);
      if (v !== 'miss') ambiguous.push({ q: plain(c.q).slice(0, 62), key: plain(s.answer), bad: plain(w), v });
    }
  }
}

console.log(`typeable: ${mcq} mcq + ${cloze} cloze = ${mcq + cloze} cards, ${slots} typed slots (of ${(PACK.cards || []).length} in the pack)`);
if (selfFail.length) {
  console.log(`\n✗ ${selfFail.length} key(s) the matcher will not accept as their own answer:`);
  selfFail.forEach(x => console.log(`   "${x.key}"\n     ${x.q}`));
}
if (ambiguous.length) {
  console.log(`\n✗ ${ambiguous.length} distractor(s) that would be accepted:`);
  ambiguous.forEach(x => console.log(`   ${x.v}: key "${x.key}" ← distractor "${x.bad}"\n     ${x.q}`));
}
if (!selfFail.length && !ambiguous.length) console.log('✓ every key matches itself, and no distractor is accepted');
process.exit(selfFail.length + ambiguous.length ? 1 : 0);
