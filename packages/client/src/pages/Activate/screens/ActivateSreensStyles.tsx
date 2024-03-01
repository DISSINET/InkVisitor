import { FaTag } from "react-icons/fa";
import { TbLockExclamation, TbLockPlus } from "react-icons/tb";
import styled from "styled-components";

export const StyledUserActivatedDescription = styled.p`
  text-align: center;
  margin-bottom: 0.5rem;
`;
interface StyledIcon {
  $isError: boolean;
}
export const StyledTbLockPlus = styled(TbLockPlus)<StyledIcon>`
  margin-right: 0.3rem;
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : "")};
`;
export const StyledTbLockExclamation = styled(TbLockExclamation)<StyledIcon>`
  margin-right: 0.3rem;
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : "")};
`;
export const StyledFaTag = styled(FaTag)<StyledIcon>`
  margin-right: 0.7rem;
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : "")};
`;
