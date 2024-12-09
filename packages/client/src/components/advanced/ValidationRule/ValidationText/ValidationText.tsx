import { entitiesDictKeys } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import {
  EProtocolTieType,
  ITerritoryValidation,
} from "@shared/types/territory";
import React, { useCallback, useMemo } from "react";
import { getEntityLabel } from "utils/utils";
import { StyledSentence, StyledSentenceEntity } from "../ValidationRuleStyles";

interface ValidationText {
  validation: ITerritoryValidation;
  entities: Record<string, IEntity>;
  active: boolean;
}

export const ValidationText: React.FC<ValidationText> = ({
  validation,
  entities,
  active,
}) => {
  const {
    detail,
    entityClasses,
    classifications,
    tieType,
    propType,
    allowedClasses,
    allowedEntities,
  } = validation;

  const valuesEntitiesActive = useMemo<boolean>(() => {
    return allowedEntities !== undefined && allowedEntities.length > 0;
  }, [allowedEntities]);

  const valuesClasssesActive = useMemo<boolean>(() => {
    return (
      !valuesEntitiesActive &&
      allowedClasses !== undefined &&
      allowedClasses.length > 0
    );
  }, [allowedClasses]);

  const renderEntityList = useCallback(
    (entitiesIdList: string[]) => {
      return entitiesIdList.map((entityId, index) => {
        const entity = entities[entityId];
        const last: boolean = index === entitiesIdList.length - 1;
        return (
          <span key={entityId}>
            <StyledSentenceEntity>
              {getEntityLabel(entity)}
            </StyledSentenceEntity>
            {!last && " or "}
          </span>
        );
      });
    },
    [entities]
  );

  const renderEntityClassList = useCallback(
    (classList: EntityEnums.ExtendedClass[]) => {
      if (classList.includes(EntityEnums.Extension.Any)) {
        return <StyledSentenceEntity key={"any"}></StyledSentenceEntity>;
      }
      if (
        classList.includes(EntityEnums.Extension.Empty) ||
        classList.includes(EntityEnums.Extension.NoClass)
      ) {
        return <StyledSentenceEntity key={"any"}>None</StyledSentenceEntity>;
      }

      return classList.map((classId, index) => {
        const classLabel = entitiesDictKeys[classId as EntityEnums.Class].label;

        const last: boolean = index === classList.length - 1;
        return (
          <span key={classId}>
            <StyledSentenceEntity key={index}>
              {classLabel}
            </StyledSentenceEntity>
            {!last && " or "}
          </span>
        );
      });
    },
    [entitiesDictKeys]
  );

  return (
    <StyledSentence $active={active}>
      <>
        {entityClasses && entityClasses.length > 0 ? (
          <>
            {`Any `}
            {renderEntityClassList(entityClasses)}
          </>
        ) : (
          <>{`Any entity`}</>
        )}
      </>

      {classifications.length > 0 && (
        <>
          {` classified as `}
          {renderEntityList(classifications)}
        </>
      )}

      {tieType === EProtocolTieType.Property && (
        <>
          <span> must have a property</span>
          <span>
            {propType && propType.length > 0 && (
              <>
                {` of type `}
                {renderEntityList(propType)}
              </>
            )}
            {valuesClasssesActive && (
              <>
                {` with values of entity type `}
                {renderEntityClassList(allowedClasses ?? [])}
              </>
            )}
            {valuesEntitiesActive && (
              <>
                {` with value `}
                {renderEntityList(allowedEntities ?? [])}
              </>
            )}
          </span>
        </>
      )}
      {tieType === EProtocolTieType.Classification && (
        <>
          <span> must be classified</span>
          <span>
            {valuesEntitiesActive && (
              <>
                {` with property type `}
                {renderEntityList(allowedEntities ?? [])}
              </>
            )}
          </span>
        </>
      )}
      {tieType === EProtocolTieType.Reference && (
        <>
          <span> must have a reference</span>
          <span>
            {valuesEntitiesActive && (
              <>
                {` to Resource `}
                {renderEntityList(allowedEntities ?? [])}
              </>
            )}
          </span>
        </>
      )}
      <>.</>
    </StyledSentence>
  );
};
