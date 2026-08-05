import { FaUser } from "react-icons/fa";
import { TbLockExclamation, TbLockPlus } from "react-icons/tb";
import styled from "styled-components";

export const StyledUserActivatedDescription = styled.p`
  text-align: center;
  margin-bottom: 1rem;
`;
interface StyledIcon {
  $isError: boolean;
}
export const StyledTbLockPlus = styled(TbLockPlus)<StyledIcon>`
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : "")};
`;
export const StyledTbLockExclamation = styled(TbLockExclamation)<StyledIcon>`
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : "")};
`;
export const StyledFaUser = styled(FaUser)<StyledIcon>`
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : "")};
`;
