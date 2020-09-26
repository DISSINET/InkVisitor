import React, { ReactElement, MouseEventHandler } from "react";
import classNames from "classnames";

interface ButtonSetProps {
  buttons: ReactElement[];
}

export const ButtonSet: React.FC<ButtonSetProps> = ({ buttons }) => {
  return (
    <div className="component buttonset w-40">
      {buttons.map((button, bi) => {
        return (
          <div
            key={bi}
            className={classNames("inline", {
              "mr-1": bi !== buttons.length,
            })}
          >
            {button}
          </div>
        );
      })}
    </div>
  );
};

ButtonSet.defaultProps = {
  buttons: [],
};
