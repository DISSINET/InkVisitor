import { DropdownItem } from "@inkvisitor/shared/types";

export type ChangeAction = "select" | "deselect" | "remove-chip" | "pop" | "clear";

/* Replacement for react-select's ActionMeta — only the actions the app
   actually branches on. "remove-chip" ≙ old "remove-value" (chip ×);
   "pop" ≙ old "pop-value" (Backspace drops the last selection). */
export interface ChangeMeta<O extends DropdownItem = DropdownItem> {
  action: ChangeAction;
  /* the option the interaction happened on; absent for "clear" */
  option?: O;
}

export interface OptionRenderState {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}
