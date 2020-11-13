import React, { useState } from "react";
import { Tag, Button, Input, Suggester, DropDown } from "components";

interface ActantSuggester {}

export const ActantSuggester: React.FC<ActantSuggester> = ({}) => {
  const [typed, setTyped] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  return <div />;
};
