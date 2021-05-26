import styled from "styled-components";
import Popup from "reactjs-popup";

export const StyledPopup = styled(Popup)`
  &-content {
    background: ${({ theme }) => theme.color["black"]};
    color: ${({ theme }) => theme.color["white"]};
    border-radius: ${({ theme }) => theme.borderRadius["sm"]};
    font-size: ${({ theme }) => theme.fontSize["xxs"]};
    font-weight: ${({ theme }) => theme.fontWeight["bold"]};
    padding: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
    min-width: ${({ theme }) => theme.space[16]};
    display: flex;
    justify-content: right;
    align-items: right;
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
