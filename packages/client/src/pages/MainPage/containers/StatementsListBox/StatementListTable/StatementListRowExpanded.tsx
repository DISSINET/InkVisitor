import {
  IEntity,
  IProp,
  IStatementActant,
  IStatementAction,
  IStatementReference,
} from "@shared/types";
import { useSearchParams } from "hooks";
import React from "react";
import { ColumnInstance, Row } from "react-table";
import { EntityTag } from "../../EntityTag/EntityTag";
import { StatementListTablePropRow } from "./StatementListTablePropRow";
import { StyledActantGroup, StyledSubRow } from "./StatementListTableStyles";

interface ActantObject {
  key: number;
  data: { action: IEntity | undefined; sAction: IStatementActant };
}
interface ActionObject {
  key: number;
  data: { action: IEntity | undefined; sAction: IStatementAction };
}
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
  const { detailId, setDetailId, setStatementId, setTerritoryId } =
    useSearchParams();

  const renderListActant = (sActantId: string, key: number) => {
    return (
      <React.Fragment key={key}>
        {sActantId && (
          <div key={key}>
            <EntityTag
              actant={entities[sActantId]}
              tooltipPosition="bottom center"
            />
          </div>
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
      <div key={key} style={{ marginBottom: ".5rem" }}>
        {renderListActant(actant.id, key)}
        {renderFirstLevelProps(sActant.props)}
      </div>
    );
  };

  const renderFirstLevelProps = (props: IProp[]) => {
    return (
      <StatementListTablePropRow
        level={1}
        props={props}
        entities={entities}
        // renderChildrenPropRow={renderSecondLevelProps}
      />
    );
  };

  // const renderSecondLevelProps = (props: IProp[]) => {
  //   return (
  //     <StatementListTablePropRow
  //       level={2}
  //       props={props}
  //       entities={entities}
  //       renderChildrenPropRow={renderThirdLevelProps}
  //     />
  //   );
  // };
  // const renderThirdLevelProps = (props: IProp[]) => {
  //   return (
  //     <StatementListTablePropRow level={3} props={props} entities={entities} />
  //   );
  // };

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
          <b>text</b>
          {text}
          <br />
          <b>actions</b>
          <StyledActantGroup>
            {actionObjects.map((action, key) =>
              renderListActantWithProps(
                action.data.action,
                action.data.sAction,
                key
              )
            )}
          </StyledActantGroup>
          <br />
          <b>subjects</b>
          <StyledActantGroup>
            {subjectObjects.map((actant, key) =>
              renderListActantWithProps(
                actant.data.subject,
                actant.data.sSubject,
                key
              )
            )}
          </StyledActantGroup>
          <br />
          <b>actants</b>
          <StyledActantGroup>
            {actantObjects.map((actant, key) =>
              renderListActantWithProps(
                actant.data.actant,
                actant.data.sActant,
                key
              )
            )}
          </StyledActantGroup>
          <br />
          <b>references</b>
          {referenceObjects.map((reference, key) =>
            renderListActant(reference.id, key)
          )}
          <br />
          <b>tags</b>
          {tagObjects.map((tag, key) => renderListActant(tag.id, key))}
          <br />
          <b>notes</b>
          <br />
          {notes.map((note: string, key: number) => {
            return (
              <p key={key}>
                {note}
                <br />
              </p>
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
