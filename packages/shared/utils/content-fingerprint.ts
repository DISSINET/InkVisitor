/**
 * Optimistic-concurrency token for a document's content. A client sends the
 * fingerprint of the content its edit was derived from; the server compares it
 * against what is stored and refuses the write if the two differ.
 *
 * The length is carried alongside the hash because a false match lets a stale
 * write through silently: two contents must collide in both a 32-bit djb2 hash
 * and their length to slip past.
 *
 * Both sides of the wire call this, so the algorithm must stay byte-identical
 * between client and server builds.
 */
export function contentFingerprint(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    // (hash * 33) ^ charCode, coerced back into the unsigned 32-bit range
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i);
    hash = hash >>> 0;
  }
  return `${content.length}:${hash.toString(36)}`;
}
