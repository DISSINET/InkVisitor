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

  const renderListActant = (actant: IEntity | undefined, key: number) => {
    return (
      <React.Fragment key={key}>
        {actant && (
          <div key={key}>
            <EntityTag actant={actant} tooltipPosition="bottom center" />
          </div>
        )}
      </React.Fragment>
    );
  };

  const renderListActantWithProps = (
    actant: IEntity | undefined,
    key: number
  ) => {
    return (
      <React.Fragment key={key}>
        {renderListActant(actant, key)}
        {actant && <>{renderFirstLevelProps(actant.props)}</>}
      </React.Fragment>
    );
  };

  const renderFirstLevelProps = (props: IProp[]) => {
    return (
      <StatementListTablePropRow
        props={props}
        entities={entities}
        renderChildrenPropRow={renderSecondLevelProps}
      />
    );
  };

  const renderSecondLevelProps = (props: IProp[]) => {
    return (
      <StatementListTablePropRow
        props={props}
        entities={entities}
        renderChildrenPropRow={renderThirdLevelProps}
      />
    );
  };
  const renderThirdLevelProps = (props: IProp[]) => {
    return <StatementListTablePropRow props={props} entities={entities} />;
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
    } = row.values.data;

    const { notes }: { notes: string[] } = row.original;

    // ACTIONS
    const actionObjects = actions.map(
      (a: IStatementAction) => entities[a.action]
    );

    // SUBJECTS
    const subjectObjects: IEntity[] = actants
      .filter((a: IStatementActant) => a.position === "s")
      .map((a: IStatementActant) => entities[a.actant]);

    // ACTANTS
    const actantObjects: IEntity[] = actants
      .filter((a: IStatementActant) => a.position !== "s")
      .map((a: any) => entities[a.actant]);

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
              renderListActantWithProps(action, key)
            )}
          </StyledActantGroup>
          <br />
          <b>subjects</b>
          <StyledActantGroup>
            {subjectObjects.map((actant, key) =>
              renderListActantWithProps(actant, key)
            )}
          </StyledActantGroup>
          <br />
          <b>actants</b>
          <StyledActantGroup>
            {actantObjects.map((actant, key) =>
              renderListActantWithProps(actant, key)
            )}
          </StyledActantGroup>
          <br />
          <b>references</b>
          {referenceObjects.map((reference, key) =>
            renderListActant(reference, key)
          )}
          <br />
          <b>tags</b>
          {tagObjects.map((reference, key) => renderListActant(reference, key))}
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
