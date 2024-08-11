import React from "react";
import { AiOutlineApartment } from "react-icons/ai";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import {
  FaBook,
  FaMinusCircle,
  FaQuestionCircle,
  FaRegObjectGroup,
} from "react-icons/fa";
import { MdMood, MdWaves } from "react-icons/md";
import { TiPlus } from "react-icons/ti";
import { VscDebugDisconnect } from "react-icons/vsc";

export const attributeIconsKeys = {
  ["certainty"]: <FaQuestionCircle />,
  ["elvl"]: <FaBook />,
  ["logic"]: <TiPlus />,
  ["mood"]: <MdMood />,
  ["moodvariant"]: <MdWaves />,
  ["virtuality"]: <FaRegObjectGroup />,
  ["partitivity"]: <AiOutlineApartment />,
  ["bundleOperator"]: <VscDebugDisconnect />,
  ["bundleStart"]: <BiChevronLeft />,
  ["bundleEnd"]: <BiChevronRight />,
  ["negation"]: <FaMinusCircle />,
};

export const AttributeIcon: React.FC<{
  attributeName: keyof typeof attributeIconsKeys;
}> = ({ attributeName }) => {
  //@ts-ignore
  return attributeIconsKeys[attributeName];
};
