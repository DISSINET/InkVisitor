import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import { AttributeButtonGroup, BreadcrumbItem, EntitySuggester } from "components/advanced";
import { useTreeQuery } from "hooks/react-query/useTreeQuery";
import React from "react";
import { searchTree } from "utils/utils";
import {
  StyledTerritoryPath,
  StyledTerritoryFilter,
  StyledTerritoryRow,
  StyledTerritoryRowHead,
} from "./GeocodingListStyles";

/**
 * Scoping the list to a territory.
 *
 * A territory is a position in a tree rather than an item in a list, so this is
 * the page's one filter that cannot be a set of options. It reuses what the
 * entity search box already uses for the same job: `EntitySuggester` to find one
 * by typing, the cached territory tree to recover where it sits, and
 * `BreadcrumbItem` to draw that path.
 *
 * Sub-territories are a separate question from which territory, and the search
 * treats them as one — `territoryId` alone matches that territory exactly.
 */

/**
 * Where a territory sits: itself, preceded by its ancestors.
 *
 * The tree is one request holding every territory, shared under `["tree"]` with
 * the main page's navigation — so asking for it here costs nothing where that
 * page has already loaded it, and fetches it where nothing has. Reading the
 * cache without the query was the mistake this replaces: this page never
 * populates it, so the lookup returned nothing every time.
 */
export const useTerritoryPath = (territoryId: string | undefined): string[] => {
  const { data: tree } = useTreeQuery();
  if (!territoryId || !tree) {
    return [];
  }
  const found = searchTree(tree, territoryId);
  return found ? [...found.path, territoryId] : [];
};

/** What a territory is called, for a chip that has only its id. */
export const useTerritoryLabel = (territoryId: string | undefined): string | undefined => {
  const { data: tree } = useTreeQuery();
  if (!territoryId || !tree) {
    return undefined;
  }
  return searchTree(tree, territoryId)?.territory?.labels?.[0];
};

interface GeocodingTerritoryFilter {
  territoryId: string | undefined;
  subTerritories: boolean;
  onPick: (territoryId: string | undefined) => void;
  onSubTerritories: (included: boolean) => void;
}

export const GeocodingTerritoryFilter: React.FC<GeocodingTerritoryFilter> = ({
  territoryId,
  subTerritories,
  onPick,
  onSubTerritories,
}) => {
  const path = useTerritoryPath(territoryId);

  return (
    <StyledTerritoryFilter>
      <StyledTerritoryRow>
        <StyledTerritoryRowHead>territory</StyledTerritoryRowHead>
        <EntitySuggester
          disableTemplatesAccept
          disableCreate
          categoryTypes={[EntityEnums.Class.Territory]}
          onPicked={(entity: IEntity) => onPick(entity.id)}
          placeholder="find a territory…"
          inputWidth="full"
        />
      </StyledTerritoryRow>

      {path.length ? (
        <>
          {/* where it sits, not just what it is called: two territories often
              share a name and only their ancestors tell them apart */}
          <StyledTerritoryPath>
            {path.map((id) => (
              <BreadcrumbItem key={id} territoryId={id} isSelected={id === territoryId} />
            ))}
          </StyledTerritoryPath>

          <StyledTerritoryRow>
            <StyledTerritoryRowHead>territories below it</StyledTerritoryRowHead>
            <AttributeButtonGroup
              options={[
                {
                  longValue: "included",
                  shortValue: "included",
                  onClick: () => onSubTerritories(true),
                  selected: subTerritories,
                },
                {
                  longValue: "not included",
                  shortValue: "not included",
                  onClick: () => onSubTerritories(false),
                  selected: !subTerritories,
                },
              ]}
            />
          </StyledTerritoryRow>

          <StyledTerritoryRow>
            <StyledTerritoryRowHead />
            <Button
              label="drop this territory"
              color="greyer"
              onClick={() => onPick(undefined)}
            />
          </StyledTerritoryRow>
        </>
      ) : null}
    </StyledTerritoryFilter>
  );
};
