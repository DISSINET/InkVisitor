import { Input } from "components";
import { FaLock, FaUserAlt } from "react-icons/fa";
import styled from "styled-components";

export const StyledContentWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  height: 16rem;
  margin: 1rem 3rem;
`;
export const StyledInputRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid grey;
`;
export const StyledFaUserAlt = styled(FaUserAlt)`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["primary"]};
`;
export const StyledFaLock = styled(FaLock)`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["primary"]};
`;
