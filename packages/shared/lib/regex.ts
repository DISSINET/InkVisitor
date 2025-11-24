// Updated regex to properly handle tags with attributes
// Opening tags: <tagname attr="value"> or <tagname>
// Handles UUIDs, alphanumeric, hyphens, underscores, and attributes
const openingTagRegex = /<([a-zA-Z0-9\-_]+(?:\s+[^>]*)?)>/g;
// Closing tags: </tagname>
// Handles UUIDs, alphanumeric, hyphens, underscores
export const closingTagRegex = /<\/([a-zA-Z0-9\-_]+)>/g;
// General tag removal regex
export const tagRemovalRegex = /<\/?[^<>]+?>/g;
// Creates a new regex instance for opening tags (no shared state)
export const createOpeningTagRegex = () => new RegExp(openingTagRegex.source, openingTagRegex.flags);

// Opening tag with specific name and optional attributes: <tagname attr="value"> or <tagname>
export const createSpecificOpeningTagRegex = (tagName: string) => new RegExp(`<${tagName}(?:\\s+[^>]*)?>`, 'g');

// Combined regex for both opening and closing tags with optional attributes
// Matches: <tagname attr="value"> or <tagname> or </tagname>
export const anyTagRegex = /<\/?([a-zA-Z0-9\-_]+)(?:\s+[^>]*)?>/g;

// Creates a new regex instance for any tag (no shared state)
export const createAnyTagRegex = () => new RegExp(anyTagRegex.source, anyTagRegex.flags);