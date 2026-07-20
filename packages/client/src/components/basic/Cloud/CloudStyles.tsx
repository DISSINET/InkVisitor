import styled from "styled-components";

export const StyledCloud = styled.div<{ $hasTopRight?: boolean }>`
  position: relative;
  background-color: ${({ theme }) => theme.color["blue"][100]};
  border-radius: 1rem;
  padding: 0.5rem;
  padding-right: ${({ $hasTopRight, theme }) => ($hasTopRight ? theme.space[9] : "0.5rem")};
  border: 1px dashed black;
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;
export const StyledCloudTopRight = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.space[1]};
  right: ${({ theme }) => theme.space[1]};
  z-index: 1;
`;
export const StyledCloudWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
  align-items: center;
  padding-bottom: ${({ theme }) => theme.space[1]};
`;
export const StyledButtonWrap = styled.div`
  margin-left: ${({ theme }) => theme.space[2]};
`;
