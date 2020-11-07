import classNames from "classnames";
import React from "react";

interface Footer {
  height?: number;
}
export const Footer: React.FC<Footer> = ({ height }) => {
  const wrapperClasses = classNames("bg-primary");
  return (
    <div className={wrapperClasses} style={{ height: `${height}px` }}>
      Footer
    </div>
  );
};
