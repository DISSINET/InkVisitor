import Prism from "./prism";
import "prismjs/components/prism-json";
import React from "react";
import Editor from "react-simple-code-editor";
import { StyledJsonEditor } from "./EntityImportModalStyles";

const highlightJson = (code: string) => Prism.highlight(code, Prism.languages.json, "json");

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
export const EntityImportJsonEditor: React.FC<EntityImportJsonEditor> = ({
  value,
  onChange,
  placeholder,
  onSubmit,
}) => {
  return (
    <StyledJsonEditor>
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
        padding={8}
        tabSize={2}
      />
    </StyledJsonEditor>
  );
};
