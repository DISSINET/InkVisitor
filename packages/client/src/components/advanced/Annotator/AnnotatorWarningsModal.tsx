import { AsymmetricalAnchor } from "@inkvisitor/annotator/src/lib";
import { IResponseEntity } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { ButtonGroup, Loader, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { Button } from "components/basic/Button/Button";
import { EntityTagById } from "components/advanced/EntityTag/EntityTagById";
import React, { useMemo } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { FaScissors } from "react-icons/fa6";
import { TbAnchor } from "react-icons/tb";
import { ButtonSize } from "types";
import {
  StyledWarningInfo,
  StyledWarningKind,
  StyledWarningRow,
  StyledWarningsList,
  StyledWarningsListHeader,
} from "./AnnotatorStyles";

const warningsTitle = (count: number): string =>
  `${count} asymmetrical anchor${count === 1 ? "" : "s"}`;

const issuesFoundLabel = (count: number): string =>
  `${count} issue${count === 1 ? "" : "s"} found in the document`;

/**
 * Compact, always-visible trigger: a small warning icon + count. Clicking it
 * opens the warnings modal. Exported so it can be rendered next to the document
 * title (outside the annotator) while the modal stays inside the annotator.
 */
export const WarningsChip: React.FC<{ count: number; onClick: () => void }> = ({
  count,
  onClick,
}) => (
  <Button
    icon={<FaExclamationTriangle size={13} />}
    label={String(count)}
    textColor="warningText"
    color="warningMessage"
    borderColor="warningBorder"
    shape="rounded-lg"
    tooltipLabel={warningsTitle(count)}
    onClick={onClick}
  />
);

interface AnnotatorWarningsModalProps {
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
  type === "orphaned-opening" ? "orphaned opening < >" : "orphaned closing < / >";

/**
 * Surfaces asymmetrical (broken) anchors detected by the annotator (#2601).
 * The full description (entity by EntityTag + unlink + scroll-to) opens in a
 * modal; the always-visible footprint is just the WarningsChip. Renders nothing
 * when there are no issues.
 */
export const AnnotatorWarningsModal: React.FC<AnnotatorWarningsModalProps> = ({
  anchors,
  onUnlink,
  onScrollTo,
  open,
  onOpenChange,
  showChip = true,
  isLoading = false,
}) => {
  const anchorIds = useMemo(
    () => [...new Set(anchors.map((a) => a.tagName))],
    [anchors]
  );

  // Batch-fetch all anchor entities in a single request instead of letting each
  // EntityTagById fetch on its own. Only runs while the modal is open.
  const { data: anchorEntities, isFetching: isFetchingEntities } = useQuery({
    queryKey: ["warning-anchor-entities", anchorIds],
    queryFn: async () => {
      const res = await api.entitiesGet(anchorIds);
      return res.data ?? [];
    },
    enabled: open && anchorIds.length > 0 && api.isLoggedIn(),
  });

  const entityMap = useMemo(() => {
    const map: Record<string, IResponseEntity> = {};
    (anchorEntities ?? []).forEach((entity) => {
      map[entity.id] = entity;
    });
    return map;
  }, [anchorEntities]);

  if (anchors.length === 0) {
    return null;
  }

  return (
    <>
      {showChip && <WarningsChip count={anchors.length} onClick={() => onOpenChange(true)} />}

      <Modal width="auto" showModal={open} onClose={() => onOpenChange(false)}>
        <ModalHeader
          title={"Asymmetrical anchors"}
          icon={<FaExclamationTriangle />}
          iconColor="warning"
          onClose={() => onOpenChange(false)}
        />
        <ModalContent column enableScroll isLoading={isLoading}>
          <StyledWarningsListHeader>{issuesFoundLabel(anchors.length)}</StyledWarningsListHeader>
          <StyledWarningsList>
            {anchors.map((anchor, index) => (
              <StyledWarningRow
                key={`${anchor.tagName}-${anchor.segmentIndex}-${anchor.position}-${index}`}
              >
                <Button
                  icon={<TbAnchor />}
                  size={ButtonSize.Large}
                  color="success"
                  inverted
                  noBorder
                  radiusLeft
                  radiusRight
                  tooltipLabel="scroll to anchor in text (RAW mode)"
                  onClick={() => {
                    onScrollTo(anchor.tagName, anchor.position, anchor.segmentIndex);
                    // Close so the (now RAW-mode, scrolled) text is visible.
                    onOpenChange(false);
                  }}
                />
                <StyledWarningInfo>
                  <StyledWarningKind>{kindLabel(anchor.type)}</StyledWarningKind>
                  {isFetchingEntities && !entityMap[anchor.tagName] ? (
                    <Loader size={12} show noBackground />
                  ) : (
                    <EntityTagById
                      entityId={anchor.tagName}
                      entity={entityMap[anchor.tagName]}
                      disableToast
                      fullWidth
                      disableTooltip={false}
                      disableDoubleClick={false}
                    />
                  )}
                </StyledWarningInfo>
                <ButtonGroup>
                  <Button
                    icon={<FaScissors />}
                    label="remove"
                    color="success"
                    tooltipLabel="unlink broken anchor"
                    onClick={() => onUnlink(anchor.tagName, anchor.position, anchor.segmentIndex)}
                  />
                </ButtonGroup>
              </StyledWarningRow>
            ))}
          </StyledWarningsList>
        </ModalContent>
        <ModalFooter note="Anchors must have matching opening and closing tags">
          <Button label="close" color="primary" inverted onClick={() => onOpenChange(false)} />
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AnnotatorWarningsModal;
