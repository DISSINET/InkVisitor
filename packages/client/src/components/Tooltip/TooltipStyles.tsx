import styled from "styled-components";
import Popup from "reactjs-popup";
import { Colors } from "types";

interface StyledPopup {
  color: typeof Colors[number];
}
export const StyledPopup = styled(Popup)<StyledPopup>`
  &-content {
    background-color: ${({ theme, color }) => theme.color[color]};

    color: ${({ theme }) => theme.color["white"]};
    border-radius: ${({ theme }) => theme.borderRadius["sm"]};
    font-size: ${({ theme }) => theme.fontSize["xxs"]};
    min-width: ${({ theme }) => theme.space[8]};
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 40rem;
  }
  &-arrow {
    color: ${({ theme, color }) => theme.color[color]};
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
  max-width: 35rem;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  word-wrap: break-word;
`;
export const StyledDetail = styled.p``;
export const StyledIconWrap = styled.span`
  margin-top: 2px;
  margin-right: ${({ theme }) => theme.space[1]};
`;
export const StyledContentWrap = styled.div`
  margin: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
`;
export const StyledItemsWrap = styled.div`
  margin: ${({ theme }) => theme.space[2]};
`;
