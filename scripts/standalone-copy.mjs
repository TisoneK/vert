// Copy static assets into the standalone server output after `next build`.
//
// Replaces the previous `cp -r` shell steps, which only worked on POSIX
// systems (Windows shells reject `cp -r`). fs.cpSync is recursive by design
// and behaves identically on every platform CI / Vercel / local machines run.
import { cpSync } from 'node:fs'

cpSync('.next/static', '.next/standalone/.next/static', { recursive: true })
cpSync('public', '.next/standalone/public', { recursive: true })

console.log('Standalone assets copied: .next/static + public')
