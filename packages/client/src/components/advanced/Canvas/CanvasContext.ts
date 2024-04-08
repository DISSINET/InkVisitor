import { CanvasLib } from '@inkvisitor/canvas';
import { createContext, useContext } from 'react';

interface CanvasApi {
  setApi: (lib: CanvasLib) => void;
}

interface CanvasContextType {
  canvasApi: CanvasApi;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {
  const canvasContext = useContext(CanvasContext);
  if (!canvasContext) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return canvasContext.canvasApi;
};

export default CanvasContext;
