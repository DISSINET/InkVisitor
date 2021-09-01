import { FaQuestionCircle, FaBook, FaRegObjectGroup } from "react-icons/fa";
import { TiPlus } from "react-icons/ti";
import { MdMood } from "react-icons/md";
import { SiRealm } from "react-icons/si";
import { GrVirtualMachine, GrConnect } from "react-icons/gr";
import { AiOutlineApartment } from "react-icons/ai";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { VscDebugDisconnect } from "react-icons/vsc";

import React from "react";

export const attributeIcons = {
  certainty: <FaQuestionCircle />,
  elvl: <FaBook />,
  logic: <TiPlus />,
  mood: <MdMood />,
  moodvariant: <SiRealm />,
  // virtuality: <GrVirtualMachine />,
  virtuality: <FaRegObjectGroup />,
  partitivity: <AiOutlineApartment />,
  // operator: <GrConnect  />,
  operator: <VscDebugDisconnect />,
  bundleStart: <BiChevronLeft />,
  bundleEnd: <BiChevronRight />,
};

export const AttributeIcon: React.FC<{ attributeName: string }> = ({
  attributeName,
}) => {
  //@ts-ignore
  return attributeIcons[attributeName];
};
