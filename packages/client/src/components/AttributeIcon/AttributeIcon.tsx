import React from "react";
import { AiOutlineApartment } from "react-icons/ai";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import {
  FaBook,
  FaMinusCircle,
  FaQuestionCircle,
  FaRegObjectGroup,
} from "react-icons/fa";
import { MdMood } from "react-icons/md";
import { SiRealm } from "react-icons/si";
import { TiPlus } from "react-icons/ti";
import { VscDebugDisconnect } from "react-icons/vsc";

export const attributeIcons = {
  certainty: <FaQuestionCircle />,
  elvl: <FaBook />,
  logic: <TiPlus />,
  mood: <MdMood />,
  moodvariant: <SiRealm />,
  virtuality: <FaRegObjectGroup />,
  partitivity: <AiOutlineApartment />,
  bundleOperator: <VscDebugDisconnect />,
  bundleStart: <BiChevronLeft />,
  bundleEnd: <BiChevronRight />,
  negation: <FaMinusCircle />,
};

export const AttributeIcon: React.FC<{ attributeName: string }> = ({
  attributeName,
}) => {
  if (Object.keys(attributeIcons).includes(attributeName)) {
    //@ts-ignore
    return attributeIcons[attributeName];
  } else {
    console.log(attributeName);
    return <div />;
  }
};
