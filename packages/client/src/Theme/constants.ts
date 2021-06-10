import theme from "./theme";

export const rootTerritoryId = "T0";

// layout
export const heightHeader = 70;
export const heightFooter = 30;

export const layoutWidthBreakpoint = 1920;
export const collapsedPanelWidth = 32;
// INIT WIDTHS
// px pixels
export const widthBoundaries = [200, 770, 1570, 1920];
export const firstPanelWidth = widthBoundaries[0];
export const secondPanelWidth = widthBoundaries[1] - widthBoundaries[0];
export const thirdPanelWidth = widthBoundaries[2] - widthBoundaries[1];
export const fourthPanelWidth = widthBoundaries[3] - widthBoundaries[2];

// % percent
export const widthElasticBoundaries = [10, 30, 42, 18];
export const firstPanelElasticWidth = widthElasticBoundaries[0];
export const secondPanelElasticWidth =
  widthElasticBoundaries[1] - widthElasticBoundaries[0];
export const thirdPanelElasticWidth =
  widthElasticBoundaries[2] - widthElasticBoundaries[1];
export const fourthPanelElasticWidth =
  widthElasticBoundaries[3] - widthElasticBoundaries[2];

// animations
export const springConfig: { [key: string]: {} } = {
  panelExpand: { tension: 195, friction: 31 },
};

export const space1 = theme.space[1];
export const space2 = theme.space[2];
export const space3 = theme.space[3];
export const space4 = theme.space[4];
export const space5 = theme.space[5];
export const space6 = theme.space[6];
export const space7 = theme.space[7];
export const space8 = theme.space[8];
export const space9 = theme.space[9];
export const space10 = theme.space[10];
export const space12 = theme.space[12];
export const space16 = theme.space[16];
export const space20 = theme.space[20];
export const space22 = theme.space[22];
export const space23 = theme.space[23];
export const space24 = theme.space[24];
export const space28 = theme.space[28];
export const space32 = theme.space[32];
export const space36 = theme.space[36];
export const space40 = theme.space[40];
export const space48 = theme.space[48];
export const space56 = theme.space[56];
export const space64 = theme.space[64];
