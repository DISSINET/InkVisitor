import React, { useState } from "react";
import AnnotatorContext from "./AnnotatorContext";
import { CanvasLib } from "@inkvisitor/canvas/src/lib";

const AnnotatorProvider: React.FC<any> = ({ children }) => {
  const [annotator, setAnnotator] = useState<CanvasLib | null>(null);

  return (
    <AnnotatorContext.Provider value={{ annotator, setAnnotator }}>
      {children}
    </AnnotatorContext.Provider>
  );
};

export default AnnotatorProvider;
