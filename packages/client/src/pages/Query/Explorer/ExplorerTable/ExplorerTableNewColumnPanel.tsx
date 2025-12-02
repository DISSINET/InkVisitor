import React, { useMemo, useState } from "react";
import { GrClose } from "react-icons/gr";
import { TbColumnInsertRight } from "react-icons/tb";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import { Button, ButtonGroup, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { v4 as uuidv4 } from "uuid";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreateColumn: (column: Explore.IExploreColumn) => void;
}

const initial: Explore.IExploreColumn = {
  id: "",
  name: "",
  type: Explore.EExploreColumnType.EPV,
  editable: false,
  params: {},
};

const ExplorerTableNewColumnPanel: React.FC<Props> = ({
  open,
  onClose,
  onCreateColumn,
}) => {
  const [name, setName] = useState(initial.name);
  const [type, setType] = useState(initial.type);
  const [editable, setEditable] = useState<boolean>(initial.editable);
  const [propertyType, setPropertyType] = useState<IEntity | undefined>(
    undefined
  );
  const propertyTypeId = useMemo(() => propertyType?.id || "", [propertyType]);

  const canCreate =
    name.length > 0 &&
    (type !== Explore.EExploreColumnType.EPV || Boolean(propertyTypeId));

  const handleCreate = () => {
    const col: Explore.IExploreColumn = {
      id: uuidv4(),
      name: name.length ? name : Explore.EExploreColumnTypeLabels[type],
      type,
      editable,
      params:
        type === Explore.EExploreColumnType.EPV
          ? { propertyType: propertyTypeId }
          : {},
    };
    onCreateColumn(col);
    // reset local state
    setName("");
    setType(Explore.EExploreColumnType.EPV);
    setEditable(false);
    setPropertyType(undefined);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="qt-newcol">
      <div className="qt-newcol-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <TbColumnInsertRight size={17} />
          <p style={{ marginLeft: "0.5rem" }}>New column</p>
        </div>
        <div>
          <Button
            icon={<GrClose size={14} />}
            onClick={onClose}
            noBorder
            color="black"
            noBackground
            inverted
          />
        </div>
      </div>
      <div className="qt-newcol-content">
        <div className="qt-newcol-label">Column name</div>
        <div className="qt-newcol-value">
          <Input
            width="full"
            value={name}
            onChangeFn={(v) => setName(v)}
            changeOnType
          />
        </div>
        <div className="qt-newcol-label">Column type</div>
        <div className="qt-newcol-value">
          <Dropdown.Single.Basic
            width="full"
            value={type}
            options={Object.keys(Explore.EExploreColumnType)
              .map(
                (key) =>
                  Explore.EExploreColumnType[
                    key as keyof typeof Explore.EExploreColumnType
                  ]
              )
              .map((value) => {
                return {
                  value: value,
                  label: Explore.EExploreColumnTypeLabels[value],
                  isDisabled:
                    Explore.EExploreColumnTypeDisabled[value].disabled,
                };
              })}
            onChange={(v) => setType(v)}
          />
        </div>
        {type === Explore.EExploreColumnType.EPV && (
          <>
            <div className="qt-newcol-label">Property type</div>
            <div className="qt-newcol-value">
              {propertyType ? (
                <EntityTag
                  fullWidth
                  entity={propertyType}
                  unlinkButton={{
                    onClick: () => setPropertyType(undefined),
                  }}
                  disableDoubleClick
                />
              ) : (
                <EntitySuggester
                  categoryTypes={[EntityEnums.Class.Concept]}
                  onPicked={(e) => setPropertyType(e)}
                />
              )}
            </div>
          </>
        )}
        <div className="qt-newcol-label">
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <span style={{ marginRight: "0.3rem" }}>
              {/* icon is small; leave it inline to avoid styled overhead */}
              <span>✎</span>
            </span>
            Editable
          </span>
        </div>
        <div className="qt-newcol-value">
          <Checkbox value={editable} onChangeFn={(v) => setEditable(v)} />
        </div>
      </div>
      <span
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <ButtonGroup style={{ marginLeft: "1rem", marginTop: "1rem" }}>
          <Button color="query2" label="cancel" onClick={onClose} />
          <Button
            label="create column"
            onClick={handleCreate}
            disabled={!canCreate}
          />
        </ButtonGroup>
      </span>
    </div>
  );
};

export default React.memo(ExplorerTableNewColumnPanel);
