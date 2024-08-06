import React, { useState } from "react";
import AnnotatorContext from "./AnnotatorContext";
import { Annotator } from "@inkvisitor/annotator/src/lib";

const AnnotatorProvider: React.FC<any> = ({ children }) => {
  const [annotator, setAnnotator] = useState<Annotator | null>(null);

  return (
    <AnnotatorContext.Provider value={{ annotator, setAnnotator }}>
      {children}
    </AnnotatorContext.Provider>
  );
};

export default AnnotatorProvider;
