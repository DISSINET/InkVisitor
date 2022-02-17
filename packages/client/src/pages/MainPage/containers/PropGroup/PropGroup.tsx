import { IActant, IProp } from "@shared/types";
import api from "api";
import { AttributeIcon, Button } from "components";
import React from "react";
import {
  FaCaretDown,
  FaCaretUp,
  FaPlus,
  FaTrashAlt,
  FaUnlink,
} from "react-icons/fa";
import { useQuery } from "react-query";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  AttributeGroupDataObject,
  classesPropType,
  classesPropValue,
} from "types";
import { AttributesGroupEditor } from "../AttributesEditor/AttributesGroupEditor";
import { EntitySuggester, EntityTag } from "./../";
import { PropGroupRow } from "./PropGroupRow/PropGroupRow";
import {
  StyledGrid,
  StyledListHeaderColumn,
  StyledPropButtonGroup,
  StyledPropLineColumn,
} from "./PropGroupStyles";

interface IPropGroup {
  originId: string;
  entities: { [key: string]: IActant };
  props: IProp[];
  territoryId: string;

  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  addProp: (originId: string) => void;
  movePropDown: (propId: string) => void;
  movePropUp: (propId: string) => void;

  userCanEdit: boolean;
  openDetailOnCreate: boolean;
}

export const PropGroup: React.FC<IPropGroup> = ({
  originId,
  entities,
  props,
  territoryId,

  updateProp,
  removeProp,
  addProp,
  movePropDown,
  movePropUp,

  userCanEdit,
  openDetailOnCreate = false,
}) => {
  // territory query
  const {
    status,
    data: territoryActants,
    error,
    isFetching,
  } = useQuery(
    ["territoryActants", territoryId],
    async () => {
      if (territoryId) {
        const res = await api.actantIdsInTerritory(territoryId);
        return res.data;
      } else {
        return [];
      }
    },
    {
      initialData: [],
      enabled: !!territoryId && api.isLoggedIn(),
    }
  );

  return props.length > 0 ? (
    <tr>
      <td colSpan={4}>
        <React.Fragment key={originId}>
          <StyledGrid>
            {/* Header */}
            <StyledListHeaderColumn>Type</StyledListHeaderColumn>
            <StyledListHeaderColumn>Value</StyledListHeaderColumn>
            <StyledListHeaderColumn></StyledListHeaderColumn>
          </StyledGrid>
          {/* Rows */}
          {props.map((prop1: IProp, pi1: number) => {
            return (
              <React.Fragment key={prop1.id}>
                <PropGroupRow
                  prop={prop1}
                  entities={entities}
                  level={"1"}
                  order={pi1}
                  firstRowinGroup={pi1 === 0}
                  lastRowinGroup={pi1 === props.length - 1}
                  lastSecondLevel={false}
                  updateProp={updateProp}
                  removeProp={removeProp}
                  addProp={addProp}
                  movePropDown={movePropDown}
                  movePropUp={movePropUp}
                  userCanEdit={userCanEdit}
                  territoryActants={territoryActants || []}
                  openDetailOnCreate={openDetailOnCreate}
                />
                {prop1.children.map((prop2: IProp, pi2: number) => {
                  return (
                    <React.Fragment key={prop2.id}>
                      <PropGroupRow
                        prop={prop2}
                        entities={entities}
                        level={"2"}
                        order={pi2}
                        firstRowinGroup={pi2 === 0}
                        lastRowinGroup={pi2 === prop1.children.length - 1}
                        lastSecondLevel={pi2 === prop1.children.length - 1}
                        updateProp={updateProp}
                        removeProp={removeProp}
                        addProp={addProp}
                        movePropDown={movePropDown}
                        movePropUp={movePropUp}
                        userCanEdit={userCanEdit}
                        territoryActants={territoryActants || []}
                        openDetailOnCreate={openDetailOnCreate}
                      />
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </React.Fragment>
      </td>
    </tr>
  ) : (
    <tr />
  );
};
