import { AiOutlineWarning } from "react-icons/ai";
import styled from "styled-components";

// carries the drop ref, so the icon column counts as part of the target - a
// pointer crossing onto the icon would otherwise leave the target, hide the
// icon, and land back on the target, flickering for as long as it hovers there
export const StyledDropzoneWrap = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
`;
interface StyledDropzone {
  $isOver: boolean;
}
export const StyledDropzone = styled.div<StyledDropzone>`
  display: inline-flex;
  overflow: hidden;
  opacity: ${({ $isOver }) => ($isOver ? 0.5 : 1)};
`;
export const StyledIconWrap = styled.div`
  display: flex;
  flex-shrink: 0;
`;
export const StyledAiOutlineWarning = styled(AiOutlineWarning)`
  margin-top: 0.1rem;
  margin-left: 0.5rem;
`;
