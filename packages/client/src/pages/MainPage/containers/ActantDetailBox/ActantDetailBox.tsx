import React, { useState } from "react";

import { Input } from "components";
import { StyledContent } from "./ActandDetailBoxStyles";

interface ActantDetailBox {}
export const ActantDetailBox: React.FC<ActantDetailBox> = ({}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("T");
  const [tagLabel, setTagLabel] = useState("label");

  return (
    <StyledContent>
      <Input
        type="select"
        label="Category: "
        value={selectedCategory}
        options={[]}
        onChangeFn={(newCategory: string) => setSelectedCategory(newCategory)}
      />
      <Input
        label="Label: "
        value={tagLabel}
        onChangeFn={(value: string) => setTagLabel(value)}
      />
    </StyledContent>
  );
};
