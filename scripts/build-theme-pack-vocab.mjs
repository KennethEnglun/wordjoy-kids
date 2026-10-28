/**
 * Build public/data/vocab.json (and data/vocab.json) from the theme-pack draft.
 * Usage: node scripts/build-theme-pack-vocab.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const draftPath = join(root, 'docs/art/theme-packs-vocab-draft-2026-10-25.json')
const outputs = [join(root, 'public/data/vocab.json'), join(root, 'data/vocab.json')]

function imageSlug(en) {
  return String(en).toLowerCase().replace(/[ -]/g, '_')
}

const draft = JSON.parse(readFileSync(draftPath, 'utf8'))
if (!Array.isArray(draft) || draft.length !== 1152) {
  throw new Error(`Expected 1152 draft entries, got ${Array.isArray(draft) ? draft.length : typeof draft}`)
}

const words = draft.map((word) => ({
  id: word.id,
  en: word.en,
  zhHant: word.zhHant,
  example: word.example,
  pos: word.pos,
  band: word.band,
  theme: word.theme,
  image: `art/words/${imageSlug(word.en)}.webp`,
}))

const json = `${JSON.stringify(words, null, 2)}\n`
for (const out of outputs) writeFileSync(out, json)
console.log(`Wrote ${words.length} entries to ${outputs.join(' and ')}`)
