import Prism from "./prism";
import "prismjs/components/prism-json";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import Editor from "react-simple-code-editor";
import { StyledJsonEditor, StyledPlainJsonEditor } from "./EntityImportModalStyles";

// the number of each line sits at the line's start, taken out of the flow
// into the left padding, so it stays with its line when the line wraps; a
// JSON token never spans lines, so the highlighted text splits at newlines
const highlightJson = (code: string) =>
  Prism.highlight(code, Prism.languages.json, "json")
    .split("\n")
    .map((line, index) => `<span class="line-number">${index + 1}</span>${line}`)
    .join("\n");

// Past this many lines the field is a plain textarea: each keystroke in the
// highlighted copy lays out the whole text again, a second or two at 50 000
// lines, against a fraction of a second in a plain textarea.
const PLAIN_FROM_LINES = 5000;

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
  const lineCount = value.split("\n").length;
  const isPlain = lineCount > PLAIN_FROM_LINES;
  const digits = String(lineCount).length;
  // the parent passes a new onSubmit on each render; read through a ref, it
  // leaves the editor element below unchanged
  const onSubmitRef = useRef(onSubmit);
  useLayoutEffect(() => {
    onSubmitRef.current = onSubmit;
  });

  useImperativeHandle(
    ref,
    () => ({
      reveal: (offset) => {
        const textarea = wrapRef.current?.querySelector("textarea");
        if (!textarea) {
          return;
        }
        if (isPlain) {
          // the plain field doesn't wrap, so a line and a column sit at a
          // known place; a textarea doesn't scroll to a selection by itself
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(offset, Math.min(offset + 1, value.length));
          const lines = value.slice(0, offset).split("\n");
          const style = getComputedStyle(textarea);
          const lineHeight = parseFloat(style.lineHeight);
          const context = document.createElement("canvas").getContext("2d");
          if (context) {
            context.font = style.font;
          }
          const charWidth = context?.measureText("0").width ?? 0;
          textarea.scrollTop = (lines.length - 1) * lineHeight - textarea.clientHeight / 2;
          textarea.scrollLeft = lines[lines.length - 1].length * charWidth - textarea.clientWidth / 2;
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
    [value, isPlain]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const onSubmit = onSubmitRef.current;
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && onSubmit) {
        // the editor skips its own Enter handling for a prevented event
        event.preventDefault();
        onSubmit();
        return;
      }
      // Tab in the empty editor, where the placeholder shows, writes it in
      const plainTab =
        event.key === "Tab" && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey;
      if (plainTab && value === "" && placeholder) {
        event.preventDefault();
        onChange(placeholder);
      }
    },
    [value, onChange, placeholder]
  );

  // Each render of the editor sets the highlighted HTML anew, as React 19
  // writes a new dangerouslySetInnerHTML object even when its HTML is the
  // same, and a long JSON then takes a second to restyle and lay out. The
  // element is kept while the text stays, so a render of the modal (the
  // loader, an error) skips the editor.
  const editor = useMemo(() => {
    if (isPlain) {
      return (
        <StyledPlainJsonEditor
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          wrap="off"
        />
      );
    }
    const highlighted = highlightJson(value);
    return (
      <Editor
        value={value}
        onValueChange={onChange}
        onKeyDown={handleKeyDown}
        highlight={() => highlighted}
        placeholder={placeholder}
        padding={{ top: 8, right: 8, bottom: 8, left: `${digits + 2}ch` }}
        tabSize={2}
      />
    );
  }, [value, onChange, placeholder, digits, isPlain, handleKeyDown]);

  return (
    <StyledJsonEditor ref={wrapRef} $digits={digits} $plain={isPlain}>
      {editor}
    </StyledJsonEditor>
  );
});
