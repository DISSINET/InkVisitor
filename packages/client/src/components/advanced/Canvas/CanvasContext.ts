import { createContext, useContext } from 'react';
import { CanvasLib } from '@inkvisitor/canvas/src/lib';

interface CanvasContextType {
  canvas: CanvasLib | null;
  setCanvas: (instance: CanvasLib) => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {
  const canvasContext = useContext(CanvasContext);
  if (!canvasContext) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return { canvas: canvasContext.canvas, setCanvas: canvasContext.setCanvas}
};

export default CanvasContext;
