import { FaUserAlt } from "react-icons/fa";
import styled from "styled-components";

export const StyledUserBox = styled.div`
  display: flex;
`;
export const StyledUser = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.space[4]};
`;
export const StyledBoxWrap = styled.div`
  display: flex;
`;
export const StyledFaUserAlt = styled(FaUserAlt)`
  margin-left: ${({ theme }) => theme.space[2]};
  margin-right: ${({ theme }) => theme.space[1]};
`;
export const StyledText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledUsername = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
