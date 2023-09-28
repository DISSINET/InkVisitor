import theme from "./theme";

const darkTheme = {
  ...theme,
  color: {
    ...theme.color,
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
      primary: "#0a335a",
      grey: "#1a202c",
      greyer: "#2d3748",
      warning: "#4a3c10",
    },
    black: "#fff",
    white: "#000",
    whiteTransparent: "rgba(0,0,0,0.3)",
    grey: "#3b3b3b",
    greyer: "#b5b5b5",
    text: "#c7c7c7",
    primary: "#f6f6ff",
    success: "#9eaad7",
    warning: "#e5d088",
    danger: "#ee8fa4",
    info: "#cbbdff",
    plain: "#b5b5b5", // inverted gray 300
    primaryTransparent: "rgba(246,246,255,0.2)",
    modalBg: "rgba(246,246,255,0.3)",

    tableSelection: "#4c82a1",
    tableSelectionHover: "#2c638c",
    focusedCheckbox: "rgba(246,246,255,0.1)",

    staging: "#ffefef",
    "data-import": "#ff6aaf",
    development: "#9eaad7",
    sandbox: "#e59857",

    entityC: "#7c4344",
    entityE: "#27454b",
    entityG: "#294136",
    entityL: "#774c77",
    entityO: "#065769",
    entityP: "#075466",
    entityB: "#000812",
    entityR: "#612c23",
    entityS: "#002545",
    entityA: "#12031a",
    entityT: "hsl(212, 22%, 50%)",
    entityV: "#454545",

    elementType: {
      action: "#145",
      actant: "#589",
      prop: "#6a8",
      class: "#b79",
      ident: "#dac",
    },

    ping: {
      "-1": "white",
      "0": "#22b",
      "1": "#349",
      "2": "#46a",
      "3": "#57b",
      "4": "#68c",
      "5": "#79d",
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