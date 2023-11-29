import { MIN_SEARCH_RESULT_HEIGHT } from "Theme/constants";
import { Button } from "components";
import { StyledInput } from "components/basic/Input/InputStyles";
import styled from "styled-components";

export const StyledBoxContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.color["white"]};
  overflow: auto;
`;

export const StyledOptions = styled.div`
  margin-right: ${({ theme }) => theme.space[4]};
`;
export const StyledRow = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: ${({ theme }) => theme.space["32"]} auto;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledAdvancedOptions = styled.div`
  display: flex;
  align-items: center;
  height: 3.3rem;
  margin-bottom: 0.5rem;
  margin-left: 0.7rem;
`;
export const StyledRowHeader = styled.div`
  display: block;
  margin-right: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  text-align: right;
`;
export const StyledRowContent = styled.div`
  display: flex;
`;
export const StyledResultsWrapper = styled.div`
  display: inline-flex;
  flex-direction: column;
  min-height: ${MIN_SEARCH_RESULT_HEIGHT}px;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  //overflow-y: hidden;
  position: relative;
`;
export const StyledResultsHeader = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledResultHeading = styled.h6`
  width: 100%;
`;
export const StyledResultItem = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledTagLoaderWrap = styled.div`
  min-height: 3rem;
`;

export const StyledDatePicker = styled(StyledInput)``;

export const StyledDateTag = styled.div`
  background-color: ${({ theme }) => theme.color["gray"][600]};
  padding: ${({ theme }) => theme.space[2] + " " + theme.space[4]};
  border-radius: ${({ theme }) => theme.space[2]};
  width: 150px;
  display: grid;
  grid-template-columns: ${({ theme }) => "auto " + theme.space["6"]};
`;

export const StyledDateTagText = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["white"]};
  margin-right: ${({ theme }) => theme.space[4]};
  align-self: center;
`;

export const StyledDateTagButton = styled(Button)``;

export const StyledAdvancedOptionsSign = styled.div`
  width: 100%;
  height: 50%;
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  white-space: nowrap;
  column-gap: 0.2rem;
  padding-right: 0.2rem;
  padding-left: 0.3rem;
  padding-bottom: 0.1rem;
  border-bottom: 1px solid ${({ theme }) => theme.color.primary};
  color: ${({ theme }) => theme.color.primary};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
`;
