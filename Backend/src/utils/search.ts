/**
 * PostgREST treats `,` `.` `(` `)` and `*` as operators inside a filter value.
 * User-supplied search text is escaped before it is interpolated into an
 * `ilike` pattern so a search box cannot rewrite the query.
 */
export function escapeLikePattern(term: string): string {
  return term
    .trim()
    .slice(0, 100)
    .replace(/[%_\\]/g, (char) => `\\${char}`)
    .replace(/[,.()*"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
