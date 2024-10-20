import styled from "styled-components";

export const StyledHeadingColumn = styled.div`
  display: grid;
  justify-items: end;
  align-items: center;
  margin-right: 1rem;
`;
export const StyledFlexRow = styled.div`
  display: flex;
  align-items: center;
`;
export const StyledParentRow = styled.div`
  display: flex;
  flex-direction: row;
  margin: 1rem;
`;

export const StyledBlueText = styled.p`
  color: ${({ theme }) => theme.color.success};
  font-weight: bold;
  margin-bottom: 0.2rem;
`;
export const StyledGreyText = styled.p`
  color: ${({ theme }) => theme.color.greyer};
  font-weight: bold;
  margin-bottom: 0.2rem;
`;
export const StyledInto = styled.i`
  margin-bottom: 0.5rem;
`;
export const StyledArrowWrapper = styled.div`
  margin: 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
export const StyledArrowContainer = styled.div`
  position: relative;
  width: 50px;
  height: 16px;
`;
export const StyledArrowShaft = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  width: 80%;
  height: 2px;
  background-color: ${({ theme }) => theme.color.black};
  transform: translateY(-50%);
`;
export const StyledArrowHead = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 10px solid;
  border-right-color: ${({ theme }) => theme.color.black};
`;

export const StyledTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
`;
export const StyledTagWrap = styled.div`
  margin-bottom: 0.3rem;
  margin-right: 0.3rem;
`;

export const StyledNotes = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-top: 2rem;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
