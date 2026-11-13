/** PostgreSQL cuts an identifier at this many bytes, which would make two long names one */
const MAX_IDENTIFIER_BYTES = 63;

/**
 * The names a migration into the database `pg` works under: `build` holds the
 * import until every check passed, `aside` keeps the database the build
 * replaces.
 */
export function workNames(pg: string, now: Date): { build: string; aside: string } {
  const stamp = now.toISOString().slice(0, 19).replace(/\D/g, "");
  const names = { build: `${pg}_migrating`, aside: `${pg}_replaced_${stamp}` };
  if (Buffer.byteLength(names.aside) > MAX_IDENTIFIER_BYTES) {
    throw new Error(`${names.aside} is over the ${MAX_IDENTIFIER_BYTES} bytes PostgreSQL keeps of a name, pick a shorter --pg`);
  }
  return names;
}
