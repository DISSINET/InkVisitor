export type ThemeType = typeof theme;

const theme = {
  color: {
    transparent: "transparent",
    blue: {
      50: "#e6eafa",
      100: "#CCD5F4",
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
      200: "#edf2f7",
      300: "#e2e8f0",
      400: "#cbd5e0",
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
    whiteTransparent: "rgba(255,255,255,0.3)",
    grey: "#C4C4C4",
    greyer: "#4a5568",
    text: "#383737",
    primary: "#091034",
    success: "#6174C2",
    warning: "#D8AA37",
    danger: "#99103B",
    info: "#324185",
    plain: "#4a5568", // gray 700
    primaryTransparent: "rgba(9,16,52,0.2)",
    modalBg: "rgba(9,16,52,0.3)",

    staging: "#911111",
    "data-import": "#99004C",
    development: "#6174C2",
    sandbox: "#CB6E17",

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

    // tag status
    0: "#a0aec0", // pending
    1: "#000", //approved
    2: "#BA2525", //discouraged
    3: "#D8AA37", //warning
  },
  space: {
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
    xl: "2rem",
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
    xs: "0.25rem",
    sm: "0.5rem",
    default: "0.75rem",
    md: "1rem",
    lg: "0.5rem",
    full: "9999px",
  },
  borderStyle: {
    //logical type
    1: "solid", //definite
    2: "dotted", //indefinite
    3: "dashed", //hypothetical
    4: "none", //generic
  },
  background: {
    stripes:
      "repeating-linear-gradient( -45deg, #cbd5e0, #cbd5e0, 1px, #fff 1px, #fff 12px)",
  },
  boxShadow: {
    normal: "1px 1px 3px rgba(0, 0, 0, 0.4)",
    subtle: "0 1px 3px hsla(0,0%,0%,0.12), 0 1px 2px hsla(0,0%,0%,0.24)",
    high: "0 15px 25px hsla(0,0%,0%,0.15), 0 5px 10px hsla(0,0%,0%,0.05)",
    inset:
      "0 2px 0px hsl(220, 7%, 83%, 0.5), inset 0 2px 2px hsla(0, 0%, 0%, 0.1)",
  },
};

export default theme;
