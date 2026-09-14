import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { Button, ButtonGroup, CancelButton, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import useKeypress from "hooks/useKeyPress";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GrClose } from "react-icons/gr";
import { MdOutlineEdit } from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";
import { v4 as uuidv4 } from "uuid";
import {
  StyledCloseIconWrap,
  StyledContent,
  StyledHeader,
  StyledLabel,
  StyledNameFillWrap,
  StyledPanel,
  StyledValue,
} from "./ExplorerTableNewColumnPanelStyles";
import { IcoArrowReturnRight } from "Theme/icons";
import { getStoredUserRole } from "utils/userStorage";
import { isReadOnlyColumn } from "../types";
import { getRelationColumnLabel } from "./ExploreColumnParamValueRenderers";

// the relation type dropdown encodes the direction into the option value, so a
// single control covers both; the suffix is split off into the `inverse` param
const INVERSE_SUFFIX = ":inverse";

const relationTypeOptions = RelationEnums.AllTypes.flatMap((t) => {
  const forward = { value: t as string, label: getRelationColumnLabel(t) };
  // a symmetrical relation reads the same from both sides
  if (!Relation.RelationRules[t]?.asymmetrical) {
    return [forward];
  }
  return [forward, { value: `${t}${INVERSE_SUFFIX}`, label: getRelationColumnLabel(t, true) }];
});

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

