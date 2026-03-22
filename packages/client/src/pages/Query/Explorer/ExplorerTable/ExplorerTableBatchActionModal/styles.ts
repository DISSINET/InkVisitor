import React from "react";
import theme from "Theme/theme";

export const batchSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  padding: "0.75rem",
  borderRadius: "4px",
  border: `1px solid ${theme.color.grey}`,
};

export const batchSectionLabelStyle: React.CSSProperties = {
  fontSize: theme.fontSize.xs,
  fontWeight: theme.fontWeight.bold,
  color: theme.color.black,
};

export const batchAttrRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
  alignItems: "center",
};

export const batchMessageStyle: React.CSSProperties = {
  fontSize: theme.fontSize.sm,
  color: theme.color.greyer,
  fontStyle: "italic",
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

export const batchWarningLabelStyle: React.CSSProperties = {
  ...batchSectionLabelStyle,
  color: theme.color.warning,
};
