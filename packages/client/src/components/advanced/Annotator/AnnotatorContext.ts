import { createContext, useContext } from 'react';
import { Annotator } from '@inkvisitor/annotator/src/lib';

interface AnnotatorContextType {
  annotator
  : Annotator | null;
  setAnnotator: (instance: Annotator) => void;
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
