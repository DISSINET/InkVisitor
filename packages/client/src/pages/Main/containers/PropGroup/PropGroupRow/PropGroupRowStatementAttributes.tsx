import { certaintyDict, moodDict, operatorDict } from "@shared/dictionaries";
import { IProp } from "@shared/types";
import { AttributeIcon, BundleButtonGroup } from "components";
import Dropdown, {
  ElvlButtonGroup,
  LogicButtonGroup,
  MoodVariantButtonGroup,
} from "components/advanced";
import React from "react";
import { PropAttributeFilter } from "types";
import {
  StyledAttributesFlexColumn,
  StyledAttributesFlexRow,
} from "./PropGroupRowStyles";

interface PropGroupRowStatementAttributes {
  prop: IProp;
  updateProp: (propId: string, changes: Partial<IProp>) => void;
  isExpanded: boolean;
  disabledAttributes: PropAttributeFilter;
  userCanEdit: boolean;
  buttons: JSX.Element;
}
export const PropGroupRowStatementAttributes: React.FC<
  PropGroupRowStatementAttributes
> = ({
  prop,
  updateProp,
  isExpanded,
  disabledAttributes,
  userCanEdit,
  buttons,
}) => {
  return (
    <StyledAttributesFlexColumn>
      <StyledAttributesFlexRow>
        {/* Elvl */}
        {!disabledAttributes.statement?.includes("elvl") && (
          <ElvlButtonGroup
            border
            value={prop.elvl}
            onChange={(elvl) =>
              updateProp(prop.id, {
                ...prop,
                elvl: elvl,
              })
            }
            disabled={!userCanEdit}
          />
        )}
        {!disabledAttributes.statement?.includes("mood") && (
          <Dropdown.Multi.Attribute
            width={131}
            disabled={!userCanEdit}
            placeholder="mood"
            tooltipLabel="mood"
            icon={<AttributeIcon attributeName="mood" />}
            options={moodDict}
            value={prop.mood}
            onChange={(newValues) => {
              updateProp(prop.id, {
                ...prop,
                mood: newValues,
              });
            }}
          />
        )}
        {!disabledAttributes.statement?.includes("moodvariant") && (
          <MoodVariantButtonGroup
            border
            value={prop.moodvariant}
            onChange={(moodvariant) =>
              updateProp(prop.id, {
                ...prop,
                moodvariant: moodvariant,
              })
            }
            disabled={!userCanEdit}
          />
        )}
        {buttons}
      </StyledAttributesFlexRow>
      {/* )} */}
      {isExpanded && (
        <>
          <StyledAttributesFlexRow>
            {/* Logic */}
            {!disabledAttributes.statement?.includes("logic") && (
              <LogicButtonGroup
                border
                value={prop.logic}
                onChange={(logic) => updateProp(prop.id, { logic: logic })}
                disabled={!userCanEdit}
              />
            )}
            {!disabledAttributes.statement?.includes("bundleOperator") && (
              <Dropdown.Single.Basic
                width={70}
                placeholder="logical operator"
                tooltipLabel="logical operator"
                icon={<AttributeIcon attributeName="bundleOperator" />}
                disabled={!userCanEdit}
                options={operatorDict}
                value={prop.bundleOperator}
                onChange={(newValue) => {
                  updateProp(prop.id, {
                    ...prop,
                    bundleOperator: newValue,
                  });
                }}
              />
            )}
            {/* Bundle start|end */}
            <BundleButtonGroup
              bundleStart={prop.bundleStart}
              onBundleStartChange={(bundleStart) =>
                updateProp(prop.id, {
                  ...prop,
                  bundleStart: bundleStart,
                })
              }
              bundleEnd={prop.bundleEnd}
              onBundleEndChange={(bundleEnd) =>
                updateProp(prop.id, {
                  ...prop,
                  bundleEnd: bundleEnd,
                })
              }
              disabled={!userCanEdit}
            />
          </StyledAttributesFlexRow>

          {/* ROW */}
          <StyledAttributesFlexRow>
            {!disabledAttributes.statement?.includes("certainty") && (
              <Dropdown.Single.Basic
                width={122}
                placeholder="certainty"
                tooltipLabel="certainty"
                icon={<AttributeIcon attributeName="certainty" />}
                disabled={!userCanEdit}
                options={certaintyDict}
                value={prop.certainty}
                onChange={(newValue) => {
                  updateProp(prop.id, {
                    ...prop,
                    certainty: newValue,
                  });
                }}
              />
            )}
          </StyledAttributesFlexRow>
        </>
      )}
    </StyledAttributesFlexColumn>
  );
};
