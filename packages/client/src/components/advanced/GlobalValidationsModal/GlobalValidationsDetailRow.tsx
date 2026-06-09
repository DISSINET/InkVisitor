import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  globalValidationsDict,
  WarningTypeEnums,
} from "@inkvisitor/shared/enums/warning";
import { WarningIcon } from "components";
import Dropdown from "components/advanced";
import React from "react";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import {
  StyledDetailRowControls,
  StyledGridFormLabel,
  StyledToggleWrap,
} from "./GlobalValidationsModalStyles";

// classes the validation targets by default when first switched on
const defaultDmClasses: EntityEnums.Class[] = [
  EntityEnums.Class.Concept,
  EntityEnums.Class.Action,
];

interface GlobalValidationsDetailRow {
  // raw setting value: true (all classes) | string[] (listed) | false/undefined (off)
  value: unknown;
  update: (value: boolean | EntityEnums.Class[]) => void;
}
export const GlobalValidationsDetailRow: React.FC<
  GlobalValidationsDetailRow
> = ({ value, update }) => {
  const selectedClasses: EntityEnums.Class[] =
    value === true
      ? classesAll
      : Array.isArray(value)
      ? (value as EntityEnums.Class[])
      : [];
  const active = value === true || selectedClasses.length > 0;

  return (
    <>
      <StyledGridFormLabel>
        <WarningIcon type={WarningTypeEnums.DM} size={16} />
        {globalValidationsDict.validation_DM.label}
      </StyledGridFormLabel>
      <StyledDetailRowControls>
        <StyledToggleWrap
          $active={active}
          onClick={() => update(active ? false : defaultDmClasses)}
        >
          {active ? (
            <>
              <FaToggleOn size={22} /> active
            </>
          ) : (
            <>
              <FaToggleOff size={22} /> inactive
            </>
          )}
        </StyledToggleWrap>
        {active && (
          <Dropdown.Multi.Entity
            disableEmpty
            width="full"
            value={selectedClasses}
            onChange={(values) => update(values as EntityEnums.Class[])}
            options={entitiesDict}
          />
        )}
      </StyledDetailRowControls>
    </>
  );
};
