import { useCallback } from "react";

type AnnotatorRef = {
  scrollToAnchor: (anchor: string, occurence?: number) => void;
};

// singleton ref outside the hook
const annotatorRef = { current: null as AnnotatorRef | null };

const useAnnotator = () => {
  const setAnnotator = useCallback((annotator: AnnotatorRef) => {
    annotatorRef.current = annotator;
  }, []);

  const scrollToAnchor = useCallback((anchor: string, occurence?: number) => {
    if (annotatorRef.current) {
      annotatorRef.current.scrollToAnchor(anchor, occurence);
    }
  }, []);

  return {
    setAnnotator,
    scrollToAnchor,
  };
};

export default useAnnotator;
