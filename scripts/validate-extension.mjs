import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const output = resolve('dist')
const manifestPath = resolve(output, 'manifest.json')

if (!existsSync(manifestPath)) {
  throw new Error('Extension build is missing dist/manifest.json')
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const required = new Set([
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  ...Object.values(manifest.action?.default_icon || {}),
  ...Object.values(manifest.icons || {}),
  ...(manifest.content_scripts || []).flatMap((entry) => [
    ...(entry.js || []),
    ...(entry.css || [])
  ])
].filter(Boolean))

const missing = [...required].filter((file) => !existsSync(resolve(output, file)))
if (missing.length) {
  throw new Error(`Extension build is incomplete. Missing: ${missing.join(', ')}`)
}

console.log(`Extension package validated: ${required.size} referenced files present.`)
