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
  gap: 0.3rem;
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme }) => theme.color["white"]};
  padding: 0.1rem 0.2rem 0.1rem 0.7rem;
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
`;
export const StyledCloseIcon = styled(IoClose)`
  cursor: pointer;
  color: ${({ theme }) => theme.color["black"]};
`;
interface StyledAddLabel {
  marginTop: boolean;
}
export const StyledAddLabel = styled.div<StyledAddLabel>`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: ${({ marginTop }) => (marginTop ? "1.5rem" : "")};
`;
