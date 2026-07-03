import React from "react";
import { EntitiesTab } from "../EntitiesTab/EntitiesTab";
import { VISIBLE_RELATION_EVENT_TYPES } from "../constants";

/**
 * Relation audit statistics. Reuses the activity tab (chart + table) restricted
 * to the relation event types so relation create/edit/delete activity is shown
 * separately from entity activity.
 */
export const RelationsTab: React.FC = () => (
  <EntitiesTab eventTypes={VISIBLE_RELATION_EVENT_TYPES} />
);
