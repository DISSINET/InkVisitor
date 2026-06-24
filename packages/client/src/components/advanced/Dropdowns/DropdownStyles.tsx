import { ThemeColor } from "Theme/theme";
import styled from "styled-components";

interface StyledEntityValue {
  color?: keyof ThemeColor;
}
export const StyledEntityValue = styled.div<StyledEntityValue>`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 5px;
  border-left-style: solid;
  border-left-width: 4px;
  border-left-color: ${({ theme, color }) => (color ? theme.color[color] : "")};
`;
interface StyledEntityMultiValue {
  $color?: keyof ThemeColor;
}
export const StyledEntityMultiValue = styled.div<StyledEntityMultiValue>`
  padding: 0.2rem 0.2rem 0.2rem;
  padding-left: 0.3rem;
  border-left-style: solid;
  border-left-width: 4px;
  border-left-color: ${({ theme, $color }) => ($color ? theme.color[$color] : "")};
  border-radius: 0px;
  font-size: 1.2rem;
`;

export const StyledOptionRow = styled.div`
  display: flex;
  align-items: center;
  height: 2.5rem;
`;
export const StyledOptionIconWrap = styled.div`
  margin: 0 0.2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.5rem;
`;
export const StyledEntityOptionClass = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.5rem;
`;

export const StyledUserOptionRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 2.5rem;
`;
export const StyledUserOptionIconWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.8rem;
  color: ${({ theme }) => theme.color["info"]};
`;
export const StyledUserOptionLabel = styled.div`
  flex: 1;
  min-width: 0;
  display: block;
  padding-left: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["black"]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledUserMultiValue = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  gap: ${({ theme }) => theme.space[1]};
  padding: 1px 0.2rem;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["black"]};
`;
export const StyledUserMultiValueIcon = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.color["info"]};
`;
export const StyledUserMultiValueLabel = styled.span`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const StyledUserMoreBadge = styled.div`
  flex-basis: 100%;
  padding: 1px 0.3rem;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["primary"]};
`;
