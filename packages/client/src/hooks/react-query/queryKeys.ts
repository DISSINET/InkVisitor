// Query keys shared between the component that fetches the data and the
// (many) places that invalidate it after a mutation.
// Every useEntitiesQuery caller draws its key from here, so the whole namespace
// is visible in one place and two call sites cannot pick the same string.
export const DETAIL_TAB_ENTITIES_KEY = "detail-tab-entities";
export const WARNING_ANCHOR_ENTITIES_KEY = "warning-anchor-entities";
export const MESSAGE_WARNING_ENTITIES_KEY = "message-warning-entities";
export const BATCH_RELATION_ELIGIBILITY_KEY = "batch-relation-eligibility";
