import styled from "styled-components";
import theme from "Theme/theme";

export const StyledBatchSectionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color.black};
`;

export const StyledBatchMessage = styled.label`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color.mutedText};
  font-style: italic;
`;

export const StyledBatchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid ${theme.color.grey};
`;

export const StyledBatchAttrRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
`;

export const StyledBatchWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

export const StyledBatchWarningSection = styled(StyledBatchSection)`
  border-color: ${theme.color.warning};
  background-color: ${theme.color.warning}11;
`;

export const StyledBatchWarningLabel = styled(StyledBatchSectionLabel)`
  color: ${({ theme }) => theme.color.warning};
`;

export const StyledBatchBodyText = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const StyledBatchSuccessText = styled(StyledBatchBodyText)`
  color: ${({ theme }) => theme.color.success};
`;

export const StyledBatchDangerText = styled(StyledBatchBodyText)`
  color: ${({ theme }) => theme.color.danger};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const StyledSelectAll = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.3rem 0;
  border-bottom: 1px solid ${theme.color.grey};
`;

export const StyledSelectAllLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const StyledSelectColumn = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.3rem 0;
`;

export const StyledSelectColumnLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const StyledBatchField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

/** label of a single control inside a section, quieter than the section's own
 * label so the section title stays the only bold line */
export const StyledBatchFieldLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color.mutedText};
`;

/** the arrow between a "change from" and a "change to" control; it sits in a
 * field of its own so the empty label above keeps it level with the controls */
export const StyledBatchArrow = styled.span`
  display: flex;
  align-items: center;
  flex: 1;
  font-size: ${({ theme }) => theme.fontSize.lg};
  color: ${({ theme }) => theme.color.mutedText};
`;
