import { WarningTypeEnums } from "@shared/enums";
import { IEntity, IWarning } from "@shared/types";
import React, { useEffect, useState } from "react";
import { TiWarningOutline } from "react-icons/ti";
import { StyledMessage } from "./MessateStyles";
import { getShortLabelByLetterCount } from "utils/utils";

interface Message {
  warning: IWarning;
  entities?: {
    [key: string]: IEntity;
  };
}
export const Message: React.FC<Message> = ({ warning, entities }) => {
  const positionObject: { [key: string]: string } = {
    s: "Subject",
    a1: "Actant1",
    a2: "Actant2",
    pa: "Pseudo-Actant",
  };

  const [entity, setEntity] = useState<IEntity | false>(false);

  useEffect(() => {
    if (warning.position?.entityId && entities) {
      const entity = entities[warning.position.entityId];
      if (entity) {
        setEntity(entity);
      }
    }
  }, [warning, entities]);

  function getWarningMessage({ type, position }: IWarning): JSX.Element {
    const positionName = position?.subSection
      ? ` - ${positionObject[position.subSection]}`
      : "";

    switch (type) {
      case WarningTypeEnums.SValency:
        return <b>Subject Valency</b>;
      case WarningTypeEnums.A1Valency:
        return <b>Actant1 Valency</b>;
      case WarningTypeEnums.A2Valency:
        return <b>Actant2 Valency</b>;
      case WarningTypeEnums.NoTerritory:
        return <b>No Territory</b>;

      // Statement warnings
      case WarningTypeEnums.NA:
        return <b>No Action defined</b>;
      case WarningTypeEnums.MA:
        return (
          <span>
            <b style={{ whiteSpace: "nowrap" }}>
              Missing{" "}
              {position?.subSection
                ? positionObject[position?.subSection]
                : "actant"}
              :{" "}
            </b>
            {"at least one actant of a matching type should be used"}
          </span>
        );
      case WarningTypeEnums.WA:
        return (
          <span>
            <b>{`Actant's entity type does not match the Action`}</b>
            {positionName}
            {entity &&
              ` - [${entity.class}: ${getShortLabelByLetterCount(
                entity.label,
                200
              )}]`}
          </span>
        );
      case WarningTypeEnums.ANA:
        return (
          <span>
            <b>{`This actant position allows no actant`}</b>
            {positionName}
            {entity &&
              ` - [${entity.class}: ${getShortLabelByLetterCount(
                entity.label,
                200
              )}]`}
          </span>
        );
      case WarningTypeEnums.WAC:
        return (
          <span>
            <b>{`Entity type valencies of the actions not matching`}</b>
            {positionName}
          </span>
        );
      case WarningTypeEnums.AVU:
        return (
          <span>
            <b>{`Action valency not defined`}</b>
            {positionName}
            {entity &&
              ` - [${entity.class}: ${getShortLabelByLetterCount(
                entity.label,
                200
              )}]`}
          </span>
        );

      // postponed - In-statement Props warnings
      case WarningTypeEnums.IELVL:
        return <b>Inconsistent Epistemic levels for the Property</b>;

      // Entity warnings
      case WarningTypeEnums.SCLM:
        return <b>Superclass missing</b>;
      case WarningTypeEnums.ISYNC:
        return <b>Inconsistent superclasses in the synonym cloud</b>;
      case WarningTypeEnums.MVAL:
        return <b>Missing at least one entity-type valency</b>;
      case WarningTypeEnums.AVAL:
        return (
          <span>
            <b>Asymmetrical valency </b>
            {positionName}
          </span>
        );
      case WarningTypeEnums.VETM:
        return (
          <span>
            <b>Entity type not filled in for all valencies</b>
            {positionName}
          </span>
        );
      case WarningTypeEnums.MAEE:
        return <b>Missing Action/event equivalent</b>;
      case WarningTypeEnums.LM:
        return <b>Missing part of speech attribute</b>;
      case WarningTypeEnums.PSM:
        return <b>Missing label language attribute</b>;
      default:
        return <></>;
    }
  }

  return (
    <StyledMessage>
      <div style={{ width: "3rem" }}>
        <TiWarningOutline size={20} style={{ marginRight: "0.5rem" }} />
      </div>
      {getWarningMessage(warning)}
    </StyledMessage>
  );
};
