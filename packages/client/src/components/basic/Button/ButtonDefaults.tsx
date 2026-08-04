import React, { ReactNode, createContext, useContext, useMemo } from "react";
import { ButtonShape, ButtonSize } from "types";

interface ButtonDefaults {
  size?: ButtonSize;
  shape?: ButtonShape;
  textRegular?: boolean;
}

const ButtonDefaultsContext = createContext<ButtonDefaults>({});

// applies only to buttons with a label; icon-only buttons keep their own size,
// so segmented controls and icon toolbars are unaffected by the surrounding area
export const ButtonDefaultsProvider: React.FC<ButtonDefaults & { children?: ReactNode }> = ({
  size,
  shape,
  textRegular,
  children,
}) => {
  const value = useMemo(() => ({ size, shape, textRegular }), [size, shape, textRegular]);
  return (
    <ButtonDefaultsContext.Provider value={value}>{children}</ButtonDefaultsContext.Provider>
  );
};

export const useButtonDefaults = () => useContext(ButtonDefaultsContext);
