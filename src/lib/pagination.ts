/**
 * Parse and sanitize pagination query params.
 *
 * Why this exists: `parseInt(searchParams.get('page') || '1')` happily
 * accepts negative numbers, zero, NaN, and absurdly large values. A
 * negative `page` produces a negative `skip`, which Prisma rejects with
 * an unhelpful error → the route returns 500. Same for `limit`.
 *
 * This helper clamps everything to a safe range and returns sensible
 * defaults, so route handlers can stop worrying about edge cases.
 *
 * @example
 *   const { page, limit, skip } = parsePagination(req)
 *   const [rows, total] = await Promise.all([
 *     db.video.findMany({ skip, take: limit, ... }),
 *     db.video.count(...),
 *   ])
 */

export interface PaginationResult {
  /** 1-indexed page number, clamped to >= 1 */
  page: number
  /** Page size, clamped to >= 1 and <= maxLimit */
  limit: number
  /** `(page - 1) * limit` — the value to pass to Prisma's `skip` */
  skip: number
}

const DEFAULT_LIMIT = 20
const DEFAULT_MAX_LIMIT = 100

/**
 * Parse `page` and `limit` from the request's query string.
 *
 * @param req - any object exposing `url` (NextRequest, Request, etc.)
 * @param opts.defaultLimit - override the default page size (default 20)
 * @param opts.maxLimit - override the max page size (default 100)
 */
export function parsePagination(
  req: { url: string },
  opts: { defaultLimit?: number; maxLimit?: number } = {}
): PaginationResult {
  const defaultLimit = opts.defaultLimit ?? DEFAULT_LIMIT
  const maxLimit = opts.maxLimit ?? DEFAULT_MAX_LIMIT

  const { searchParams } = new URL(req.url)

  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10)

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), maxLimit)
      : defaultLimit

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}
