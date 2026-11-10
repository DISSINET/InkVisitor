import { useQuery } from "@tanstack/react-query";
import React from "react";

import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Query } from "@inkvisitor/shared/types/query";
import api from "api";
import { Checkbox } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import { ButtonSize } from "types";
import { getEntityLabel } from "utils/utils";

import { FilterPopover } from "../../FilterPopover/FilterPopover";
import {
  StyledForm,
  StyledRow,
  StyledRowControl,
  StyledRowHeader,
} from "../../FloatingSearchContainer/FloatingSearchFormStyles";
import { QueryAction, QueryActionType } from "../state";
import { StyledExpansionToggleGroup, StyledPropPairToggles } from "./QueryStyles";

// the edge box shares its grid cell with the edge type picker, so a long
// label is cut on the button and shown whole in its tooltip
const SUMMARY_MAX_LENGTH = 14;

interface EdgePropPairPicker {
  edge: Query.IEdge;
  dispatch: React.Dispatch<QueryAction>;
}

/**
 * The "of type" / "with value" picker of a prop edge: the other half of the
 * matched prop, so only a prop whose type and value both hold matches.
 */
export const EdgePropPairPicker: React.FC<EdgePropPairPicker> = ({ edge, dispatch }) => {
  const half = Query.PropPairEdges[edge.type];
  const propPair = edge.params?.propPair;
  const entityId = propPair?.entityId;

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

  const entityLabel = entity ? getEntityLabel(entity) : "";
  const summary =
    entityLabel.length > SUMMARY_MAX_LENGTH
      ? `${entityLabel.slice(0, SUMMARY_MAX_LENGTH)}…`
      : entityLabel;

  return (
    <FilterPopover
      label={half === "type" ? "of type" : "with value"}
      title={half === "type" ? "Prop type" : "Prop value"}
      count={entityId ? 1 : 0}
      summary={summary || undefined}
      buttonSize={ButtonSize.Small}
      width="24rem"
      tooltipLabel={
        entityLabel
          ? `only props of ${half} ${entityLabel}`
          : `match only props that also have this ${half}`
      }
      onClear={() => setPropPair(undefined)}
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
        <StyledRow>
          <StyledRowHeader>include</StyledRowHeader>
          <StyledRowControl>
            <StyledPropPairToggles>
              <StyledExpansionToggleGroup>
                <Checkbox
                  label="EQ"
                  size={13}
                  color="info"
                  value={propPair?.includeEquivalents === true}
                  disabled={!entityId}
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
                  disabled={!entityId}
                  tooltipLabel="include subordinates"
                  tooltipContent={`Also match a prop whose ${half} is subordinate (subclasses, subordinates, meronyms, all levels) to this one.`}
                  onChangeFn={() => toggle("includeSubordinates")}
                  disableEnterKey
                />
              </StyledExpansionToggleGroup>
            </StyledPropPairToggles>
          </StyledRowControl>
        </StyledRow>
      </StyledForm>
    </FilterPopover>
  );
};
