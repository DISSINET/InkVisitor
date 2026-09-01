import React from "react";
import {
  Button,
  EntityEnums,
  IcoClose,
  LetterIcon,
  Tag,
} from "dissinet.ddb.client";

// A tag is two slots the consumer fills: a short type marker and the label.
// EntityTag builds both from an entity; these compose them directly.
// TagGroup is not the wrapper here — it takes entity objects and renders its
// own EntityTags, so a variant sweep lays the tags out itself.
const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

const marker = (letter: string, bgColor: string) => (
  <LetterIcon letter={letter} bgColor={bgColor} color="white" size={18} />
);

export const Default = () => (
  <Tag
    dragDisabled
    tagComponent={marker("P", "primary")}
    labelComponent={<span>Council of Trent</span>}
  />
);

export const EntityTypes = () => (
  <Row>
    <Tag dragDisabled tagComponent={marker("P", "primary")} labelComponent={<span>Charles V</span>} />
    <Tag dragDisabled tagComponent={marker("A", "success")} labelComponent={<span>to convene</span>} />
    <Tag dragDisabled tagComponent={marker("C", "info")} labelComponent={<span>Holy Roman Empire</span>} />
    <Tag dragDisabled tagComponent={marker("L", "warning")} labelComponent={<span>Trento</span>} />
    <Tag dragDisabled tagComponent={marker("T", "danger")} labelComponent={<span>1545–1563</span>} />
  </Row>
);

export const StatusBorders = () => (
  <Row>
    <Tag
      dragDisabled
      tagBorderColorKey={EntityEnums.Status.Pending}
      tagComponent={marker("P", "primary")}
      labelComponent={<span>Pending</span>}
    />
    <Tag
      dragDisabled
      tagBorderColorKey={EntityEnums.Status.Approved}
      tagComponent={marker("P", "primary")}
      labelComponent={<span>Approved</span>}
    />
    <Tag
      dragDisabled
      tagBorderColorKey={EntityEnums.Status.Discouraged}
      tagComponent={marker("P", "primary")}
      labelComponent={<span>Discouraged</span>}
    />
    <Tag
      dragDisabled
      tagBorderColorKey={EntityEnums.Status.Warning}
      tagComponent={marker("P", "primary")}
      labelComponent={<span>Warning</span>}
    />
  </Row>
);

export const LogicalTypes = () => (
  <Row>
    <Tag
      dragDisabled
      borderStyleKey={EntityEnums.LogicalType.Definite}
      tagComponent={marker("C", "info")}
      labelComponent={<span>Definite</span>}
    />
    <Tag
      dragDisabled
      borderStyleKey={EntityEnums.LogicalType.Indefinite}
      tagComponent={marker("C", "info")}
      labelComponent={<span>Indefinite</span>}
    />
    <Tag
      dragDisabled
      borderStyleKey={EntityEnums.LogicalType.Hypothetical}
      tagComponent={marker("C", "info")}
      labelComponent={<span>Hypothetical</span>}
    />
    <Tag
      dragDisabled
      borderStyleKey={EntityEnums.LogicalType.Generic}
      tagComponent={marker("C", "info")}
      labelComponent={<span>Generic</span>}
    />
  </Row>
);

export const WithTrailingActions = () => (
  <Tag
    dragDisabled
    tagComponent={marker("A", "success")}
    labelComponent={<span>to convene</span>}
    rightContent={
      <Button icon={<IcoClose />} color="danger" noBackground onClick={() => {}} />
    }
  />
);

export const ShowOnly = () => (
  <Row>
    <Tag dragDisabled showOnly="tag" tagComponent={marker("P", "primary")} labelComponent={<span>Charles V</span>} />
    <Tag dragDisabled showOnly="label" tagComponent={marker("P", "primary")} labelComponent={<span>Charles V</span>} />
  </Row>
);
