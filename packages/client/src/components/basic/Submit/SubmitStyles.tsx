import styled from "styled-components";

export const StyledSubmitContent = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
`;
/* the text is built from entity labels and search terms, so it can be a single
   token longer than the modal — it breaks mid-word instead of widening it */
export const StyledSubmitText = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
`;
