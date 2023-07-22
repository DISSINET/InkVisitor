import { EntityEnums } from "@shared/enums";
import { IReference, IResponseTerritory } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
} from "components";
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
import { FaClone, FaEdit, FaPlus, FaTrashAlt } from "react-icons/fa";
import { HiOutlineDocument, HiOutlineDocumentText } from "react-icons/hi";
import { LuLink2, LuLink2Off } from "react-icons/lu";
import { TbReplace } from "react-icons/tb";
import { CellProps, Column } from "react-table";

// IResponseDocument
type ResourceWithDocument = {
  reference: IReference;
  documentId: false | string;
};
type CellType = CellProps<ResourceWithDocument>;

interface ManageTerritoryReferencesModal {
  managedTerritory: IResponseTerritory;
  onClose: () => void;
}
export const ManageTerritoryReferencesModal: React.FC<
  ManageTerritoryReferencesModal
> = ({ managedTerritory, onClose }) => {
  const {
    data: documents,
    error,
    isFetching,
  } = useQuery(
    ["documents"],
    async () => {
      const res = await api.documentsGet({});
      return res.data;
    },
    {
      enabled: api.isLoggedIn(),
    }
  );

  const {
    data: resources,
    error: resourcesError,
    isFetching: resourcesIsFetching,
  } = useQuery(
    ["resourcesWithDocuments"],
    async () => {
      const res = await api.entitiesSearch({
        resourceHasDocument: true,
      });
      return res.data;
    },
    {
      enabled: api.isLoggedIn(),
    }
  );

  const resourcesWithDocuments: ResourceWithDocument[] = useMemo(() => {
    return managedTerritory.references
      ? managedTerritory.references.map((reference) => {
          const document = resources?.find((r) => r.id === reference.resource);
          return {
            reference: reference,
            documentId: document?.data.documentId ?? false,
          };
        })
      : [];
  }, [resources, documents, managedTerritory]);

  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const queryClient = useQueryClient();

  const updateEntityMutation = useMutation(
    async (newReferences: IReference[]) =>
      await api.entityUpdate(managedTerritory.id, {
        references: newReferences,
      }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["resourcesWithDocuments"]);
        queryClient.invalidateQueries(["documents"]);
      },
    }
  );

  const handleChangeResource = (refId: string, newReSourceId: string) => {
    const newReferences = [...managedTerritory.references];
    newReferences.forEach((ref: IReference) => {
      if (ref.id === refId) {
        ref.resource = newReSourceId;
      }
    });
    updateEntityMutation.mutate(newReferences);
  };

  const handleChangeValue = (refId: string, newValueId: string) => {
    const newReferences = [...managedTerritory.references];
    newReferences.forEach((ref: IReference) => {
      if (ref.id === refId) {
        ref.value = newValueId;
      }
    });
    updateEntityMutation.mutate(newReferences);
  };

  const [editedRow, setEditedRow] = useState<false | number>(false);

  const columns = useMemo<Column<any>[]>(
    () => [
      {
        Header: "Resource",
        accessor: "data",
        Cell: ({ row }: CellType) => {
          const resource =
            managedTerritory.entities[row.original.reference.resource];
          return (
            <>
              {resource ? (
                <EntityTag
                  entity={resource}
                  unlinkButton={{
                    onClick: () =>
                      handleChangeResource(row.original.reference.id, ""),
                  }}
                />
              ) : (
                <EntitySuggester
                  openDetailOnCreate
                  territoryActants={[]}
                  onSelected={(newSelectedId: string) => {
                    handleChangeResource(
                      row.original.reference.id,
                      newSelectedId
                    );
                  }}
                  disableTemplatesAccept
                  categoryTypes={[EntityEnums.Class.Resource]}
                />
              )}
            </>
          );
        },
      },
      {
        Header: "Part",
        Cell: ({ row }: CellType) => {
          const part = managedTerritory.entities[row.original.reference.value];
          return (
            <>
              {part ? (
                <EntityTag
                  entity={part}
                  unlinkButton={{
                    onClick: () =>
                      handleChangeValue(row.original.reference.id, ""),
                  }}
                />
              ) : (
                <EntitySuggester
                  openDetailOnCreate
                  territoryActants={[]}
                  onSelected={(newSelectedId: string) => {
                    handleChangeValue(row.original.reference.id, newSelectedId);
                  }}
                  disableTemplatesAccept
                  categoryTypes={[EntityEnums.Class.Value]}
                />
              )}
            </>
          );
        },
      },
      {
        Header: "Document",
        Cell: ({ row }: CellType) => {
          const { documentId } = row.original;
          const document = documents?.find((d) => d.id === documentId);
          return (
            <>
              <p
                style={{
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {documentId ? (
                  <>
                    <HiOutlineDocumentText size={16} />
                    {document?.title}
                  </>
                ) : (
                  <HiOutlineDocument size={16} />
                )}
              </p>
            </>
          );
        },
      },
      {
        Header: "Anchor",
        Cell: ({ row }: CellType) => {
          const { documentId } = row.original;
          const document = documents?.find((d) => d.id === documentId);

          return (
            <>
              {documentId && (
                <p
                  style={{
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {document?.referencedEntityIds &&
                  document.referencedEntityIds.length > 0 ? (
                    <>
                      <LuLink2 size={16} />
                      {document?.referencedEntityIds}
                    </>
                  ) : (
                    <LuLink2Off size={16} />
                  )}
                </p>
              )}
            </>
          );
        },
      },
      {
        id: "edit",
        Cell: ({ row }: CellType) => {
          return (
            <Button
              color="warning"
              inverted
              icon={<FaEdit />}
              onClick={() =>
                editedRow !== row.index
                  ? setEditedRow(row.index)
                  : setEditedRow(false)
              }
            />
          );
        },
      },
    ],
    [managedTerritory, resourcesWithDocuments, documents, resources, editedRow]
  );

  const [replaceSection, setReplaceSection] = useState(false);

  return (
    <Modal showModal={showModal} onClose={onClose} width="auto">
      <ModalHeader
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <p style={{ marginRight: "0.5rem" }}>Manage Territory References</p>
            <EntityTag entity={managedTerritory} disableDrag />
          </div>
        }
      />
      <ModalContent column enableScroll>
        <ButtonGroup
          height={19}
          marginBottom
          style={{ marginLeft: "0.5rem", marginRight: "1rem" }}
        >
          <Button
            // disabled={!hasEntities()}
            icon={<FaTrashAlt />}
            inverted
            color="danger"
            tooltipLabel={`remove all rows`}
            // onClick={() => setShowSubmitSection(section)}
          />
          <div
            style={{ borderRight: "1px dashed black", marginLeft: "0.3rem" }}
          />
          <AttributeButtonGroup
            options={[
              {
                longValue: "append",
                shortValue: "",
                onClick: () => setReplaceSection(false),
                selected: !replaceSection,
                shortIcon: <FaPlus />,
              },
              {
                longValue: "replace",
                shortValue: "",
                onClick: () => setReplaceSection(true),
                selected: replaceSection,
                shortIcon: <TbReplace />,
              },
            ]}
          />
          <Button
            icon={<FaClone />}
            label="parent T"
            // disabled={!previousStatement}
            tooltipLabel={`copy rows from parent`}
            inverted
            // onClick={() =>
            // handleCopyFromStatement(previousStatement, section, replaceSection)
            // }
          />
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Territory]}
            // onPicked={(entity: IEntity) =>
            //   handleCopyFromStatement(entity as IStatement, section, replaceSection)
            // }
            excludedActantIds={[managedTerritory.id]}
            disableTemplatesAccept
            disableCreate
            inputWidth={65}
            placeholder="parent T"
          />
        </ButtonGroup>

        <div style={{ display: "flex" }}>
          <Table
            columns={columns}
            data={resourcesWithDocuments}
            disableHeading
          />

          {editedRow !== false && (
            <Input
              type="textarea"
              onChangeFn={(value) => console.log(value)}
              value={editedRow.toString()}
            />
          )}
        </div>
      </ModalContent>
      <ModalFooter>
        <Button color="warning" label="Close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  );
};
