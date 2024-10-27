import { IoClose } from "react-icons/io5";
import styled from "styled-components";

export const StyledAlternativeLabels = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
export const StyledAlternativeLabelWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledGreyBar = styled.div`
  position: absolute;
  width: 0.3rem;
  background-color: ${({ theme }) => theme.color["gray"][300]};
  top: 0;
  bottom: 0;
  left: 0;
`;
export const StyledAlternativeLabel = styled.div`
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  padding: 0.1rem 0.3rem 0.1rem 0.7rem;
  z-index: 1;
`;
export const StyledCloseIcon = styled(IoClose)`
  cursor: pointer;
  color: ${({ theme }) => theme.color["black"]};
  padding-right: 0.2rem;
`;
interface StyledAddLabel {
  $marginTop: boolean;
}
export const StyledAddLabel = styled.div<StyledAddLabel>`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: ${({ $marginTop }) => ($marginTop ? "1.5rem" : "")};
`;
