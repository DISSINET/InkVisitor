import React, { useMemo } from "react";

import { WarningTypeEnums } from "@inkvisitor/shared/enums";
import { IEntity, IWarning } from "@inkvisitor/shared/types";
import { WarningIcon } from "./WarningIcon";
import { EntityTag } from "components/advanced";
import { useEntitiesQuery } from "hooks/react-query";
import { EntityColors } from "types";
import {
  StyledMessage,
  StyledMessageTValidationContent,
  StyledMessageOrigin,
  StyledWarningIconWrap,
  StyledMessageContent,
  StyledMessageDetailList,
  StyledMessageDetailRow,
} from "./MessageStyles";
import { isWarningTBased } from "utils/utils";
import { wildCardChar } from "Theme/constants";
import { useTheme } from "styled-components";

interface Message {
  warning: IWarning;
  entities?: {
    [key: string]: IEntity;
  };
}
export const Message: React.FC<Message> = ({ warning, entities }) => {
  const theme = useTheme();
  const positionObject: { [key: string]: string } = {
    s: "Subject",
    a1: "Actant1",
    a2: "Actant2",
    pa: "Pseudo-Actant",
  };

  const originId = warning.origin;

  // Warning-referenced ids not already present in the provided entities map.
  const missingEntityIds = useMemo(() => {
    const ids = new Set<string>();
    const addMissing = (eid?: string) => {
      if (eid && !entities?.[eid]) {
        ids.add(eid);
      }
    };
    warning.validation?.propType?.forEach(addMissing);
    warning.validation?.allowedEntities?.forEach(addMissing);
    warning.details?.forEach((detail) => {
      addMissing(detail.entityId);
      detail.relatedEntityIds?.forEach(addMissing);
    });
    return [...ids];
  }, [warning, entities]);

  // Single batched fallback for ids missing from the provided map. The shared
  // cache key lets multiple warnings referencing the same entities dedupe.
  const { data: fetchedEntities } = useEntitiesQuery(
    "message-warning-entities",
    missingEntityIds
  );

  // Provided entities plus any fetched fallbacks.
  const extendedEntities = useMemo(() => {
    const map: Record<string, IEntity> = { ...entities };
    fetchedEntities?.forEach((fetchedEntity) => {
      map[fetchedEntity.id] = fetchedEntity;
    });
    return map;
  }, [entities, fetchedEntities]);

  const originEntity = extendedEntities[originId];
  const entity = warning.position?.entityId
    ? extendedEntities[warning.position.entityId]
    : undefined;

  function renderEntityTags(
    entityIds: (string | undefined)[]
  ): React.ReactNode {
    return (
      <>
        {entityIds
          .filter((eid) => eid !== undefined && extendedEntities?.[eid])
          .map((eid) => {
            const entity = extendedEntities[eid as string];
            return (
              <div
                style={{
                  paddingLeft: "2px",
                  paddingRight: "2px",
                  display: "inline-flex",
                }}
                key={eid}
              >
                <EntityTag key={entity.id} entity={entity} />
              </div>
            );
          })}
      </>
    );
  }
  function renderValidationLabel(warning: IWarning): React.ReactNode {
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
  ): React.ReactNode {
    if (entityClasses) {
      return (
        <>
          {entityClasses.map((entityClass, index) => {
            if (entityClass === wildCardChar) return null;
            const classItem = EntityColors[entityClass];
            const colorName = classItem?.color ?? "transparent";
            const color = theme.color[colorName] as string;

            return (
              <span key={index}>
                <span
                  style={{
                    backgroundColor: color,
                    padding: "1px 2px",
                    color: "white",
                  }}
                >
                  {classItem?.entityClass}
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

  function getWarningMessage(): React.ReactNode {
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
            {" - "}
            {entity && <EntityTag key={entity.id} entity={entity} />}
          </span>
        );
      case WarningTypeEnums.ANA:
        return (
          <span>
            <b>{`This actant position allows no actant`}</b>
            {positionName}
            {" - "}
            {entity && <EntityTag key={entity.id} entity={entity} />}
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
            {" - "}
            {entity && <EntityTag key={entity.id} entity={entity} />}
          </span>
        );

      // postponed - In-statement Props warnings
      case WarningTypeEnums.IELVL:
        return <b>Inconsistent Epistemic levels for the Property</b>;

      // Entity warnings
      case WarningTypeEnums.SCLM:
        return <b>Superclass missing</b>;
      case WarningTypeEnums.ISYNC:
        return (
          <div>
            <b>Inconsistent superclasses in the synonym cloud</b>
            {warning.details && warning.details.length > 0 && (
              <StyledMessageDetailList>
                {warning.details.map((detail) => (
                  <StyledMessageDetailRow key={detail.entityId}>
                    {renderEntityTags([detail.entityId])}
                    <span>is missing SCL to</span>
                    {renderEntityTags(detail.relatedEntityIds ?? [])}
                  </StyledMessageDetailRow>
                ))}
              </StyledMessageDetailList>
            )}
          </div>
        );
      case WarningTypeEnums.ISYNCAEE:
        return <b>Inconsistent action-event equivalents in the synonym cloud</b>;
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
        return <b>Missing label language attribute</b>;

      case WarningTypeEnums.PSM:
        return <b>Missing part of speech attribute</b>;

      case WarningTypeEnums.DM:
        return <b>Missing entity detail</b>;

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
            {renderEntityTags(warning.validation?.allowedEntities ?? [])}
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
            to
            {renderEntityTags(
              warning?.validation?.allowedEntities
                ? warning?.validation?.allowedEntities
                : []
            )}{" "}
            {renderValidationLabel(warning)}
          </StyledMessageTValidationContent>
        );
      default:
        return <></>;
    }
  }

  return (
    <StyledMessage>
      <StyledWarningIconWrap>
        <WarningIcon type={warning.type} />
      </StyledWarningIconWrap>
      <StyledMessageContent>
        {getWarningMessage()}
        {isWarningTBased(warning) && originEntity && (
          <StyledMessageOrigin>
            <b>Source</b>
            <EntityTag entity={originEntity} showOnly="label" />
          </StyledMessageOrigin>
        )}
      </StyledMessageContent>
    </StyledMessage>
  );
};
