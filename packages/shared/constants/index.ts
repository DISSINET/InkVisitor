/**
 * Upper bound on documents in one /documents/export-batch request. The server
 * rejects a longer list; the client splits a larger selection into requests of
 * this size, so both sides have to read the same number.
 */
export const MAX_DOCUMENTS_EXPORT_BATCH = 50;
