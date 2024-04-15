import { WarningTypeEnums } from "@shared/enums";
import { IEntity, IWarning } from "@shared/types";
import api from "api";
import { EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import { TiWarningOutline } from "react-icons/ti";
import { EntityColors } from "types";
import { getShortLabelByLetterCount } from "utils/utils";
import {
  StyledMessage,
  StyledMessageTValidationContent,
} from "./MessageStyles";
import theme from "Theme/theme";

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

  const [extendedEntities, setExtendedEntities] = useState<
    Record<string, IEntity>
  >(entities ?? {});

  useEffect((): void => {
    const entitiesOut = [];
    const newEntityIds: string[] = [];

    async function getEntities(eids: string[]) {
      const extractedEntities: Record<string, IEntity> = { ...entities };
      for (const eid of eids) {
        const entityRes = await api.entitiesGet(eid);
        if (entityRes?.data && !entities?.[eid]) {
          extractedEntities[eid] = entityRes.data;
        }
      }
      setExtendedEntities(extractedEntities);
    }

    const isInEntities = (eid: string) => {
      return entities && entities[eid] ? true : false;
    };

    warning?.validation?.propType?.forEach((eid) => {
      if (eid && !isInEntities(eid)) {
        newEntityIds.push(eid);
      }
    });

    warning?.validation?.allowedEntities?.forEach((eid) => {
      if (eid && !isInEntities(eid)) {
        newEntityIds.push(eid);
      }
    });

    if (newEntityIds.length > 0) {
      getEntities(newEntityIds);
    }
  }, [warning, entities]);

  const [entity, setEntity] = useState<IEntity | undefined>(undefined);

  useEffect(() => {
    if (warning.position?.entityId && entities) {
      const entity = entities[warning.position.entityId];
      if (entity) {
        setEntity(entity);
      } else {
        setEntity(undefined);
      }
    }
  }, [warning, entities]);

  function renderEntityTags(entityIds: (string | undefined)[]): JSX.Element {
    return (
      <>
        {entityIds.map((eid) => {
          if (eid) {
            const entity = extendedEntities?.[eid];
            if (entity) {
              return (
                <div style={{ marginRight: "2px", display: "inline-flex" }}>
                  <EntityTag key={entity.id} entity={entity} />
                </div>
              );
            }
          }
          return <>{eid}</>;
        })}
      </>
    );
  }
  function renderValidationLabel(warning: IWarning): JSX.Element {
    if (warning.validation?.detail) {
      return (
        <span>
          {" "}
          [<i>{warning.validation?.detail}</i>]
        </span>
      );
    } else {
      return <></>;
    }
  }

  function renderEntityClasses(
    entityClasses: string[] | undefined
  ): JSX.Element {
    if (entityClasses) {
      return (
        <>
          {entityClasses.map((entityClass, index) => {
            const classItem = EntityColors[entityClass];
            const colorName = classItem?.color ?? "transparent";
            const color = theme.color[colorName] as string;

            return (
              <span key={index}>
                <span
                  style={{
                    backgroundColor: color,
                    paddingLeft: "2px",
                    paddingRight: "2px",
                  }}
                >
                  {classItem.entityClass}
                </span>
                {index < entityClasses.length - 1 ? ", " : ""}
              </span>
            );
          })}
        </>
      );
    } else {
      return <></>;
    }
  }

  function getWarningMessage(): JSX.Element {
    const { type, position } = warning;
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

      // T-based validations
      case WarningTypeEnums.TVEP:
        return (
          <StyledMessageTValidationContent>
            {renderEntityTags([warning?.position?.entityId])} should have a
            property {renderValidationLabel(warning)}
          </StyledMessageTValidationContent>
        );
      case WarningTypeEnums.TVEPT:
        return (
          <StyledMessageTValidationContent>
            T-based validations:
            {renderEntityTags([warning?.position?.entityId])} is missing a
            required property with type{" "}
            {renderEntityTags(warning.validation?.propType ?? [])}
            {renderValidationLabel(warning)}
          </StyledMessageTValidationContent>
        );
      case WarningTypeEnums.TVEPV:
        const classAllowed =
          warning.validation?.allowedClasses &&
          warning.validation?.allowedClasses.length > 0;
        return (
          <StyledMessageTValidationContent>
            {renderEntityTags([warning?.position?.entityId])} has a wrong
            property type {renderEntityTags(warning.validation?.propType ?? [])}
            {classAllowed && (
              <>
                - should be of type{" "}
                {renderEntityClasses(warning.validation?.allowedClasses)}
              </>
            )}
            {!classAllowed && (
              <>
                - should be of values{" "}
                {renderEntityTags(warning.validation?.allowedEntities ?? [])}
              </>
            )}
            {renderValidationLabel(warning)}
          </StyledMessageTValidationContent>
        );
      case WarningTypeEnums.TVEC:
        return (
          <StyledMessageTValidationContent>
            {renderEntityTags([warning?.position?.entityId])} should have a
            classification {renderValidationLabel(warning)}
          </StyledMessageTValidationContent>
        );
      case WarningTypeEnums.TVECE:
        return (
          <StyledMessageTValidationContent>
            {renderEntityTags([warning?.position?.entityId])} is not classified
            with valid entity{" "}
            {renderEntityClasses(warning.validation?.allowedClasses)}{" "}
            {renderValidationLabel(warning)}
          </StyledMessageTValidationContent>
        );
      case WarningTypeEnums.TVER:
        return (
          <StyledMessageTValidationContent>
            {renderEntityTags([warning?.position?.entityId])} should have a
            reference {renderValidationLabel(warning)}
          </StyledMessageTValidationContent>
        );
      case WarningTypeEnums.TVERE:
        return (
          <StyledMessageTValidationContent>
            {renderEntityTags([warning?.position?.entityId])} is not referenced
            to a valid entity {renderValidationLabel(warning)}
          </StyledMessageTValidationContent>
        );

      default:
        return <></>;
    }
  }

  return (
    <StyledMessage>
      <div style={{ width: "3rem" }}>
        <TiWarningOutline size={20} style={{ marginRight: "0.5rem" }} />
      </div>
      {getWarningMessage()}
    </StyledMessage>
  );
};
