import { ButtonGroup } from "components";
import styled from "styled-components";

// prevents the buttons from being squashed vertically when the filter opens
export const StyledTreeButtonGroup = styled(ButtonGroup)`
  flex-shrink: 0;
`;

export const StyledTreeWrapper = styled.div`
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;
export const StyledNoResults = styled.p`
  font-style: italic;
  font-size: 1.4rem;
  margin: 0.5rem;
  color: ${({ theme }) => theme.color.black};
`;
