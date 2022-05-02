import {
  IEntity,
  IProp,
  IStatementActant,
  IStatementAction,
  IReference,
} from "@shared/types";
import React from "react";
import { ColumnInstance, Row } from "react-table";
import { BsArrowReturnRight } from "react-icons/bs";
import { EntityTag } from "../../../EntityTag/EntityTag";
import { StatementListRowExpandedPropGroup } from "./StatementListRowExpandedPropGroup";
import {
  StyledActantGroup,
  StyledActantWrap,
  StyledBsArrowReturnRight,
  StyledExpandedRowTd,
  StyledExpandedRowTr,
  StyledNoteWrapper,
  StyledReferenceWrap,
  StyledSpan,
  StyledSubRow,
} from "./StatementListRowExpandedStyles";
import { StyledPropRow } from "./StatementListRowExpandedStyles";
import { EmptyTag } from "pages/MainPage/containers";

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
      <React.Fragment key={key}>
        <StyledReferenceWrap key={key}>
          {resourceEntity ? (
            <>
              <EntityTag
                actant={resourceEntity}
                tooltipPosition="bottom center"
                // fullWidth
              />
              <span>&nbsp;</span>
            </>
          ) : (
            <>
              <EmptyTag label="resource" />
              <span>&nbsp;</span>
            </>
          )}
          {valueEntity ? (
            <EntityTag
              actant={valueEntity}
              tooltipPosition="bottom center"
              // fullWidth
            />
          ) : (
            <EmptyTag label="value" />
          )}
        </StyledReferenceWrap>
      </React.Fragment>
    );
  };
  const renderListActant = (actantId: string, key: number) => {
    return (
      <React.Fragment key={key}>
        {actantId && (
          <StyledActantWrap key={key}>
            <EntityTag
              actant={entities[actantId]}
              tooltipPosition="bottom center"
              // fullWidth
            />
          </StyledActantWrap>
        )}
      </React.Fragment>
    );
  };

  const renderListActantWithProps = (
    actant: IEntity,
    sActant: IStatementAction | IStatementActant,
    key: number
  ) => {
    return (
      <StyledActantWrap key={key}>
        {renderListActant(actant?.id, key)}
        {renderFirstLevelProps(sActant.props)}
      </StyledActantWrap>
    );
  };

  const renderFirstLevelProps = (props: IProp[]) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup
          level={1}
          props={props}
          entities={entities}
          renderChildrenPropRow={renderSecondLevelProps}
        />
      </div>
    );
  };

  const renderSecondLevelProps = (props: IProp[]) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup
          level={2}
          props={props}
          entities={entities}
          renderChildrenPropRow={renderThirdLevelProps}
        />
      </div>
    );
  };

  const renderThirdLevelProps = (props: IProp[]) => {
    return (
      <div style={{ display: "grid" }}>
        <StatementListRowExpandedPropGroup
          level={3}
          props={props}
          entities={entities}
        />
      </div>
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
          const action = entities[sAction.action];
          return { key, data: { sAction, action } };
        }
      );

      // SUBJECTS
      const subjectObjects = actants
        .filter((a: IStatementActant) => a.position === "s")
        .map((sSubject: IStatementActant, key) => {
          const subject = entities[sSubject.actant];
          return { key, data: { sSubject, subject } };
        });

      // ACTANTS
      const actantObjects = actants
        .filter((a: IStatementActant) => a.position !== "s")
        .map((sActant: IStatementActant, key: number) => {
          const actant = entities[sActant.actant];
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
            <StyledActantGroup>
              {actionObjects.map((action, key) => (
                <StyledPropRow level={1} key={key}>
                  <StyledBsArrowReturnRight size="20" />
                  <StyledSpan>&nbsp;&nbsp;(action)&nbsp;&nbsp;</StyledSpan>
                  {renderListActantWithProps(
                    action.data.action,
                    action.data.sAction,
                    key
                  )}
                </StyledPropRow>
              ))}
            </StyledActantGroup>
            <StyledActantGroup>
              {subjectObjects.map((actant, key) => (
                <StyledPropRow level={1} key={key}>
                  <StyledBsArrowReturnRight size="20" />
                  <StyledSpan>&nbsp;&nbsp;(subject)&nbsp;&nbsp;</StyledSpan>
                  {renderListActantWithProps(
                    actant.data.subject,
                    actant.data.sSubject,
                    key
                  )}
                </StyledPropRow>
              ))}
            </StyledActantGroup>
            <StyledActantGroup>
              {actantObjects.map((actant, key) => (
                <StyledPropRow level={1} key={key}>
                  <StyledBsArrowReturnRight size="20" />
                  <StyledSpan>&nbsp;&nbsp;(actant)&nbsp;&nbsp;</StyledSpan>
                  {renderListActantWithProps(
                    actant.data.actant,
                    actant.data.sActant,
                    key
                  )}
                </StyledPropRow>
              ))}
            </StyledActantGroup>
            <StyledActantGroup>
              {references.map((reference, key) => (
                <React.Fragment key={key}>
                  <StyledPropRow level={1}>
                    <StyledBsArrowReturnRight size="20" />
                    <StyledSpan>&nbsp;&nbsp;(reference)&nbsp;&nbsp;</StyledSpan>
                    {renderReferenceRow(
                      reference.resource,
                      reference.value,
                      key
                    )}
                  </StyledPropRow>
                </React.Fragment>
              ))}
            </StyledActantGroup>
            <StyledActantGroup>
              {tagObjects.map((tag, key) => (
                <StyledPropRow level={1} key={key}>
                  <StyledBsArrowReturnRight size="20" />
                  <StyledSpan>&nbsp;&nbsp;(tag)&nbsp;&nbsp;</StyledSpan>
                  {renderListActant(tag.id, key)}
                </StyledPropRow>
              ))}
            </StyledActantGroup>
            <br />
            {notes.map((note: string, key: number) => {
              return (
                <StyledNoteWrapper key={key}>
                  <StyledSpan>(note)</StyledSpan>
                  <p key={key}>
                    {note}
                    <br />
                  </p>
                </StyledNoteWrapper>
              );
            })}
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
