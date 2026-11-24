import Prism from "./prism";
import "prismjs/components/prism-json";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import Editor from "react-simple-code-editor";
import { StyledJsonEditor } from "./EntityImportModalStyles";

// the number of each line sits at the line's start, taken out of the flow
// into the left padding, so it stays with its line when the line wraps; a
// JSON token never spans lines, so the highlighted text splits at newlines
const highlightJson = (code: string) =>
  Prism.highlight(code, Prism.languages.json, "json")
    .split("\n")
    .map((line, index) => `<span class="line-number">${index + 1}</span>${line}`)
    .join("\n");

export interface EntityImportJsonEditorHandle {
  // scrolls to the character at the offset and selects it
  reveal: (offset: number) => void;
}

interface EntityImportJsonEditor {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  // Cmd+Enter or Ctrl+Enter
  onSubmit?: () => void;
}

/**
 * A plain textarea under a highlighted copy of its text, so typing, pasting,
 * undo and selection stay native while the JSON is colored.
 */
export const EntityImportJsonEditor = forwardRef<
  EntityImportJsonEditorHandle,
  EntityImportJsonEditor
>(({ value, onChange, placeholder, onSubmit }, ref) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const digits = String(value.split("\n").length).length;

  useImperativeHandle(
    ref,
    () => ({
      reveal: (offset) => {
        const textarea = wrapRef.current?.querySelector("textarea");
        if (!textarea) {
          return;
        }
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(offset, Math.min(offset + 1, value.length));
        const line = value.slice(0, offset).split("\n").length - 1;
        wrapRef.current?.querySelectorAll(".line-number")[line]?.scrollIntoView({
          block: "center",
        });
      },
    }),
    [value]
  );

  return (
    <StyledJsonEditor ref={wrapRef} $digits={digits}>
      <Editor
        value={value}
        onValueChange={onChange}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && onSubmit) {
            // the editor skips its own Enter handling for a prevented event
            event.preventDefault();
            onSubmit();
            return;
          }
          // Tab in the empty editor, where the placeholder shows, writes it in
          const plainTab =
            event.key === "Tab" &&
            !event.shiftKey &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey;
          if (plainTab && value === "" && placeholder) {
            event.preventDefault();
            onChange(placeholder);
          }
        }}
        highlight={highlightJson}
        placeholder={placeholder}
        padding={{ top: 8, right: 8, bottom: 8, left: `${digits + 2}ch` }}
        tabSize={2}
      />
    </StyledJsonEditor>
  );
});
