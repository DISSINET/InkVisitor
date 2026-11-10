import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";

import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import api from "api";
import { Checkbox, Tooltip } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import { IcoClose } from "Theme/icons";
import { getEntityLabel } from "utils/utils";

import { FilterPopover } from "../../FilterPopover/FilterPopover";
import {
  StyledForm,
  StyledRow,
  StyledRowControl,
  StyledRowHeader,
} from "../../FloatingSearchContainer/FloatingSearchFormStyles";
import { QueryAction, QueryActionType } from "../state";
import {
  StyledExpansionToggleGroup,
  StyledPropPairTabLabel,
  StyledPropPairTabClear,
  StyledPropPairTabToggles,
} from "./QueryStyles";

interface EdgePropPairPicker {
  edge: Query.IEdge;
  dispatch: React.Dispatch<QueryAction>;
}

/**
 * The "of type" / "with value" pick of a prop edge, the content of the tab
 * below the edge box: the other half of the matched prop, so only a prop whose
 * type and value both hold matches. The label opens the panel that picks the
 * entity; EQ / SUB widen the picked one.
 */
export const EdgePropPairPicker: React.FC<EdgePropPairPicker> = ({ edge, dispatch }) => {
  const half = Query.PropPairEdges[edge.type];
  const propPair = edge.params?.propPair;
  const entityId = propPair?.entityId;

  const [labelElement, setLabelElement] = useState<HTMLButtonElement | null>(null);
  const [isLabelHovered, setIsLabelHovered] = useState(false);

  const { data: entity } = useQuery({
    queryKey: ["entity", "query-edge-prop-pair", entityId],
    queryFn: async () => {
      const res = await api.entityGet(entityId!);
      return res.data;
    },
    enabled: !!entityId && api.isLoggedIn(),
  });

  if (!half) {
    return null;
  }

  const setPropPair = (newPropPair: Query.IPropPair | undefined) =>
    dispatch({
      type: QueryActionType.updateEdgePropPair,
      payload: { edgeId: edge.id, propPair: newPropPair },
    });

  const toggle = (field: "includeEquivalents" | "includeSubordinates") => {
    if (propPair) {
      setPropPair({ ...propPair, [field]: propPair[field] ? undefined : true });
    }
  };

  const pairLabel = half === "type" ? "of type" : "with value";
  const entityLabel = entity ? getEntityLabel(entity) : "";

  return (
    <>
      <FilterPopover
        label={pairLabel}
        title={half === "type" ? "Prop type" : "Prop value"}
        count={entityId ? 1 : 0}
        width="24rem"
        onClear={() => setPropPair(undefined)}
        trigger={(togglePanel) => (
          <>
            <StyledPropPairTabLabel
              ref={setLabelElement}
              type="button"
              onClick={togglePanel}
              onMouseEnter={() => setIsLabelHovered(true)}
              onMouseLeave={() => setIsLabelHovered(false)}
            >
              {entityLabel ? `${pairLabel}: ${entityLabel}` : `+ ${pairLabel}`}
            </StyledPropPairTabLabel>
            {entityId && (
              <StyledPropPairTabToggles>
                <StyledExpansionToggleGroup>
                  <Checkbox
                    label="EQ"
                    size={13}
                    color="info"
                    value={propPair?.includeEquivalents === true}
                    tooltipLabel="include equivalents"
                    tooltipContent={`Also match a prop whose ${half} is equivalent (SYN, IDE, AEE) to this one.`}
                    onChangeFn={() => toggle("includeEquivalents")}
                    disableEnterKey
                  />
                </StyledExpansionToggleGroup>
                <StyledExpansionToggleGroup>
                  <Checkbox
                    label="SUB"
                    size={13}
                    color="warning"
                    value={propPair?.includeSubordinates === true}
                    tooltipLabel="include subordinates"
                    tooltipContent={`Also match a prop whose ${half} is subordinate (subclasses, subordinates, meronyms, all levels) to this one.`}
                    onChangeFn={() => toggle("includeSubordinates")}
                    disableEnterKey
                  />
                </StyledExpansionToggleGroup>
              </StyledPropPairTabToggles>
            )}
            {entityId && (
              <StyledPropPairTabClear type="button" onClick={() => setPropPair(undefined)}>
                <IcoClose size={10} />
              </StyledPropPairTabClear>
            )}
          </>
        )}
      >
        <StyledForm>
          <StyledRow>
            <StyledRowHeader>{half}</StyledRowHeader>
            <StyledRowControl>
              {entityId ? (
                entity && (
                  <EntityTag
                    entity={entity}
                    tagMaxWidth={220}
                    unlinkButton={{ onClick: () => setPropPair(undefined) }}
                  />
                )
              ) : (
                <EntitySuggester
                  inputWidth="full"
                  suggestionListWidth={320}
                  categoryTypes={half === "type" ? [EntityEnums.Class.Concept] : classesAll}
                  initCategory={EntityEnums.Class.Concept}
                  placeholder={`prop ${half}`}
                  disableCreate
                  onSelected={(newEntityId: string) => setPropPair({ entityId: newEntityId })}
                />
              )}
            </StyledRowControl>
          </StyledRow>
        </StyledForm>
      </FilterPopover>
      <Tooltip
        visible={isLabelHovered}
        referenceElement={labelElement}
        position="top"
        portalId="page"
        label={
          entityLabel
            ? `only props of ${half} ${entityLabel}`
            : `match only props that also have this ${half}`
        }
      />
    </>
  );
};
