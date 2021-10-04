import styled from "styled-components";
import Popup from "reactjs-popup";

export const StyledPopup = styled(Popup)`
  &-content {
    background: ${({ theme }) => theme.color["black"]};
    color: ${({ theme }) => theme.color["white"]};
    border-radius: ${({ theme }) => theme.borderRadius["sm"]};
    font-size: ${({ theme }) => theme.fontSize["xxs"]};
    padding: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
    min-width: ${({ theme }) => theme.space[8]};
    display: flex;
    justify-content: right;
    align-items: right;
    max-width: 40rem;
  }
  &-arrow {
    color: ${({ theme }) => theme.color["black"]};
  }
  [role="tooltip"]&-content {
  }
  &-overlay {
  }
  [data-popup="tooltip"]&-overlay {
  }
`;

export const StyledRow = styled.div`
  display: flex;
`;
export const StyledLabel = styled.p`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledDetail = styled.p``;
export const StyledIconWrap = styled.span`
  margin-top: 2px;
  margin-right: ${({ theme }) => theme.space[2]};
`;
