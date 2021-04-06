import React, { useState } from "react";

import { Input } from "components";
import { StyledContent } from "./ActandDetailBoxStyles";

interface ActantDetailBox {
  category: string;
  label: string;
}
export const ActantDetailBox: React.FC<ActantDetailBox> = ({
  category,
  label,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(category);
  const [tagLabel, setTagLabel] = useState(label);

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