const ExplorerTableNewColumnPanel: React.FC<Props> = ({ open, onClose, onCreateColumn }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(initial.name);
  const [type, setType] = useState(initial.type);
  const [editable, setEditable] = useState<boolean>(initial.editable);
  const isViewer = getStoredUserRole() === UserEnums.Role.Viewer;
  const [paramValues, setParamValues] = useState<Record<string, unknown>>({});

  const paramsDef = Explore.EExploreColumnTypeConfig[type].paramsDef ?? [];
  const typeLabel = Explore.EExploreColumnTypeConfig[type].label;
  const relationTypeParamDef = paramsDef.find((def) => def.type === "relationType");

  // Reset param values when column type changes
  useEffect(() => {
    setParamValues({});
  }, [type]);

  const setParamValue = useCallback((paramId: string, value: unknown) => {
    setParamValues((prev) => ({ ...prev, [paramId]: value }));
  }, []);

  const canCreate = useMemo(() => {
    if (name.length === 0) return false;
    for (const def of paramsDef) {
      if (def.isRequired) {
        const val = paramValues[def.id];
        if (val === undefined || val === null || val === "") return false;
      }
    }
    return true;
  }, [name, paramsDef, paramValues]);

  const handleClose = useCallback(() => {
    setName("");
    setType(Explore.EExploreColumnType.EPV);
    setEditable(false);
    setParamValues({});
    onClose();
  }, [onClose]);

  const params = useMemo(() => {
    const serializedParams: Record<string, unknown> =
      paramsDef.length > 0
        ? Object.fromEntries(
            paramsDef.map((def) => {
              const val = paramValues[def.id];
              const serialized =
                def.type === "entity" && val && typeof val === "object" && "id" in val
                  ? (val as IEntity).id
                  : val;
              return [def.id, serialized];
            }),
          )
        : {};
    if (paramValues.inverse) {
      serializedParams.inverse = true;
    }
    return serializedParams as Explore.IExploreColumnParams<typeof type>;
  }, [paramsDef, paramValues]);

  const isReadOnly = isReadOnlyColumn({ type, params });

  // a relation column is named after its relation type, so the fill stays
  // unavailable until one is picked
  const fillLabel = useMemo(() => {
    if (!relationTypeParamDef) return typeLabel;
    const relationType = paramValues[relationTypeParamDef.id] as RelationEnums.Type | undefined;
    return relationType ? getRelationColumnLabel(relationType, !!paramValues.inverse) : undefined;
  }, [relationTypeParamDef, typeLabel, paramValues]);

  const handleCreate = useCallback(() => {
    const col: Explore.IExploreColumn = {
      id: uuidv4(),
      name: name.length ? name : Explore.EExploreColumnTypeConfig[type].label,
      type,
      editable: isReadOnly ? false : editable,
      params,
    };
    onCreateColumn(col);
    handleClose();
  }, [name, type, editable, isReadOnly, params, onCreateColumn, handleClose]);

  const tryCreate = useCallback(() => {
    if (!open || !canCreate) return;
    handleCreate();
  }, [open, canCreate, handleCreate]);

  useKeypress("Enter", tryCreate, [open, canCreate], true);

  const renderParamField = (def: Explore.IExploreColumnParamDef) => {
    switch (def.type) {
      case "relationType": {
        const value = paramValues[def.id] as RelationEnums.Type | undefined;
        const optionValue = value ? `${value}${paramValues.inverse ? INVERSE_SUFFIX : ""}` : null;
        return (
          <Dropdown.Single.Basic
            width="full"
            value={optionValue}
            placeholder="Select relation type"
            options={relationTypeOptions}
            onChange={(v) => {
              const inverse = v.endsWith(INVERSE_SUFFIX);
              const relationType = inverse ? v.slice(0, -INVERSE_SUFFIX.length) : v;
              setParamValue(def.id, relationType || undefined);
              setParamValue("inverse", inverse || undefined);
            }}
          />
        );
      }
      case "entity": {
        const entity = paramValues[def.id] as IEntity | undefined;
        return entity ? (
          <EntityTag
            fullWidth
            entity={entity}
            unlinkButton={{
              onClick: () => setParamValue(def.id, undefined),
            }}
            disableDoubleClick
          />
        ) : (
          <EntitySuggester
            categoryTypes={def.entityClasses ?? [EntityEnums.Class.Concept]}
            reuseDroppedValue
            onPicked={(e) => setParamValue(def.id, e)}
            inputWidth="full"
          />
        );
      }
      default:
        return null;
    }
  };

  if (!open) return <React.Fragment />;

  return (
    <StyledPanel ref={panelRef}>
      <StyledHeader>
        <div style={{ display: "flex", alignItems: "center" }}>
          <TbColumnInsertRight size={17} />
          <p style={{ marginLeft: "0.5rem" }}>New column</p>
        </div>
        <StyledCloseIconWrap>
          <Button
            icon={<GrClose size={14} />}
            onClick={handleClose}
            noBorder
            color="black"
            noBackground
            inverted
          />
        </StyledCloseIconWrap>
      </StyledHeader>
      <StyledContent>
        <StyledLabel>Column type</StyledLabel>
        <StyledValue>
          <Dropdown.Single.Basic
            width="full"
            value={type}
            options={Object.keys(Explore.EExploreColumnType)
              .map(
                (key) => Explore.EExploreColumnType[key as keyof typeof Explore.EExploreColumnType],
              )
              .map((value) => ({
                value,
                label: Explore.EExploreColumnTypeConfig[value].label,
                isDisabled: Explore.EExploreColumnTypeConfig[value].isDisabled,
              }))}
            onChange={(v) => setType(v)}
          />
        </StyledValue>
        {paramsDef.map((def) => (
          <React.Fragment key={def.id}>
            <StyledLabel>{def.label}</StyledLabel>
            <StyledValue>{renderParamField(def)}</StyledValue>
          </React.Fragment>
        ))}
        <StyledLabel>Column name</StyledLabel>
        <StyledValue>
          <Input
            width="full"
            value={name}
            onChangeFn={(v) => setName(v)}
            changeOnType
            rightContent={
              <StyledNameFillWrap>
                <Button
                  icon={<IcoArrowReturnRight size={13} />}
                  tooltipLabel={
                    relationTypeParamDef
                      ? "fill in the relation type label"
                      : "fill in the column type label"
                  }
                  tooltipPosition="top"
                  onClick={() => fillLabel && setName(fillLabel)}
                  disabled={!fillLabel || name === fillLabel}
                  noBorder
                  noBackground
                  color="black"
                  inverted
                />
              </StyledNameFillWrap>
            }
          />
        </StyledValue>
        {/* an editable column would render read-only cells for a Viewer anyway */}
        {!isViewer && !isReadOnly && (
          <>
            <StyledLabel>
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                Editable
                <span style={{ marginLeft: "0.3rem" }}>
                  <MdOutlineEdit size={14} />
                </span>
              </span>
            </StyledLabel>
            <StyledValue>
              <Checkbox value={editable} onChangeFn={(v) => setEditable(v)} />
            </StyledValue>
          </>
        )}
      </StyledContent>
      <span
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <ButtonGroup style={{ marginLeft: "1rem", marginTop: "1rem" }}>
          <CancelButton onClick={handleClose} />
          <Button label="Create column" onClick={handleCreate} disabled={!canCreate} />
        </ButtonGroup>
      </span>
    </StyledPanel>
  );
};

export default React.memo(ExplorerTableNewColumnPanel);
