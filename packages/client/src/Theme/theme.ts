import { EntityEnums } from "@inkvisitor/shared/enums";

const theme = {
  color: {
    inherit: "inherit",
    transparent: "transparent",
    blue: {
      50: "#e6eafa",
      100: "#CCD5F4",
      150: "#B3C0E9",
      200: "#9DADEA",
      300: "#6174C2",
      400: "#324185",
      500: "#091034",
      600: "#060C2C",
      700: "#040825",
      800: "#02051E",
      900: "#010318",
    },
    gray: {
      100: "#f7fafc",
      150: "#f4f7fa",
      200: "#edf2f7",
      300: "#e2e8f0",
      400: "#cbd5e0",
      450: "#b6c2d0",
      500: "#a0aec0",
      600: "#718096",
      700: "#4a5568",
      800: "#2d3748",
      900: "#1a202c",
    },
    invertedBg: {
      plain: "#edf2f7",
      danger: "#FFEEEE",
      info: "#F2EBFE",
      success: "#F6F4FF",
      primary: "#E6F6FF",
      grey: "#fff",
      greyer: "#fff",
      warning: "#FFFBEA",
    },
    black: "#000",
    white: "#fff",
    grey: "#C4C4C4",
    greyer: "#4a5568",
    text: "#383737",
    primary: "#091034",
    primaryRGBA: "rgba(9,16,52,1)",
    primaryRGBA0: "rgba(9,16,52,0)",
    success: "#6174C2",
    warning: "#D8AA37",
    danger: "#99103B",
    info: "#324185",
    plain: "#4a5568", // gray 700
    primaryTransparent: "rgba(9,16,52,0.2)",
    modalBg: "rgba(9,16,52,0.4)",
    backupDownloadOverlay: "rgba(237, 242, 247, 0.8)",

    tagBackground: "#fff",
    tagColor: "#091034",
    tagSelectedBackground: "#091034",
    tagSelectedColor: "#fff",
    tagItalic: "#4a5568",

    /* query explorer colors */
    query1: "#E6F0FF",
    query2: "#6174C2",
    query3: "#324185",
    query4: "#1A2332",
    queryInvalid: "#EF4444",

    iconButtonGroupColor: "#C4C4C4",

    treeNodeRead: "#718096",
    treeNodeWrite: "#2d3748",
    foundByTreeFilter: "#b4c0e8",

    tableOddRow: "#eef0fa",
    tableEvenRow: "#fff",
    tableOpened: "#d8ddf5",
    tableSelection: "#c4caf0",
    tableSelectionHover: "#e4e7f8",
    focusedCheckbox: "rgba(9,16,52,0.1)",
    uploadDocumentBg: "#CCD5F4",

    explorerHeader: "#6174C2",
    headerTextColor: " #fff",
    muni: "#091034", // muni primary color
    staging: "#911111",
    "data-import": "#99004C",
    "data-import-persecutio": "#380099",
    development: "#6174C2",
    sandbox: "#CB6E17",
    medhate: "#006666",

    entityC: "#83BCB6",
    entityE: "#D8B5A5",
    entityG: "#D6A5C9",
    entityL: "#88D27A",
    entityO: "#F29C97",
    entityP: "#F8BE78",
    entityB: "#ffed6f",
    entityR: "#9ECAE9",
    // vyssi kategorie
    entityS: "#ff93ac",
    entityA: "#ed365b",
    entityT: "#2079DF",
    // seda
    entityV: "#BAB0AC",

    warningText: "#99103B",
    warningMessage: "#FFE089",
    warningBorder: "#ffbb00",

    tooltipColor: "#fff",
    tooltipBackground: "#000",
    tooltipNodeBackground: "#324185",
    tooltipBoxShadow: "rgba(0, 0, 0, 0.3)",
    tooltipArrowBoxShadow: "rgba(0, 0, 0, 0.1)",

    statsTooltipTextColor: "#f7fafc",
    statsTooltipBackground: "#f7fafc", // gray 100
    statsTooltipLabelBackground: "#718096", // gray 600
    statsChartCursor: "rgba(9, 16, 52, 0.06)", // gentle primary tint for hovered column

    menuHover: "#CCD5F4",
    pageBg: "#edf2f7",
    menuShadow: "rgba(0, 0, 0, 0.3)",

    closeBtnBackground: "rgba(130, 130, 130, 0.1)",

    elementType: {
      action: "#EB6B6B",
      actant: "#7E9BFF",
      prop: "#91BB93",
      class: "#E28FBB",
      ident: "#EAE3A3",
    },

    ping: {
      "-2": "black",
      "-1": "black",
      "0": "#d73027",
      "1": "#fc8d59",
      "2": "#fee08b",
      "3": "#d9ef8b",
      "4": "#91cf60",
      "5": "#1a9850",
    },

    tagBorderColor: {
      // EntityTag status
      [EntityEnums.Status.Pending]: "#a0aec0", // pending
      [EntityEnums.Status.Approved]: "#000", // approved
      [EntityEnums.Status.Discouraged]: "#BA2525", //discouraged
      [EntityEnums.Status.Warning]: "#D8AA37", //warning
      [EntityEnums.Status.Unfinished]: "#f27a43", //unfinished
      // UserTag ...
    },
  },
  space: {
    "-4": "-1rem",
    "-3": "-0.75rem",
    "-2": "-0.5rem",
    "-1": "-0.25rem",
    px: "1px",
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    18: "4.5rem",
    20: "5rem",
    22: "5.5rem",
    23: "5.75rem",
    24: "6rem",
    28: "7rem",
    30: "7.5rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
  },
  fontSize: {
    xxs: "1rem",
    xs: "1.2rem",
    sm: "1.4rem",
    base: "1.6rem",
    lg: "1.8rem",
    xl: "1.9rem",
    "2xl": "2.4rem",
    "3xl": "3rem",
    "4xl": "3.6rem",
    "5xl": "4.8rem",
    "6xl": "6.4rem",
  },
  fontWeight: {
    hairline: "100",
    // thin: "200",
    light: "300",
    normal: "400",
    medium: "500",
    //semibold: "600",
    bold: "700",
    // extrabold: "800",
    black: "900",
  },
  borderWidth: {
    default: "0.1rem",
    0: "0",
    1: "0.1rem",
    2: "0.2rem",
    4: "0.4rem",
    6: "0.6rem",
    8: "0.8rem",
  },
  borderRadius: {
    none: "0",
    xs: "0.3rem",
    sm: "0.5rem",
    default: "0.8rem",
    md: "1rem",
    lg: "1.5rem",
    full: "9999px",
    input: "0.5rem",
    // for Button component
    "rounded-sm": "0.3rem",
    "rounded-md": "0.5rem",
    "rounded-lg": "0.8rem",
    "rounded-xl": "1rem",
    "rounded-full": "9999px",
  },
  borderStyle: {
    //logical type
    [EntityEnums.LogicalType.Definite]: "solid", //definite
    [EntityEnums.LogicalType.Indefinite]: "dotted", //indefinite
    [EntityEnums.LogicalType.Hypothetical]: "dashed", //hypothetical
    [EntityEnums.LogicalType.Generic]: "none", //generic
  },
  background: {
    stripes: "repeating-linear-gradient( -45deg, #cbd5e0, #cbd5e0, 1px, #fff 1px, #fff 12px)",
  },
  boxShadow: {
    normal: "0px 5px 10px hsla(0,0%,0%,0.15)",
    subtle: "0 1px 3px hsla(0,0%,0%,0.12), 0 1px 2px hsla(0,0%,0%,0.24)",
    high: "0 15px 25px hsla(0,0%,0%,0.15), 0 5px 10px hsla(0,0%,0%,0.05)",
    inset: "0 2px 0px hsl(220, 7%, 83%, 0.5), inset 0 2px 2px hsla(0, 0%, 0%, 0.1)",
  },
};

export type ThemeType = typeof theme;
export type ThemeColor = typeof theme.color;
// keys of ThemeColor whose value is a plain color string, excluding the
// nested groups (gray, blue, invertedBg, ...)
export type FlatThemeColor = {
  [K in keyof ThemeColor]: ThemeColor[K] extends string ? K : never;
}[keyof ThemeColor];
export type ThemeBorderWidth = typeof theme.borderWidth;
export type InvertedBgColor = typeof theme.color.invertedBg;
export type ElementTypeColor = typeof theme.color.elementType;
export type ThemeFontSize = typeof theme.fontSize;
export type PingColor = typeof theme.color.ping;

export default theme;
