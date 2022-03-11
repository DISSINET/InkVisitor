import { IEntity } from "@shared/types";
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
    const { actions, actants, text, references, tags } = row.values.data;
    const { notes }: { notes: string[] } = row.original;

    // ACTIONS
    const actionIds = actions.map((a: any) => a.action);
    const actionObjects: IEntity[] = actionIds.map((actionId: string) =>
      entities.find((e) => e && e.id === actionId)
    );

    // ACTANTS
    const actantIds = actants.map((a: any) => a.actant);
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

    console.log(tagObjects);

    return (
      <>
        <StyledSubRow id={`statement${row.values.id}`}>
          text {text}
          <br />
          actions
          {actionObjects.map((action, key) => renderListActant(action, key))}
          <br />
          actants
          {actantObjects.map((actant, key) => renderListActant(actant, key))}
          <br />
          references
          {referenceObjects.map((reference, key) =>
            renderListActant(reference, key)
          )}
          <br />
          tags
          {tagObjects.map((reference, key) => renderListActant(reference, key))}
          <br />
          notes
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
