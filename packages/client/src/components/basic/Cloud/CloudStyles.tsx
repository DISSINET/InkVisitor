import styled from "styled-components";

export const StyledCloud = styled.div`
  background-color: ${({ theme }) => theme.color["blue"][100]};
  border-radius: 1rem;
  padding: 0.5rem;
  border: 1px dashed black;
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;
export const StyledCloudWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
  align-items: center;
`;
export const StyledButtonWrap = styled.div`
  margin-left: ${({ theme }) => theme.space[2]};
`;
