import React, { useState } from "react";
import { StatementOrderCorrection } from "types";
import { StyledOrderCorrection } from "../StatementListTableStyles";
import { TbAnchorOff } from "react-icons/tb";
import { FaArrowUpLong, FaArrowDownLong } from "react-icons/fa6";
import { Tooltip } from "components";

interface StatementListOrderCorrection {
  orderCorrection?: StatementOrderCorrection;
  isAnchored?: boolean;
}
export const StatementListOrderCorrection: React.FC<
  StatementListOrderCorrection
> = ({ orderCorrection, isAnchored }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <StyledOrderCorrection
        ref={setReferenceElement}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* no anchor icon */}
        {!isAnchored ? (
          <TbAnchorOff size={15} />
        ) : (
          // order correction helper
          orderCorrection &&
          orderCorrection?.distance > 0 && (
            <>
              {orderCorrection.shouldMoveUp ? (
                <FaArrowUpLong style={{ flexShrink: 0 }} size={14} />
              ) : (
                orderCorrection.shouldMoveDown && (
                  <FaArrowDownLong style={{ flexShrink: 0 }} size={14} />
                )
              )}
              <div style={{ flexShrink: 1 }}>{orderCorrection.distance}</div>
            </>
          )
        )}
      </StyledOrderCorrection>
      <Tooltip
        visible={showTooltip}
        label={
          !isAnchored
            ? "statement is not anchored"
            : `distance and direction to correct the order of the statement`
        }
        referenceElement={referenceElement}
        position="right"
      />
    </>
  );
};
