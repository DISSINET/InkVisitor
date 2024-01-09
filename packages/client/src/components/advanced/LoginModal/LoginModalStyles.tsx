import { FaLock, FaUserAlt } from "react-icons/fa";
import { TbMailFilled } from "react-icons/tb";
import styled from "styled-components";

export const StyledContentWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem 3rem;
`;
export const StyledHeading = styled.h5`
  color: ${({ theme }) => theme.color["primary"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  margin-bottom: 1.5rem;
`;
export const StyledInputRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  /* border-bottom: 1px solid; */
  border-bottom-color: ${({ theme }) => theme.color["gray"][400]};
  margin-bottom: 1rem;
`;
interface StyledIcon {
  isError?: boolean;
}
export const StyledFaUserAlt = styled(FaUserAlt)<StyledIcon>`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme, isError }) =>
    isError ? theme.color["danger"] : theme.color["primary"]};
`;
export const StyledFaLock = styled(FaLock)<StyledIcon>`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme, isError }) =>
    isError ? theme.color["danger"] : theme.color["primary"]};
`;
export const StyledTbMailFilled = styled(TbMailFilled)<StyledIcon>`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme, isError }) =>
    isError ? theme.color["danger"] : theme.color["primary"]};
`;

export const StyledButtonWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;
export const StyledErrorText = styled.p`
  color: ${({ theme }) => theme.color["danger"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
