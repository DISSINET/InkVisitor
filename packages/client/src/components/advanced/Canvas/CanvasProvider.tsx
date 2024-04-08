import React, { createContext, useState } from "react";
import CanvasContext from "./CanvasContext";
import { CanvasLib } from "@inkvisitor/canvas";

const createCanvasApi = () => {
  let instance: CanvasLib | null = null;

  const setApi = (newInst: CanvasLib) => {
    instance = newInst;
  };

  return { setApi, instance };
};

const CanvasProvider: React.FC<any> = ({ children }) => {
  const [canvasApi] = useState(createCanvasApi());

  return (
    <CanvasContext.Provider value={{ canvasApi }}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasProvider;
