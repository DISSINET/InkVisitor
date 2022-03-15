import {
  IEntity,
  IProp,
  IStatementActant,
  IStatementAction,
  IStatementReference,
} from "@shared/types";
import React from "react";
import { ColumnInstance, Row } from "react-table";
import { BsArrowReturnRight } from "react-icons/bs";
import { EntityTag } from "../../../EntityTag/EntityTag";
import { StatementListRowExpandedPropGroup } from "./StatementListRowExpandedPropGroup";
import {
  StyledActantGroup,
  StyledActantWrap,
  StyledSubRow,
} from "./StatementListRowExpandedStyles";
import { StyledPropRow } from "./StatementListRowExpandedStyles";

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
  const renderListActant = (sActantId: string, key: number) => {
    return (
      <React.Fragment key={key}>
        {sActantId && (
          <StyledActantWrap key={key}>
            <EntityTag
              actant={entities[sActantId]}
              tooltipPosition="bottom center"
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
        {renderListActant(actant.id, key)}
        {renderFirstLevelProps(sActant.props)}
      </StyledActantWrap>
    );
  };

  const renderFirstLevelProps = (props: IProp[]) => {
    return (
      <StatementListRowExpandedPropGroup
        level={1}
        props={props}
        entities={entities}
        renderChildrenPropRow={renderSecondLevelProps}
      />
    );
  };

  const renderSecondLevelProps = (props: IProp[]) => {
    return (
      <StatementListRowExpandedPropGroup
        level={2}
        props={props}
        entities={entities}
        renderChildrenPropRow={renderThirdLevelProps}
      />
    );
  };

  const renderThirdLevelProps = (props: IProp[]) => {
    return (
      <StatementListRowExpandedPropGroup
        level={3}
        props={props}
        entities={entities}
      />
    );
  };

  const renderRowSubComponent = React.useCallback(({ row }) => {
    const {
      actions,
      actants,
      text,
      references,
      tags: tagIds,
    }: {
      actions: IStatementAction[];
      actants: IStatementActant[];
      text: string;
      references: IStatementReference[];
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
    const referenceObjects: IEntity[] = references.map(
      (r: any) => entities[r.resource]
    );

    // TAGS
    const tagObjects: IEntity[] = tagIds.map((t) => entities[t]);

    return (
      <>
        <StyledSubRow id={`statement${row.values.id}`}>
          <br />
          <StyledActantGroup>
            {actionObjects.map((action, key) => (
              <StyledPropRow level={1}>
                <BsArrowReturnRight size="20" />
                <span>&nbsp;&nbsp;(action)&nbsp;&nbsp;</span>
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
              <StyledPropRow level={1}>
                <BsArrowReturnRight size="20" />
                <span>&nbsp;&nbsp;(subject)&nbsp;&nbsp;</span>
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
              <StyledPropRow level={1}>
                <BsArrowReturnRight size="20" />
                <span>&nbsp;&nbsp;(actant)&nbsp;&nbsp;</span>
                {renderListActantWithProps(
                  actant.data.actant,
                  actant.data.sActant,
                  key
                )}
              </StyledPropRow>
            ))}
          </StyledActantGroup>
          {referenceObjects.map((reference, key) => (
            <StyledPropRow level={1}>
              <BsArrowReturnRight size="20" />
              <span>&nbsp;&nbsp;(reference)&nbsp;&nbsp;</span>
              {renderListActant(reference.id, key)}
            </StyledPropRow>
          ))}
          {tagObjects.map((tag, key) => (
            <StyledPropRow level={1}>
              <BsArrowReturnRight size="20" />
              <span>&nbsp;&nbsp;(tag)&nbsp;&nbsp;</span>
              {renderListActant(tag.id, key)}
            </StyledPropRow>
          ))}
          <br />
          {notes.map((note: string, key: number) => {
            return (
              <>
                <span>(note)</span>
                <p key={key}>
                  {note}
                  <br />
                </p>
              </>
            );
          })}
        </StyledSubRow>
      </>
    );
  }, []);

  return (
    <tr>
      <td colSpan={visibleColumns.length + 1}>
        {renderRowSubComponent({ row })}
      </td>
    </tr>
  );
};
