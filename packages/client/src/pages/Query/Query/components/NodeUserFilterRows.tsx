import { Explore, Query } from "@inkvisitor/shared/types/query";
import Dropdown from "components/advanced";
import React from "react";
import {
  StyledRow,
  StyledRowControl,
  StyledRowHeader,
} from "../../FloatingSearchContainer/FloatingSearchFormStyles";
import { useUserFilterOptions } from "../../FloatingSearchContainer/useUserFilterOptions";

interface NodeUserFilterRows {
  params: Query.INodeParams;
  onChange: (changes: Partial<Query.INodeParams>) => void;
}

/**
 * The created by / updated by / edited by rows of the node filters panel. A component of its
 * own, so the user list loads only once a panel is opened, not for every node in the tree.
 */
export const NodeUserFilterRows: React.FC<NodeUserFilterRows> = ({ params, onChange }) => {
  const userOptions = useUserFilterOptions();

  return (
    <>
      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.CreatedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.User
            width="full"
            options={userOptions.single}
            value={params.createdBy ?? ""}
            isClearable={!!params.createdBy}
            onChange={(createdBy) => onChange({ createdBy })}
          />
        </StyledRowControl>
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.UpdatedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.User
            width="full"
            options={userOptions.single}
            value={params.updatedBy ?? ""}
            isClearable={!!params.updatedBy}
            onChange={(updatedBy) => onChange({ updatedBy })}
          />
        </StyledRowControl>
      </StyledRow>
      <StyledRow>
        <StyledRowHeader>{Explore.SearchOption.EditedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Multi.User
            width="full"
            limitSelectedItems={2}
            placeholder="any"
            options={userOptions.multi}
            value={params.editedBy ?? []}
            onChange={(editedBy) => onChange({ editedBy })}
          />
        </StyledRowControl>
      </StyledRow>
    </>
  );
};
