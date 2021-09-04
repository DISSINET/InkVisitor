import React, { useState } from "react";
import { ColumnInstance, Row, useTable } from "react-table";

import { IActant, IAction, ILabel, IStatementActant } from "@shared/types";
import api from "api";
import { StyledSubRow } from "./StatementListRowStyles";

interface StatementListRowExpanded {
  row: Row;
  visibleColumns: ColumnInstance<{}>[];
}
export const StatementListRowExpanded: React.FC<StatementListRowExpanded> = ({
  row,
  visibleColumns,
}) => {
  const [actants, setActants] = useState<IStatementActant[]>([]);

  const renderRowSubComponent = React.useCallback(
    ({ row }) => {
      const { action, text, note, references, tags } = row.values.data;

      return (
        <StyledSubRow>
          {/* ---------- TEXT ---------- */}
          <p>{text}</p>
          {/* ---------- SUBJECT ---------- */}
          {/* <div className="mt-2 flex items-center">
            <div className="mr-2">
              <Tag
                propId={actionObject?.id || ""}
                category={Entities.S.id}
                color={Entities.S.color}
                label={actionObject?.labels[0].value}
              />
            </div>
            <div className="mr-2">Action: </div>

            {actionObject?.labels.map(
              (labelObject: ILabel, key: number) =>
                labelObject.value !== "NULL" && (
                  <div key={key} className="mr-2">
                    {labelObject.value}
                  </div>
                )
            )}
          </div> */}
          {/* ---------- ACTANTS ---------- */}
          {/* <div className="flex flex-col">
              {row.values &&
                row.values.data.actants.map((actant: IActant, key: number) => {
                  const actantObject =
                    actants &&
                    (actants.find((a) => a.id === actant.actant) as ActantITable);
                  const entity = Entities[actantObject?.class];
                  const position = dictionaries?.positions.find(
                    (p) => p.value === actant.position
                  );
                  const certainty = dictionaries?.certainties.find(
                    (c) => c.value === actant.certainty
                  );
                  const elvl = dictionaries?.elvls.find(
                    (e) => e.value === actant.elvl
                  );
  
                  return (
                    <>
                      {actantObject && (
                        <div className="mt-2 flex items-center" key={key}>
                          <div className="mr-2">
                            <Tag
                              propId={actantObject?.id}
                              label={actantObject?.data.label}
                              category={entity?.id}
                              color={entity?.color}
                            />
                          </div>
                          <div className="mr-2">{position?.label}</div>
                          <div className="mr-2">{certainty?.label}</div>
                          <div className="mr-2">{elvl?.label}</div>
                        </div>
                      )}
                    </>
                  );
                })}
            </div> */}
          {/* ---------- RESOURCES ---------- */}
          {/* <div className="mt-2">
              Resources:{" "}
              {references.map((reference: IReference, key: number) => (
                <Tag
                  key={key}
                  propId={reference.resource}
                  category={Entities.R.id}
                  color={Entities.R.color}
                />
              ))}
            </div> */}
          {/* ---------- NOTE ---------- */}
          {/* <div className="mt-2">Note: {note}</div> */}
          {/* ---------- TAGS ---------- */}
          {/* <div className="mt-2">
              Tags:{" "}
              {tags.map((tagId: string, si: number) => {
                const actantObject =
                  actants &&
                  (actants.find((a) => a.id === tagId) as ActantITable);
                const entity = Entities[actantObject?.class];
                return actantObject && entity ? (
                  <Tag
                    key={si}
                    propId={actantObject?.id}
                    category={entity.id}
                    color={entity.color}
                  />
                ) : (
                  <div key={si} />
                );
              })}
            </div> */}
        </StyledSubRow>
      );
    },
    [actants]
  );

  return (
    <tr>
      <td colSpan={visibleColumns.length + 1}>
        {renderRowSubComponent({ row })}
      </td>
    </tr>
  );
};
