import { entityStatusDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { AttributeButtonGroup } from "components/advanced";
import React from "react";
import { getEntityStatusIcon } from "utils/iconUtils";

interface EntityDetailStatusButtons {
  status: EntityEnums.Status;
  onChange: (status: EntityEnums.Status) => void;
  disabled: boolean;
  iconsOnly: boolean;
}
export const EntityDetailStatusButtons: React.FC<EntityDetailStatusButtons> = ({
  status,
  onChange,
  disabled,
  iconsOnly,
}) => {
  return (
    <AttributeButtonGroup
      noMargin
      iconsOnly={iconsOnly}
      disabled={disabled}
      options={entityStatusDict.map((entityStatusOption) => {
        const icon = getEntityStatusIcon(entityStatusOption["value"]);

        return {
          longValue: entityStatusOption["label"],
          shortValue: entityStatusOption["label"],
          icon: iconsOnly ? icon : undefined,
          onClick: () => {
            onChange(entityStatusOption["value"]);
          },
          selected: entityStatusOption["value"] === status,
        };
      })}
    />
  );
};
