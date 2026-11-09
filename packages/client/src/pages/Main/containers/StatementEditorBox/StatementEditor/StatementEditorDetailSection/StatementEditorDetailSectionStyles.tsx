import styled from "styled-components";
import { StyledSectionLabel } from "../../StatementEditorBoxStyles";

export const StyledDetailBlock = styled.div`
  margin-top: ${({ theme }) => theme.space[6]};
`;

export const StyledDetailBlockLabel = styled(StyledSectionLabel)`
  margin-bottom: ${({ theme }) => theme.space[3]};
  text-transform: uppercase;
`;

// holds the Loader, which fills its nearest positioned parent
export const StyledRelationsLoading = styled.div`
  position: relative;
  min-height: ${({ theme }) => theme.space[12]};
`;
