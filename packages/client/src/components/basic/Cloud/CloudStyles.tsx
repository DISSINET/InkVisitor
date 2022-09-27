import styled from "styled-components";

export const StyledCloud = styled.div`
  background-color: ${({ theme }) => theme.color["blue"][100]};
  border-radius: 1rem;
  padding: 0.5rem;
  border: 1px dashed black;
`;
export const StyledCloudWrap = styled.div`
  display: flex;
  align-items: center;
`;
export const StyledButtonWrap = styled.div`
  margin-left: ${({ theme }) => theme.space[2]};
`;
