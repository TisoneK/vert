import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * GET /api/v1/changelog
 *
 * Returns the project's CHANGELOG.md parsed as HTML.
 *
 * Public endpoint — no auth required. The changelog is meant to be
 * visible to all users (and potential new users evaluating the project).
 *
 * The markdown is parsed by a small inline parser (no dependency) that
 * handles the subset of markdown used in CHANGELOG.md:
 *   - # / ## / ### / #### headings
 *   - - bullet lists (with nesting)
 *   - **bold** and *italic*
 *   - `inline code`
 *   - [text](url) links
 *   - --- horizontal rules
 *   - > blockquotes
 *   - blank-line-separated paragraphs
 *
 * If the file can't be read (e.g. missing in a dev environment), returns
 * a 404 with a helpful message.
 */

// ─── Inline markdown → HTML ───
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function parseInline(text: string): string {
  // Escape HTML first to prevent injection from the markdown source.
  let out = escapeHtml(text)
  // Inline code: `code` → <code>
  out = out.replace(/`([^`]+)`/g, '<code class="changelog-code">$1</code>')
  // Links: [text](url) — only allow http/https URLs
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="changelog-link">$1</a>'
  )
  // Bold: **text** → <strong>
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // Italic: *text* → <em> (but not ** which is bold)
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  return out
}

// ─── Block-level markdown → HTML ───
function parseMarkdown(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let i = 0
  let inList = false
  let listDepth = 0

  function closeList() {
    if (inList) {
      html.push('</li>'.repeat(listDepth > 0 ? 0 : 0))
      for (let d = 0; d < listDepth; d++) html.push('</ul>')
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
      html.push('<hr class="changelog-hr" />')
      i++
      continue
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
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

    // Bullet list items (support nesting via leading spaces)
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

      // Open/close <ul> for nesting
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

    // Empty line — close any open list
    if (trimmed === '') {
      closeList()
      i++
      continue
    }

    // Regular paragraph — collect contiguous non-empty, non-special lines
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

export async function GET() {
  try {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
    const md = await fs.readFile(changelogPath, 'utf-8')
    const html = parseMarkdown(md)

    // Cache for 5 minutes at the edge — the changelog only changes on
    // deploy, so this is safe and cuts disk reads.
    const response = NextResponse.json({ html, raw: md })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('Changelog read error:', error)
    return NextResponse.json(
      { error: 'Changelog not found', html: '<p>Changelog could not be loaded.</p>' },
      { status: 404 }
    )
  }
}
