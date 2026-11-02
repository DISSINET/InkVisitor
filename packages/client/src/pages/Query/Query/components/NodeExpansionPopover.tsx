import { IResponseEntityExpansion } from "@inkvisitor/shared/types";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";

import { buildExpansionSection, ExpansionGroup } from "../nodeExpansion";
import { NodePopover } from "./NodePopover";
import {
  StyledExpansionPopoverHeader,
  StyledExpansionPopoverMessage,
  StyledExpansionSectionHeading,
  StyledExpansionSectionTags,
} from "./QueryStyles";

interface NodeExpansionPopover {
  referenceElement: HTMLElement | null;
  /** the one group this popover shows; each badge opens its own */
  group: ExpansionGroup;
  data: IResponseEntityExpansion | undefined;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onOpenEntityInDetail?: (entityId: string) => void;
}

export const NodeExpansionPopover: React.FC<NodeExpansionPopover> = ({
  referenceElement,
  group,
  data,
  isLoading,
  isError,
  onClose,
  onOpenEntityInDetail,
}) => {
  const section = useMemo(() => buildExpansionSection(data, group), [data, group]);

  return (
    <NodePopover referenceElement={referenceElement} onClose={onClose}>
      <StyledExpansionPopoverHeader />
      {isLoading && (
        <StyledExpansionPopoverMessage>loading…</StyledExpansionPopoverMessage>
      )}
      {isError && (
        <StyledExpansionPopoverMessage>
          could not load the expansion
        </StyledExpansionPopoverMessage>
      )}
      {!isLoading && !isError && section && (
        <div>
          <StyledExpansionSectionHeading $variant={section.variant}>
            {section.heading}
          </StyledExpansionSectionHeading>
          <StyledExpansionSectionTags>
            {section.entities.map((entity) => (
              <EntityTag
                key={entity.id}
                entity={entity}
                tagMaxWidth={160}
                disableDrag
                isEquivalent={section.variant === "equivalent"}
                isSubordinate={section.variant === "subordinate"}
                onDoubleClick={() => onOpenEntityInDetail?.(entity.id)}
              />
            ))}
          </StyledExpansionSectionTags>
        </div>
      )}
      {!isLoading && !isError && !section && (
        <StyledExpansionPopoverMessage>
          nothing added by this toggle
        </StyledExpansionPopoverMessage>
      )}
    </NodePopover>
  );
};
