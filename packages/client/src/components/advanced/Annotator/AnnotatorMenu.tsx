import { IResponseEntity } from "@shared/types";
import React from "react";

interface TextAnnotatorMenuProps {
  text: string;
  anchors: string[];
  entities: Record<string, IResponseEntity>;
}

export const TextAnnotatorMenu = ({
  text,
  anchors,
  entities,
}: TextAnnotatorMenuProps) => {
  return <div style={{}}>{text}</div>;
};

export default TextAnnotatorMenu;
