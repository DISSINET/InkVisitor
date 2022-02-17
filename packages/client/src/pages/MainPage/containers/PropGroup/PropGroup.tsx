import { IActant, IProp } from "@shared/types";
import api from "api";
import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { PropGroupRow } from "./PropGroupRow/PropGroupRow";
import { StyledGrid, StyledListHeaderColumn } from "./PropGroupStyles";
import update from "immutability-helper";

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

  useEffect(() => {
    setFirstLevelProps(props);
  }, [props]);

  const [firstLevelProps, setFirstLevelProps] = useState<IProp[]>([]);

  const moveFirstLevelProp = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setFirstLevelProps((prevCards) =>
        update(prevCards, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevCards[dragIndex]],
          ],
        })
      );
    },
    []
  );

  // PREPARATION FOR DRAG AND DROP
  // const renderFirsLevelPropRow = useCallback((prop1: IProp, pi1: number) => {
  //   return (
  //     <div key={prop1.id}>
  //       <PropGroupRow
  //         prop={prop1}
  //         entities={entities}
  //         level={"1"}
  //         order={pi1}
  //         firstRowinGroup={pi1 === 0}
  //         lastRowinGroup={pi1 === props.length - 1}
  //         lastSecondLevel={false}
  //         updateProp={updateProp}
  //         removeProp={removeProp}
  //         addProp={addProp}
  //         movePropDown={movePropDown}
  //         movePropUp={movePropUp}
  //         userCanEdit={userCanEdit}
  //         territoryActants={territoryActants || []}
  //         openDetailOnCreate={openDetailOnCreate}
  //       />
  //       {prop1.children.map((prop2: IProp, pi2: number) =>
  //         renderSecondLevelPropRow(prop2, pi2, prop1)
  //       )}
  //     </div>
  //   );
  // }, []);

  // const renderSecondLevelPropRow = useCallback(
  //   (prop2: IProp, pi2: number, prop1: IProp) => {
  //     return (
  //       <div key={prop2.id}>
  //         <PropGroupRow
  //           prop={prop2}
  //           entities={entities}
  //           level={"2"}
  //           order={pi2}
  //           firstRowinGroup={pi2 === 0}
  //           lastRowinGroup={pi2 === prop1.children.length - 1}
  //           lastSecondLevel={pi2 === prop1.children.length - 1}
  //           updateProp={updateProp}
  //           removeProp={removeProp}
  //           addProp={addProp}
  //           movePropDown={movePropDown}
  //           movePropUp={movePropUp}
  //           userCanEdit={userCanEdit}
  //           territoryActants={territoryActants || []}
  //           openDetailOnCreate={openDetailOnCreate}
  //         />
  //       </div>
  //     );
  //   },
  //   []
  // );

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
              <div key={prop1.id}>
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
                    <div key={prop2.id}>
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
                    </div>
                  );
                })}
              </div>
            );
          })}
        </React.Fragment>
      </td>
    </tr>
  ) : (
    <tr />
  );
};
