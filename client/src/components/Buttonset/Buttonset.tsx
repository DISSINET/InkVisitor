import React, { ReactElement, MouseEventHandler } from "react";
import classNames from "classnames";

interface ButtonSetProps {
  buttons: ReactElement[];
}

export const ButtonSet: React.FC<ButtonSetProps> = ({ buttons }) => {
  return (
    <div className="component buttonset">
      {buttons.map((button, bi) => {
        return (
          <div
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
