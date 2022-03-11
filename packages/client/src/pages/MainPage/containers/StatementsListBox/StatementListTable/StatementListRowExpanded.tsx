import {
  IEntity,
  IStatementActant,
  IStatementAction,
  IStatementReference,
} from "@shared/types";
import { useSearchParams } from "hooks";
import React from "react";
import { ColumnInstance, Row } from "react-table";
import { EntityTag } from "../../EntityTag/EntityTag";
import { StyledSubRow } from "./StatementListTableStyles";

interface StatementListRowExpanded {
  row: Row;
  visibleColumns: ColumnInstance<{}>[];
  entities: IEntity[];
}
export const StatementListRowExpanded: React.FC<StatementListRowExpanded> = ({
  row,
  visibleColumns,
  entities,
}) => {
  const renderListActant = (actantObject: IEntity | undefined, key: number) => {
    return (
      actantObject && (
        <EntityTag
          key={key}
          actant={actantObject}
          tooltipPosition="bottom center"
        />
      )
    );
  };

  const { detailId, setDetailId, setStatementId, setTerritoryId } =
    useSearchParams();

  const getObjects = (ids: string[]) =>
    ids.map((id: string) => entities.find((e) => e && e.id === id));

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
    const actionIds = actions.map((a: any) => a.action);
    const actionObjects: (IEntity | undefined)[] = getObjects(actionIds);
    console.log(actionObjects);

    // SUBJECTS
    const subjectIds = actants
      .filter((a: IStatementActant) => a.position === "s")
      .map((a: IStatementActant) => a.actant);
    const subjectObjects: (IEntity | undefined)[] = getObjects(subjectIds);

    // ACTANTS
    const actantIds = actants
      .filter((a: IStatementActant) => a.position !== "s")
      .map((a: any) => a.actant);
    const actantObjects: (IEntity | undefined)[] = getObjects(actantIds);

    // REFERENCES
    const referenceIds = references.map((r: any) => r.resource);
    const referenceObjects: (IEntity | undefined)[] = getObjects(referenceIds);

    // TAGS
    const tagObjects: (IEntity | undefined)[] = getObjects(tagIds);

    return (
      <>
        <StyledSubRow id={`statement${row.values.id}`}>
          <b>text</b>
          {text}
          <br />
          <b>actions</b>
          {actionObjects.map((action, key) => renderListActant(action, key))}
          <br />
          <b>subjects</b>
          {subjectObjects.map((actant, key) => renderListActant(actant, key))}
          <br />
          <b>actants</b>
          {actantObjects.map((actant, key) => renderListActant(actant, key))}
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
