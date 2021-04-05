import styled from "styled-components";
import Popup from "reactjs-popup";

export const StyledPopup = styled(Popup)`
  &-content {
    background: ${({ theme }) => theme.colors["black"]};
    color: ${({ theme }) => theme.colors["white"]};
    border-radius: ${({ theme }) => theme.borderRadius["sm"]};
    font-size: ${({ theme }) => theme.fontSizes["xxs"]};
    font-weight: ${({ theme }) => theme.fontWeights["bold"]};
    padding: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
    min-width: ${({ theme }) => theme.space[16]};
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &-arrow {
    color: ${({ theme }) => theme.colors["black"]};
  }
  [role="tooltip"]&-content {
  }
  &-overlay {
  }
  [data-popup="tooltip"]&-overlay {
  }
`;
