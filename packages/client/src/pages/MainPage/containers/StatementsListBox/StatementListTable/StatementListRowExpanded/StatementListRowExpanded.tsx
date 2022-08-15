import { actantPositionDict } from "@shared/dictionaries";
import { Position } from "@shared/enums";
import {
  IEntity,
  IProp,
  IReference,
  IStatementActant,
  IStatementAction,
} from "@shared/types";
import { EmptyTag, EntityTag } from "components/advanced";
import React from "react";
import { ColumnInstance, Row } from "react-table";
import { StatementListRowExpandedPropGroup } from "./StatementListRowExpandedPropGroup";
import {
  StyledActantWithPropsWrap,
  StyledActantWrap,
  StyledBsArrowReturnRight,
  StyledExpandedRowTd,
  StyledExpandedRowTr,
  StyledGrid,
  StyledNotesSection,
  StyledNoteWrapper,
  StyledPropRow,
  StyledReferenceColumn,
  StyledReferenceRow,
  StyledReferenceSection,
  StyledSpan,
  StyledSubRow,
} from "./StatementListRowExpandedStyles";

interface StatementListRowExpanded {
  row: Row;
  visibleColumns: ColumnInstance<{}>[];
  entities: { [key: string]: IEntity };
}
export const StatementListRowExpanded: React.FC<StatementListRowExpanded> = ({
  row,
  visibleColumns,
  entities,
}) => {
  const renderReferenceRow = (
    resourceId: string,
    valueId: string,
    key: number
  ) => {
    const resourceEntity: IEntity = entities[resourceId];
    const valueEntity: IEntity = entities[valueId];

    return (
      <StyledReferenceRow key={key}>
        {resourceEntity ? (
          <StyledReferenceColumn marginRight>
            <EntityTag
              entity={resourceEntity}
              tooltipPosition="bottom center"
              fullWidth
            />
          </StyledReferenceColumn>
        ) : (
          <StyledReferenceColumn marginRight>
            <EmptyTag label="resource" />
          </StyledReferenceColumn>
        )}
        {valueEntity ? (
          <StyledReferenceColumn>
            <EntityTag
              entity={valueEntity}
              tooltipPosition="bottom center"
              fullWidth
            />
          </StyledReferenceColumn>
        ) : (
          <StyledReferenceColumn>
            <EmptyTag label="value" />
          </StyledReferenceColumn>
        )}
      </StyledReferenceRow>
    );
  };
  const renderListActant = (actantId: string, key: number) => {
    return (
      <React.Fragment key={key}>
        {actantId && (
          <StyledActantWrap key={key}>
            <EntityTag
              entity={entities[actantId]}
              tooltipPosition="bottom center"
              fullWidth
            />
          </StyledActantWrap>
        )}
      </React.Fragment>
    );
  };

  const renderEmptyActant = (label: string, key: number) => {
    return (
      <StyledActantWrap key={key}>
        <EmptyTag label={label} />
      </StyledActantWrap>
    );
  };

  const renderListActantWithProps = (
    actant: IEntity,
    sActant: IStatementAction | IStatementActant,
    key: number,
    emptyLabel: string
  ) => {
    return (
      <StyledActantWithPropsWrap key={key}>
        {actant?.id
          ? renderListActant(actant.id, key)
          : renderEmptyActant(emptyLabel, key)}
        {renderFirstLevelProps(sActant.props)}
      </StyledActantWithPropsWrap>
    );
  };

  const renderFirstLevelProps = (props: IProp[]) => {
    return (
      <StyledGrid>
        <StatementListRowExpandedPropGroup
          level={1}
          props={props}
          entities={entities}
          renderChildrenPropRow={renderSecondLevelProps}
        />
      </StyledGrid>
    );
  };

  const renderSecondLevelProps = (props: IProp[]) => {
    return (
      <StyledGrid>
        <StatementListRowExpandedPropGroup
          level={2}
          props={props}
          entities={entities}
          renderChildrenPropRow={renderThirdLevelProps}
        />
      </StyledGrid>
    );
  };

  const renderThirdLevelProps = (props: IProp[]) => {
    return (
      <StyledGrid>
        <StatementListRowExpandedPropGroup
          level={3}
          props={props}
          entities={entities}
        />
      </StyledGrid>
    );
  };

  const renderRowSubComponent = React.useCallback(
    ({ row }) => {
      const {
        actions,
        actants,
        text,
        tags: tagIds,
      }: {
        actions: IStatementAction[];
        actants: IStatementActant[];
        text: string;
        tags: string[];
      } = row.original.data;

      const { notes }: { notes: string[] } = row.original;

      // ACTIONS
      const actionObjects = actions.map(
        (sAction: IStatementAction, key: number) => {
          const action = entities[sAction.actionId];
          return { key, data: { sAction, action } };
        }
      );

      // SUBJECTS
      const subjectObjects = actants
        .filter((a: IStatementActant) => a.position === "s")
        .map((sSubject: IStatementActant, key) => {
          const subject = entities[sSubject.entityId];
          return { key, data: { sSubject, subject } };
        });

      // ACTANTS
      const actantObjects = actants
        .filter((a: IStatementActant) => a.position !== "s")
        .map((sActant: IStatementActant, key: number) => {
          const actant = entities[sActant.entityId];
          return {
            key,
            data: {
              sActant,
              actant,
            },
          };
        });

      // REFERENCES
      const references: IReference[] = row.original.references;

      // TAGS
      const tagObjects: IEntity[] = tagIds.map((t) => entities[t]);

      return (
        <>
          <StyledSubRow id={`statement${row.values.id}`}>
            <br />
            <StyledGrid>
              {actionObjects.map((action, key) => (
                <StyledPropRow key={key}>
                  <StyledBsArrowReturnRight size="20" />
                  <StyledSpan>&nbsp;&nbsp;(action)&nbsp;&nbsp;</StyledSpan>
                  {renderListActantWithProps(
                    action.data.action,
                    action.data.sAction,
                    key,
                    "action"
                  )}
                </StyledPropRow>
              ))}
            </StyledGrid>
            <StyledGrid>
              {subjectObjects.map((actant, key) => (
                <StyledPropRow key={key}>
                  <StyledBsArrowReturnRight size="20" />
                  <StyledSpan>&nbsp;&nbsp;(subject)&nbsp;&nbsp;</StyledSpan>
                  {renderListActantWithProps(
                    actant.data.subject,
                    actant.data.sSubject,
                    key,
                    actantPositionDict[Position.Subject].label
                  )}
                </StyledPropRow>
              ))}
            </StyledGrid>
            <StyledGrid>
              {actantObjects.map((actant, key) => (
                <StyledPropRow key={key}>
                  <StyledBsArrowReturnRight size="20" />
                  <StyledSpan>&nbsp;&nbsp;(actant)&nbsp;&nbsp;</StyledSpan>
                  {renderListActantWithProps(
                    actant.data.actant,
                    actant.data.sActant,
                    key,
                    actantPositionDict[actant.data.sActant.position]?.label
                  )}
                </StyledPropRow>
              ))}
            </StyledGrid>
            <StyledReferenceSection>
              {references.map((reference, key) => (
                <StyledGrid key={key}>
                  <StyledPropRow key={key}>
                    <StyledBsArrowReturnRight size="20" />
                    <StyledSpan>&nbsp;&nbsp;(reference)&nbsp;&nbsp;</StyledSpan>
                    {renderReferenceRow(
                      reference.resource,
                      reference.value,
                      key
                    )}
                  </StyledPropRow>
                </StyledGrid>
              ))}
            </StyledReferenceSection>
            <StyledGrid>
              {tagObjects.map((tag, key) => (
                <StyledPropRow key={key} disableBottomMargin>
                  <StyledBsArrowReturnRight size="20" />
                  <StyledSpan>&nbsp;&nbsp;(tag)&nbsp;&nbsp;</StyledSpan>
                  {renderListActant(tag.id, key)}
                </StyledPropRow>
              ))}
            </StyledGrid>
            <StyledNotesSection>
              {notes.map((note: string, key: number) => {
                return (
                  <StyledNoteWrapper key={key}>
                    <StyledSpan>(note)</StyledSpan>
                    <p key={key}>{note}</p>
                  </StyledNoteWrapper>
                );
              })}
            </StyledNotesSection>
          </StyledSubRow>
        </>
      );
    },
    [row]
  );

  return (
    <StyledExpandedRowTr>
      <StyledExpandedRowTd colSpan={visibleColumns.length + 1}>
        {renderRowSubComponent({ row })}
      </StyledExpandedRowTd>
    </StyledExpandedRowTr>
  );
};
