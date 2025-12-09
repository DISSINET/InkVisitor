import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import { Button, ButtonGroup, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GrClose } from "react-icons/gr";
import { MdOutlineEdit } from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";
import { v4 as uuidv4 } from "uuid";
import {
  StyledCloseIconWrap,
  StyledContent,
  StyledHeader,
  StyledLabel,
  StyledPanel,
  StyledValue,
} from "./ExplorerTableNewColumnPanelStyles";

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
  const panelRef = useRef<HTMLDivElement>(null);
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
    handleClose();
  };

  const handleClose = useCallback(() => {
    setName("");
    setType(Explore.EExploreColumnType.EPV);
    setEditable(false);
    setPropertyType(undefined);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (open) {
      // Add event listener when panel is open
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      // Cleanup event listener on unmount or when panel closes
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, handleClose]);

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
        <StyledLabel>Column name</StyledLabel>
        <StyledValue>
          <Input
            width="full"
            value={name}
            onChangeFn={(v) => setName(v)}
            changeOnType
          />
        </StyledValue>
        <StyledLabel>Column type</StyledLabel>
        <StyledValue>
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
        </StyledValue>
        {type === Explore.EExploreColumnType.EPV && (
          <>
            <StyledLabel>Property type</StyledLabel>
            <StyledValue>
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
                  inputWidth={"full"}
                />
              )}
            </StyledValue>
          </>
        )}
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
      </StyledContent>
      <span
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <ButtonGroup style={{ marginLeft: "1rem", marginTop: "1rem" }}>
          <Button color="warning" label="cancel" onClick={handleClose} />
          <Button
            label="create column"
            onClick={handleCreate}
            disabled={!canCreate}
          />
        </ButtonGroup>
      </span>
    </StyledPanel>
  );
};

export default React.memo(ExplorerTableNewColumnPanel);
