import { certaintyDict, moodDict, operatorDict } from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { IProp } from "@shared/types";
import { AttributeIcon, BundleButtonGroup, Dropdown } from "components";
import {
  ElvlButtonGroup,
  LogicButtonGroup,
  MoodVariantButtonGroup,
} from "components/advanced";
import React from "react";
import { PropAttributeFilter } from "types";

interface PropGroupRowStatementAttributes {
  prop: IProp;
  updateProp: (propId: string, changes: any) => void;
  isExpanded: boolean;
  disabledAttributes: PropAttributeFilter;
  userCanEdit: boolean;
}
export const PropGroupRowStatementAttributes: React.FC<
  PropGroupRowStatementAttributes
> = ({ prop, updateProp, isExpanded, disabledAttributes, userCanEdit }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
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
          />
        )}
        {/* Logic */}
        {!disabledAttributes.statement?.includes("logic") && (
          <LogicButtonGroup
            border
            value={prop.logic}
            onChange={(logic) => updateProp(prop.id, { logic: logic })}
          />
        )}
        {/* mood */}
        {!disabledAttributes.statement?.includes("mood") && (
          <Dropdown
            width={100}
            isMulti
            disabled={!userCanEdit}
            placeholder="mood"
            tooltipLabel="mood"
            icon={<AttributeIcon attributeName="mood" />}
            options={moodDict}
            value={[allEntities]
              .concat(moodDict)
              .filter((i: any) => prop.mood.includes(i.value))}
            onChange={(newValue: any) => {
              updateProp(prop.id, {
                ...prop,
                mood: newValue ? newValue.map((v: any) => v.value) : [],
              });
            }}
          />
        )}
      </div>
      {isExpanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div>
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
                />
              )}
            </div>
            {!disabledAttributes.statement?.includes("bundleOperator") && (
              <div>
                <Dropdown
                  width={50}
                  placeholder="logical operator"
                  tooltipLabel="logical operator"
                  icon={<AttributeIcon attributeName="bundleOperator" />}
                  disabled={!userCanEdit}
                  options={operatorDict}
                  value={operatorDict.find(
                    (i: any) => prop.bundleOperator === i.value
                  )}
                  onChange={(newValue: any) => {
                    updateProp(prop.id, {
                      ...prop,
                      bundleOperator: newValue.value,
                    });
                  }}
                />
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div>
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
              />
            </div>
            <div>
              {!disabledAttributes.statement?.includes("certainty") && (
                <Dropdown
                  width={100}
                  placeholder="certainty"
                  tooltipLabel="certainty"
                  icon={<AttributeIcon attributeName="certainty" />}
                  disabled={!userCanEdit}
                  options={certaintyDict}
                  value={certaintyDict.find(
                    (i: any) => prop.certainty === i.value
                  )}
                  onChange={(newValue: any) => {
                    updateProp(prop.id, { ...prop, certainty: newValue.value });
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};