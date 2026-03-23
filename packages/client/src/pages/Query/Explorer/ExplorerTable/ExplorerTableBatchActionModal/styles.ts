import React from "react";
import styled from "styled-components";
import theme from "Theme/theme";

export const StyledBatchSectionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color.black};
`;

export const StyledBatchMessage = styled.label`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color.greyer};
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

export const StyledBatchFooter = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
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
