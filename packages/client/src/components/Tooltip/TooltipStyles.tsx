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
  }
  &-arrow {
    color: ${({ theme }) => theme.colors["black"]};
  }
  [role="tooltip"]&-content {
    box-shadow: rgba(0, 0, 0, 0.16) 0px 0px 3px;
  }

  &-overlay {
    /* background: rgba(0, 0, 0, 0.5); */
  }
  [data-popup="tooltip"]&-overlay {
    /* background: transparent; */
  }
`;
