import theme from "./theme";

const darkTheme = {
  ...theme,
  color: {
    ...theme.color,
    blue: {
      50: "#111625",
      100: "#1E2330",
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
      200: "#2d3748",
      300: "#4a5568",
      400: "#718096",
      500: "#a0aec0",
      600: "#cbd5e0",
      700: "#e2e8f0",
      800: "#edf2f7",
      900: "#f7fafc",
    },
    invertedBg: {
      plain: "#2d3748",
      danger: "#661313",
      info: "#1e1d3d",
      success: "#1d1d4a",
      primary: "#0b3a59",
      // primary: "#0a335a",
      grey: "#1a202c",
      greyer: "#2d3748",
      warning: "#4a3c10",
    },
    black: "#fff",
    white: "#000",
    grey: "#3b3b3b",
    greyer: "#b5b5b5",
    text: "#c7c7c7",
    primary: "#f6f6ff",
    success: "#9eaad7",
    warning: "#e5d088",
    danger: "#ee8fa4",
    info: "#cbbdff",
    plain: "#b5b5b5", // inverted gray 300
    primaryTransparent: "rgba(9,16,52,0.2)",
    modalBg: "rgba(9,16,52,0.5)",

    tableSelection: "#4c82a1",
    tableSelectionHover: "#2c638c",
    focusedCheckbox: "rgba(246,246,255,0.1)",

    staging: "#911111",
    "data-import": "#ff6aaf",
    development: "#6174C2",
    sandbox: "#e59857",

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
    entityT: "hsl(212, 78%, 50%)",
    // seda
    entityV: "#BAB0AC",

    elementType: {
      action: "#145",
      actant: "#589",
      prop: "#6a8",
      class: "#b79",
      ident: "#dac",
    },

    0: "#5f6c7b",
    1: "#fff",
    2: "#451919",
    3: "#271918",
    4: "#0d2121",
  },
  background: {
    stripes:
      "repeating-linear-gradient( -45deg, #4a5568, #4a5568, 1px, #000 1px, #000 12px)",
  },
  boxShadow: {
    normal: "1px 1px 3px rgba(255, 255, 255, 0.4)",
    subtle: "0 1px 3px hsla(0,0%,100%,0.12), 0 1px 2px hsla(0,0%,100%,0.24)",
    high: "0 15px 25px hsla(0,0%,100%,0.15), 0 5px 10px hsla(0,0%,100%,0.05)",
    inset:
      "0 2px 0px hsl(40, 7%, 17%, 0.5), inset 0 2px 2px hsla(0, 0%, 100%, 0.1)",
  },
};

export { darkTheme };
