import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * GET /api/v1/changelog
 *
 * Returns the project's CHANGELOG.md parsed into structured sections.
 *
 * Public endpoint — no auth required. The changelog is meant to be
 * visible to all users (and potential new users evaluating the project).
 *
 * The markdown is parsed by a small inline parser (no dependency) that
 * splits the file into version sections, each with:
 *   - version: string (e.g. "0.3.0" or "Unreleased")
 *   - date: string | null (e.g. "2026-07-06")
 *   - html: string (parsed HTML for the section body)
 *
 * The parser handles the subset of markdown used in CHANGELOG.md:
 *   - # / ## / ### / #### headings
 *   - - bullet lists (with nesting)
 *   - **bold** and *italic*
 *   - `inline code`
 *   - [text](url) links
 *   - --- horizontal rules
 *   - > blockquotes
 *   - blank-line-separated paragraphs
 */

export interface ChangelogSection {
  version: string
  date: string | null
  /** Display label, e.g. "0.3.0 — 2026-07-06" or "Unreleased" */
  label: string
  /** Anchor id, e.g. "030-2026-07-06" */
  id: string
  /** Parsed HTML for the section body (excludes the h1 heading) */
  html: string
}

// ─── Inline markdown → HTML ───
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function parseInline(text: string): string {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, '<code class="changelog-code">$1</code>')
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="changelog-link">$1</a>'
  )
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  return out
}

// ─── Block-level markdown → HTML ───
function parseBlockMarkdown(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let i = 0
  let inList = false
  let listDepth = 0

  function closeList() {
    if (inList) {
      for (let d = 0; d < listDepth; d++) html.push('</ul>')
      html.push('</ul>')
      inList = false
      listDepth = 0
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trimEnd()

    // Horizontal rule
    if (/^---+\s*$/.test(trimmed)) {
      closeList()
      i++
      continue  // skip — we use spacing between sections instead
    }

    // Headings (h2+ since h1 is the version header, handled by caller)
    const headingMatch = trimmed.match(/^(#{2,6})\s+(.+)$/)
    if (headingMatch) {
      closeList()
      const level = headingMatch[1].length
      const text = parseInline(headingMatch[2])
      const id = headingMatch[2]
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      html.push(`<h${level} id="${id}" class="changelog-h${level}">${text}</h${level}>`)
      i++
      continue
    }

    // Blockquote
    if (/^>\s/.test(trimmed)) {
      closeList()
      const quoteText = parseInline(trimmed.replace(/^>\s/, ''))
      html.push(`<blockquote class="changelog-quote">${quoteText}</blockquote>`)
      i++
      continue
    }

    // Bullet list items
    const bulletMatch = line.match(/^(\s*)-\s+(.+)$/)
    if (bulletMatch) {
      const indent = bulletMatch[1].length
      const depth = Math.floor(indent / 2)
      const text = parseInline(bulletMatch[2])

      if (!inList) {
        html.push('<ul class="changelog-list">')
        inList = true
        listDepth = 0
      }

      while (listDepth < depth) {
        html.push('<ul class="changelog-list-nested">')
        listDepth++
      }
      while (listDepth > depth) {
        html.push('</ul>')
        listDepth--
      }

      html.push(`<li class="changelog-list-item">${text}</li>`)
      i++
      continue
    }

    // Empty line
    if (trimmed === '') {
      closeList()
      i++
      continue
    }

    // Regular paragraph
    closeList()
    const paraLines: string[] = [trimmed]
    i++
    while (i < lines.length) {
      const next = lines[i]
      if (
        next.trim() === '' ||
        /^#{1,6}\s/.test(next.trim()) ||
        /^---+\s*$/.test(next.trim()) ||
        /^>\s/.test(next.trim()) ||
        /^(\s*)-\s/.test(next)
      ) {
        break
      }
      paraLines.push(next.trim())
      i++
    }
    const paraText = parseInline(paraLines.join(' '))
    html.push(`<p class="changelog-paragraph">${paraText}</p>`)
  }

  closeList()
  return html.join('\n')
}

// ─── Split CHANGELOG.md into version sections ───
function splitIntoSections(md: string): ChangelogSection[] {
  const sections: ChangelogSection[] = []
  // Match: ## [version] — date  OR  ## [version]
  // Also match the link-reference lines at the bottom ([version]: url) and skip them.
  const lines = md.split('\n')
  let currentVersion: string | null = null
  let currentDate: string | null = null
  let currentBody: string[] = []

  function flush() {
    if (currentVersion !== null) {
      const body = currentBody.join('\n').trim()
      if (body) {
        // Build a URL-safe id from version + date (if present).
        // For "0.3.0" + "2026-07-06" → "030-2026-07-06"
        // For "Unreleased" + null → "unreleased"
        const versionSlug = currentVersion.toLowerCase().replace(/[^\w-]/g, '')
        const dateSlug = currentDate
          ? currentDate.toLowerCase().replace(/[^\w-]/g, '').replace(/\s+/g, '-')
          : ''
        const id = dateSlug ? `${versionSlug}-${dateSlug}` : versionSlug
        const label = currentVersion + (currentDate ? ' — ' + currentDate : '')
        sections.push({
          version: currentVersion,
          date: currentDate,
          label,
          id,
          html: parseBlockMarkdown(body),
        })
      }
    }
    currentBody = []
  }

  for (const line of lines) {
    // Skip link references at the bottom: [0.3.0]: https://...
    if (/^\[[^\]]+\]:\s*https?:\/\//.test(line)) continue

    // Match version header: ## [version] — date  or  ## [version]
    // Date can be YYYY-MM-DD or free-form text (e.g. "Earlier 2026",
    // "Initial release"). The em-dash separator can be —, –, or -.
    const versionMatch = line.match(/^##\s+\[([^\]]+)\](?:\s*[—–-]\s*(.+))?/)
    if (versionMatch) {
      flush()
      currentVersion = versionMatch[1]
      // Normalize: if the date looks like YYYY-MM-DD, keep it; otherwise
      // keep the free-form text as-is.
      const rawDate = versionMatch[2]?.trim()
      currentDate = rawDate || null
      continue
    }

    if (currentVersion !== null) {
      currentBody.push(line)
    }
  }
  flush()

  return sections
}

export async function GET() {
  try {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
    const md = await fs.readFile(changelogPath, 'utf-8')
    const sections = splitIntoSections(md)

    // Cache for 5 minutes at the edge — the changelog only changes on
    // deploy, so this is safe and cuts disk reads.
    const response = NextResponse.json({ sections })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('Changelog read error:', error)
    return NextResponse.json(
      { error: 'Changelog not found', sections: [] },
      { status: 404 }
    )
  }
}
