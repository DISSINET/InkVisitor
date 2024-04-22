import { createContext, useContext } from 'react';
import { CanvasLib } from '@inkvisitor/canvas/src/lib';

interface AnnotatorContextType {
  annotator
  : CanvasLib | null;
  setAnnotator: (instance: CanvasLib) => void;
}

const AnnotatorContext = createContext<AnnotatorContextType | null>(null);

export const useAnnotator = () => {
  const annotatorContext = useContext(AnnotatorContext);
  if (!annotatorContext) {
    throw new Error('useAnnotator must be used within a AnnotatorProvider');
  }
  return { annotator: annotatorContext.annotator, setAnnotator: annotatorContext.setAnnotator}
};

export default AnnotatorContext;
