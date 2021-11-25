import {
  FaQuestionCircle,
  FaBook,
  FaRegObjectGroup,
  FaMinusSquare,
  FaMinusCircle,
} from "react-icons/fa";
import { TiPlus } from "react-icons/ti";
import { MdMood } from "react-icons/md";
import { SiRealm } from "react-icons/si";
import { AiOutlineApartment, AiOutlineMinusCircle } from "react-icons/ai";
import { BiChevronLeft, BiChevronRight, BiMinus } from "react-icons/bi";
import { VscDebugDisconnect } from "react-icons/vsc";

import React from "react";
export const attributeIcons = {
  certainty: <FaQuestionCircle />,
  elvl: <FaBook />,
  logic: <TiPlus />,
  mood: <MdMood />,
  moodvariant: <SiRealm />,
  virtuality: <FaRegObjectGroup />,
  partitivity: <AiOutlineApartment />,
  operator: <VscDebugDisconnect />,
  bundleStart: <BiChevronLeft />,
  bundleEnd: <BiChevronRight />,
  negation: <FaMinusCircle />,
};

export const AttributeIcon: React.FC<{ attributeName: string }> = ({
  attributeName,
}) => {
  //@ts-ignore
  return attributeIcons[attributeName];
};
