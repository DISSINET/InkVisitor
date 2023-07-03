import { IWarning } from "@shared/types";
import React from "react";
import { StyledMessage } from "./MessateStyles";
import { WarningTypeEnums } from "@shared/enums";

interface Message {
  warning: IWarning;
}
export const Message: React.FC<Message> = ({ warning }) => {
  const positionObject: { [key: string]: string } = {
    s: "Subject",
    a1: "Actant1",
    a2: "Actant2",
    pa: "Pseudo-Actant",
  };

  function getWarningMessage({ type, position }: IWarning): JSX.Element {
    switch (type) {
      case WarningTypeEnums.SValency:
        return <>Subject Valency</>;
      case WarningTypeEnums.A1Valency:
        return <>Actant1 Valency</>;
      case WarningTypeEnums.A2Valency:
        return <>Actant2 Valency</>;
      case WarningTypeEnums.NoTerritory:
        return <>No Territory</>;
      case WarningTypeEnums.NA:
        return <>No Action defined</>;
      case WarningTypeEnums.MA:
        return (
          <>
            <b>
              Missing{" "}
              {position?.section ? positionObject[position?.section] : "actant"}
            </b>
            {": at least one actant of a matching type should be used"}
          </>
        );
      case WarningTypeEnums.WA:
        return <>Actant’s entity type does not match the Action</>;
      case WarningTypeEnums.ANA:
        return <>This actant position allows no actant</>;
      case WarningTypeEnums.WAC:
        return <>Entity type valencies of the actions not matching</>;
      case WarningTypeEnums.AVU:
        return <>Action valency not defined</>;
      case WarningTypeEnums.IELVL:
        return <>Inconsistent Epistemic levels for the Property</>;
      case WarningTypeEnums.SCLM:
        return <>Superclass missing</>;
      case WarningTypeEnums.ISYNC:
        return <>Inconsistent superclasses in the synonym cloud</>;
      case WarningTypeEnums.MVAL:
        return <>Missing at least one entity-type valency</>;
      case WarningTypeEnums.AVAL:
        return <>Asymmetrical valency</>;
      case WarningTypeEnums.MAEE:
        return <>Missing action/event equivalent</>;
      default:
        return <></>;
    }
  }

  return <StyledMessage>{getWarningMessage(warning)}</StyledMessage>;
};
