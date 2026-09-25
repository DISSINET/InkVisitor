import Prism from "prismjs";
import "prismjs/components/prism-json";
import React from "react";
import Editor from "react-simple-code-editor";
import { StyledJsonEditor } from "./EntityImportModalStyles";

const highlightJson = (code: string) => Prism.highlight(code, Prism.languages.json, "json");

interface EntityImportJsonEditor {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * A plain textarea under a highlighted copy of its text, so typing, pasting,
 * undo and selection stay native while the JSON is colored.
 */
export const EntityImportJsonEditor: React.FC<EntityImportJsonEditor> = ({
  value,
  onChange,
  placeholder,
}) => {
  return (
    <StyledJsonEditor>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlightJson}
        placeholder={placeholder}
        padding={8}
        tabSize={2}
      />
    </StyledJsonEditor>
  );
};
