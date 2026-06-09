import { AsymmetricalAnchor } from "@inkvisitor/annotator/src/lib";
import { Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { Button } from "components/basic/Button/Button";
import { EntityTagById } from "components/advanced/EntityTag/EntityTagById";
import React from "react";
import { FaCrosshairs, FaExclamationTriangle } from "react-icons/fa";
import { ButtonSize } from "types";
import {
  StyledWarningKind,
  StyledWarningRow,
  StyledWarningsChip,
  StyledWarningsList,
} from "./AnnotatorStyles";

const warningsTitle = (count: number): string =>
  `${count} asymmetrical anchor${count === 1 ? "" : "s"}`;

/**
 * Compact, always-visible trigger: a small warning icon + count. Clicking it
 * opens the warnings modal. Exported so it can be rendered next to the document
 * title (outside the annotator) while the modal stays inside the annotator.
 */
export const WarningsChip: React.FC<{ count: number; onClick: () => void }> = ({
  count,
  onClick,
}) => (
  <StyledWarningsChip type="button" onClick={onClick} title={warningsTitle(count)}>
    <FaExclamationTriangle size={13} />
    {count}
  </StyledWarningsChip>
);

interface AnnotatorWarningsPanelProps {
  anchors: AsymmetricalAnchor[];
  onUnlink: (tagName: string, position: number, segmentIndex: number) => void;
  onScrollTo: (tagName: string, position: number, segmentIndex: number) => void;
  /** Controlled open state of the description modal. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Render the inline chip trigger here too (false when it lives elsewhere). */
  showChip?: boolean;
  isLoading?: boolean;
}

const kindLabel = (type: AsymmetricalAnchor["type"]): string =>
  type === "orphaned-opening" ? "orphaned opening" : "orphaned closing";

/**
 * Surfaces asymmetrical (broken) anchors detected by the annotator (#2601).
 * The full description (entity by EntityTag + unlink + scroll-to) opens in a
 * modal; the always-visible footprint is just the WarningsChip. Renders nothing
 * when there are no issues.
 */
export const AnnotatorWarningsPanel: React.FC<AnnotatorWarningsPanelProps> = ({
  anchors,
  onUnlink,
  onScrollTo,
  open,
  onOpenChange,
  showChip = true,
  isLoading = false,
}) => {
  if (anchors.length === 0) {
    return null;
  }

  return (
    <>
      {showChip && <WarningsChip count={anchors.length} onClick={() => onOpenChange(true)} />}

      <Modal showModal={open} onClose={() => onOpenChange(false)} width="normal">
        <ModalHeader
          title={warningsTitle(anchors.length)}
          icon={<FaExclamationTriangle />}
          onClose={() => onOpenChange(false)}
        />
        <ModalContent column enableScroll isLoading={isLoading}>
          <StyledWarningsList>
            {anchors.map((anchor, index) => (
              <StyledWarningRow
                key={`${anchor.tagName}-${anchor.segmentIndex}-${anchor.position}-${index}`}
              >
                <StyledWarningKind>{kindLabel(anchor.type)}</StyledWarningKind>
                <Button
                  icon={<FaCrosshairs />}
                  size={ButtonSize.Small}
                  color="success"
                  inverted
                  tooltipLabel="scroll to anchor in text (RAW mode)"
                  onClick={() => {
                    onScrollTo(anchor.tagName, anchor.position, anchor.segmentIndex);
                    // Close so the (now RAW-mode, scrolled) text is visible.
                    onOpenChange(false);
                  }}
                />
                <EntityTagById
                  entityId={anchor.tagName}
                  disableToast
                  fullWidth
                  disableTooltip={false}
                  unlinkButton={{
                    tooltipLabel: "unlink broken anchor",
                    onClick: () => onUnlink(anchor.tagName, anchor.position, anchor.segmentIndex),
                  }}
                />
              </StyledWarningRow>
            ))}
          </StyledWarningsList>
        </ModalContent>
        <ModalFooter>
          <Button label="close" color="primary" inverted onClick={() => onOpenChange(false)} />
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AnnotatorWarningsPanel;
