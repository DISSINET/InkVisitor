import styled from "styled-components";
import { EntityColors } from "types";

/** Everything the annotator box holds: the document line, then the annotator. */
export const StyledAnnotatorContent = styled.div`
  width: 100%;
`;

export const StyledWarningsListHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color.blue[400]};
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

export const StyledDocumentContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

export const StyledWarningWrapper = styled.div`
  display: inline-flex;
  flex-shrink: 0;
`;

export const StyledLoadingDocument = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0.25rem 1rem;
  border-radius: 2rem;
  overflow: hidden;
  width: 100%;
`;

export const StyledHighlightTooltipTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.space[2]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;

export const StyledHighlightTooltipRow = styled.span`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const StyledHighlightTooltipDot = styled.span<{ $entityClass: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ theme, $entityClass }) =>
    EntityColors[$entityClass]
      ? (theme.color[EntityColors[$entityClass].color] as string)
      : "transparent"};
  flex-shrink: 0;
`;

export const StyledInfoText = styled.div`
  display: flex;
  font-size: 1.3rem;
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  color: ${({ theme }) => theme.color["info"]};
`;

/**
 * The resource tag holds a fixed width so the title is the only item that
 * shrinks — StyledLabel in the Box header already ellipsises, and the resource
 * identity matters more than the last characters of the title.
 */
export const StyledAnnotatorHeaderResource = styled.div`
  display: flex;
  flex-shrink: 0;
  max-width: 11.5rem;
`;

/** The one item that yields when the header runs out of room. */
export const StyledAnnotatorHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 1;
  min-width: 2rem;
  max-width: 16rem;
  overflow: hidden;
`;

/**
 * StyledHead styles the box label as an uppercase Muni caption. The document
 * title and resource tag are content rather than caption, so they opt back out
 * of everything that cascades from it.
 */
export const StyledAnnotatorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  min-width: 0;
  font-family: "Roboto", sans-serif;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  line-height: normal;
  text-transform: none;
`;

export const StyledHighlightPopover = styled.div`
  z-index: 100;
  padding: ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  background-color: ${({ theme }) => theme.color.white};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
`;

/** Reference anchor for the highlight popover trigger. Button doesn't forward
    refs, so this plain wrapper carries the DOM node floating-ui positions against. */
export const StyledHighlightTrigger = styled.div`
  display: flex;
`;

export const StyledLocateAnchorIcon = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledEmptyStateWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: ${({ theme }) => theme.space[8]};
`;
