import { FaQuestionCircle, FaBook } from "react-icons/fa";
import { TiPlus } from "react-icons/ti";
import { MdMood } from "react-icons/md";
import { SiRealm } from "react-icons/si";
import { GrVirtualMachine, GrConnect } from "react-icons/gr";
import { AiOutlineApartment } from "react-icons/ai";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

import React from "react";

export const attributeIcons = {
  certainty: <FaQuestionCircle />,
  elvl: <FaBook />,
  logic: <TiPlus />,
  mood: <MdMood />,
  moodvariant: <SiRealm />,
  virtuality: <GrVirtualMachine />,
  partitivity: <AiOutlineApartment />,
  operator: <GrConnect />,
  bundleStart: <BiChevronLeft />,
  bundleEnd: <BiChevronRight />,
};

export const AttributeCertaintyIcon: React.FC = () => {
  return <FaQuestionCircle />;
};

export const AttributeIcon: React.FC<{ attributeName: string }> = ({
  attributeName,
}) => {
  // console.log(attributeName);
  //@ts-ignore
  return attributeIcons[attributeName];
};
