import { AsymmetricalAnchor } from "@inkvisitor/annotator/src/lib";
import { Loader } from "components";
import { Button } from "components/basic/Button/Button";
import { EntityTagById } from "components/advanced/EntityTag/EntityTagById";
import React, { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaCrosshairs,
  FaExclamationTriangle,
} from "react-icons/fa";
import { ButtonSize } from "types";
import {
  StyledWarningRow,
  StyledWarningsHeader,
  StyledWarningsHeaderSpacer,
  StyledWarningsList,
  StyledWarningsPanel,
  StyledWarningKind,
} from "./AnnotatorStyles";

interface AnnotatorWarningsPanelProps {
  anchors: AsymmetricalAnchor[];
  onUnlink: (tagName: string, position: number) => void;
  onScrollTo: (tagName: string, position: number) => void;
  isLoading?: boolean;
}

const kindLabel = (type: AsymmetricalAnchor["type"]): string =>
  type === "orphaned-opening" ? "orphaned opening" : "orphaned closing";

/**
 * Persistent panel listing asymmetrical (broken) anchors detected by the
 * annotator. Each row shows the entity by EntityTag and an unlink button that
 * removes the broken anchor (#2601). Renders nothing when there are no issues.
 */
export const AnnotatorWarningsPanel: React.FC<AnnotatorWarningsPanelProps> = ({
  anchors,
  onUnlink,
  onScrollTo,
  isLoading = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (anchors.length === 0) {
    return null;
  }

  return (
    <StyledWarningsPanel>
      <StyledWarningsHeader
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <FaExclamationTriangle size={13} />
        {anchors.length} asymmetrical{" "}
        {anchors.length === 1 ? "anchor" : "anchors"}
        <StyledWarningsHeaderSpacer>
          {isLoading && <Loader size={14} show noBackground />}
          {collapsed ? <FaChevronDown size={12} /> : <FaChevronUp size={12} />}
        </StyledWarningsHeaderSpacer>
      </StyledWarningsHeader>
      {!collapsed && (
        <StyledWarningsList>
          {anchors.map((anchor, index) => (
            <StyledWarningRow
              key={`${anchor.tagName}-${anchor.segmentIndex}-${anchor.position}-${index}`}
            >
              <StyledWarningKind>{kindLabel(anchor.type)}</StyledWarningKind>
              <Button
                icon={<FaCrosshairs />}
                size={ButtonSize.Small}
                color="warning"
                inverted
                tooltipLabel="scroll to anchor in text (RAW mode)"
                onClick={() => onScrollTo(anchor.tagName, anchor.position)}
              />
              <EntityTagById
                entityId={anchor.tagName}
                fullWidth
                disableTooltip={false}
                unlinkButton={{
                  tooltipLabel: "unlink broken anchor",
                  onClick: () => onUnlink(anchor.tagName, anchor.position),
                }}
              />
            </StyledWarningRow>
          ))}
        </StyledWarningsList>
      )}
    </StyledWarningsPanel>
  );
};

export default AnnotatorWarningsPanel;
