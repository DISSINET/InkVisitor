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

export const batchSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  padding: "0.75rem",
  borderRadius: "4px",
  border: `1px solid ${theme.color.grey}`,
};

export const batchAttrRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  alignItems: "center",
};

export const batchFooterStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  justifyContent: "flex-end",
};

export const batchWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

export const batchWarningSectionStyle: React.CSSProperties = {
  ...batchSectionStyle,
  borderColor: theme.color.warning,
  backgroundColor: `${theme.color.warning}11`,
};

export const StyledBatchWarningLabel = styled(StyledBatchSectionLabel)`
  color: ${({ theme }) => theme.color.warning};
`;
