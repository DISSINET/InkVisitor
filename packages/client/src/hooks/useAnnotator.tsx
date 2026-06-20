type AnnotatorRef = {
  scrollToAnchor: (anchor: string, occurence?: number) => void;
  highlightAnchorByTag: (tag: string) => void;
  clearHoverHighlight: () => void;
};

// singleton ref outside the hook
const annotatorRef = { current: null as AnnotatorRef | null };

export const setAnnotatorInstance = (annotator: AnnotatorRef | null) => {
  annotatorRef.current = annotator;
};

export const scrollToAnchor = (anchor: string, occurence?: number) => {
  annotatorRef.current?.scrollToAnchor(anchor, occurence);
};

export const highlightAnchorByTag = (tag: string) => {
  annotatorRef.current?.highlightAnchorByTag(tag);
};

export const clearHoverHighlight = () => {
  annotatorRef.current?.clearHoverHighlight();
};

const useAnnotator = () => ({
  setAnnotator: setAnnotatorInstance,
  scrollToAnchor,
  highlightAnchorByTag,
  clearHoverHighlight,
});

export default useAnnotator;
