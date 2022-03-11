import { IEntity, IStatementActant } from "@shared/types";
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
  const renderListActant = (actantObject: IEntity, key: number) => {
    return (
      actantObject && (
        <EntityTag
          key={key}
          actant={actantObject}
          // showOnly="entity"
          tooltipPosition="bottom center"
        />
      )
    );
  };

  const { detailId, setDetailId, setStatementId, setTerritoryId } =
    useSearchParams();

  // const {
  //   actions,
  //   actants,
  //   text,
  //   references,
  //   tags,
  // }: {
  //   actions: IEntity[];
  //   actants: IEntity[];
  //   text: string;
  //   references: IEntity[];
  //   tags: IEntity[];
  // } = row.values.data;

  const renderRowSubComponent = React.useCallback(({ row }) => {
    const {
      actions,
      actants,
      text,
      references,
      tags,
    }: {
      actions: any;
      actants?: any;
      text: string;
      references: any;
      tags: any;
    } = row.values.data;

    const { notes }: { notes: string[] } = row.original;

    // ACTIONS
    const actionIds = actions.map((a: any) => a.action);
    const actionObjects: IEntity[] = actionIds.map((actionId: string) =>
      entities.find((e) => e && e.id === actionId)
    );

    // SUBJECTS
    const subjectIds = actants
      .filter((a: IStatementActant) => a.position === "s")
      .map((a: IStatementActant) => a.actant);
    const subjectObjects: IEntity[] = subjectIds.map((subjectId: string) =>
      entities.find((e) => e && e.id === subjectId)
    );

    // ACTANTS
    const actantIds = actants
      .filter((a: IStatementActant) => a.position !== "s")
      .map((a: any) => a.actant);
    const actantObjects: IEntity[] = actantIds.map((actantId: string) =>
      entities.find((e) => e && e.id === actantId)
    );

    const referenceIds = references.map((r: any) => r.resource);
    const referenceObjects: IEntity[] = referenceIds.map((reference: string) =>
      entities.find((e) => e && e.id === reference)
    );

    const tagObjects: IEntity[] = tags.map((tagId: string) =>
      entities.find((e) => e && e.id === tagId)
    );

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
