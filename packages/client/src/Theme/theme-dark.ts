import { EntityEnums } from "@inkvisitor/shared/enums";
import theme from "./theme";

const darkTheme = {
  ...theme,
  color: {
    ...theme.color,
    blue: {
      50: "#111625",
      100: "#1E2330",
      150: "#2A3245",
      200: "#2D324A",
      300: "#47546F",
      400: "#677B9E",
      500: "#91A5C2",
      600: "#A8B7D4",
      700: "#BBC7E2",
      800: "#D1DAEF",
      900: "#EBF0FA",
    },
    gray: {
      100: "#1a202c",
      150: "#232A38",
      200: "#2d3748",
      300: "#4a5568",
      400: "#718096",
      450: "#8997ab",
      500: "#a0aec0",
      600: "#cbd5e0",
      700: "#e2e8f0",
      800: "#edf2f7",
      900: "#f7fafc",
    },
    tableHeaderBg: "#2d3748",
    invertedBg: {
      plain: "#2d3748",
      danger: "#3D1A1A",
      info: "#1e1d3d",
      success: "#1d1d4a",
      primary: "#0b3a59",
      // primary: "#0a335a",
      grey: "#1a202c",
      greyer: "#2d3748",
      warning: "#4a3c10",
    },
    black: "#fff",
    // between InkVisitor primary color and black
    white: "#060c26",
    grey: "#6b6b6b",
    greyer: "#b5b5b5",
    mutedText: "#a0aec0", // gray 500
    text: "#c7c7c7",
    primary: "#f6f6ff",
    statementHighlight: "rgba(158,170,215,1)", // success accent, matches opened-row bar
    statementHighlight0: "rgba(158,170,215,0)",
    success: "#9eaad7",
    explorerHeader: "#091034",
    warning: "#f0c862",
    danger: "#ee8fa4",
    info: "#cbbdff",
    plain: "#b5b5b5", // inverted gray 300
    primaryTransparent: "rgba(9,16,52,0.2)",
    modalBg: "rgba(9,16,52,0.5)",
    modalBorder: "rgba(35, 42, 56, 0.8)", // gray 150
    backupDownloadOverlay: "rgba(45, 55, 72, 0.8)",

    tagBackground: "#091034",
    tagColor: "#EBF0FA",
    tagSelectedBackground: "#2e3f7a", // tableSelection - tableOpened is too close to the page
    tagSelectedColor: "#EBF0FA",
    tagItalic: "#D1DAEF",

    treeNodeRead: "#718096",
    treeNodeWrite: "#f7fafc",

    /* query explorer colors */
    query1: "#1E2A3A",
    query2: "#6174C2",
    query3: "#324185",
    query4: "#1A2332",
    queryInvalid: "#EF4444",

    tableOddRow: "#141c38",
    tableEvenRow: "#080d22",
    tableOpened: "#1a2650",
    tableSelection: "#2e3f7a",
    tableSelectionHover: "#3a4d8c",
    focusedCheckbox: "rgba(246,246,255,0.1)",
    uploadDocumentBg: "#22315a",

    statsChartCursor: "rgba(246, 246, 255, 0.08)", // gentle primary tint for hovered column

    pageBg: "#283040",
    menuHover: "#222A40",
    closeBtnBackground: "rgba(200, 200, 200, 0.1)",

    staging: "#911111",
    "data-import": "#ff6aaf",
    "data-import-persecutio": "#8c79e0",
    development: "#6174C2",
    // development: "#008080",
    sandbox: "#e59857",
    medhate: "#008080",

    entityC: "#83BCB6",
    entityE: "#D8B5A5",
    entityG: "#D6A5C9",
    entityL: "#88D27A",
    entityO: "#F29C97",
    entityP: "#F8BE78",
    entityB: "#f4dd44",
    entityR: "#9ECAE9",
    // vyssi kategorie
    entityS: "#ff93ac",
    entityA: "#ed365b",
    entityT: "hsl(212, 78%, 50%)",
    // seda
    entityV: "#BAB0AC",

    warningText: "#e84c6e",

    elementType: {
      action: "#EB6B6B",
      actant: "#7E9BFF",
      prop: "#91BB93",
      class: "#E28FBB",
      ident: "#EAE3A3",
    },

    tagBorderColor: {
      // EntityTag status
      [EntityEnums.Status.Pending]: "#5f6c7b", // pending
      [EntityEnums.Status.Approved]: "#ddd", // approved
      [EntityEnums.Status.Discouraged]: "#7F1D1D", // discouraged
      [EntityEnums.Status.Warning]: "#9F7F1D", // warning
      [EntityEnums.Status.Unfinished]: "#a6593a", // unfinished
    },
  },
  background: {
    stripes: "repeating-linear-gradient( -45deg, #4a5568, #4a5568, 1px, #060c26 1px, #060c26 12px)",
  },
  // boxShadow: {
  //   normal: "1px 1px 3px rgba(255, 255, 255, 0.4)",
  //   subtle: "0 1px 3px hsla(0,0%,100%,0.12), 0 1px 2px hsla(0,0%,100%,0.24)",
  //   high: "0 15px 25px hsla(0,0%,100%,0.15), 0 5px 10px hsla(0,0%,100%,0.05)",
  //   inset: "0 2px 0px hsl(40, 7%, 17%, 0.5), inset 0 2px 2px hsla(0, 0%, 100%, 0.1)",
  // },
};

export { darkTheme };
