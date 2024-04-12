import React, { useState } from "react";
import CanvasContext from "./CanvasContext";
import { CanvasLib } from "@inkvisitor/canvas/src/lib";

const CanvasProvider: React.FC<any> = ({ children }) => {
  const [canvas, setCanvas] = useState<CanvasLib|null>(null);

  return (
    <CanvasContext.Provider value={{canvas, setCanvas}} da={1}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasProvider;
