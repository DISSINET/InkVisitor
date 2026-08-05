import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument } from "@inkvisitor/shared/types";
import { createOpeningTagRegex, closingTagRegex } from "@common/regex";

/**
 * Strips anchor tags whose entity belongs to a class the caller did not ask
 * for. Tags of an entity that is not anchored under any class are unknown to
 * the document and stay in the content untouched.
 */
export function filterDocumentContent(
  document: Pick<IDocument, "content" | "entityIds">,
  exportedEntities: EntityEnums.Class[]
): string {
  const openingTags = createOpeningTagRegex();
  // a fresh instance per call - the exported /g regex carries lastIndex
  // between the documents of one batch
  const closingTags = new RegExp(closingTagRegex.source, closingTagRegex.flags);

  const anchoredIds = new Set<string>();
  const exportedIds = new Set<string>();

  Object.values(EntityEnums.Class).forEach((entityClass) => {
    (document.entityIds[entityClass] || []).forEach((id) => {
      anchoredIds.add(id);
      if (exportedEntities.includes(entityClass)) {
        exportedIds.add(id);
      }
    });
  });

  const shouldRemove = (entityId: string): boolean =>
    anchoredIds.has(entityId) && !exportedIds.has(entityId);

  let filteredContent = document.content;
  let match;

  while ((match = openingTags.exec(document.content)) !== null) {
    const entityId = match[1].split(/\s+/)[0];
    if (shouldRemove(entityId)) {
      filteredContent = filteredContent.replace(match[0], "");
    }
  }

  while ((match = closingTags.exec(document.content)) !== null) {
    if (shouldRemove(match[1])) {
      filteredContent = filteredContent.replace(match[0], "");
    }
  }

  return filteredContent;
}
