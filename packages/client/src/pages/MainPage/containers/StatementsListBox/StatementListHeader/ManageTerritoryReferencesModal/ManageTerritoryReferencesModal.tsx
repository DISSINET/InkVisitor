import { EntityEnums } from "@shared/enums";
import { IEntity, IReference, IResponseTerritory } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Loader,
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
import { BiRefresh } from "react-icons/bi";
import { FaClone, FaEdit, FaPlus, FaTrashAlt } from "react-icons/fa";
import { HiOutlineDocument, HiOutlineDocumentText } from "react-icons/hi";
import { LuLink2, LuLink2Off } from "react-icons/lu";
import { TbReplace } from "react-icons/tb";
import { CellProps, Column } from "react-table";
import { ResourceWithDocument } from "types";
import { ManageTerritoryReferencesAnchorText } from "./ManageTerritoryReferencesAnchorText";
import { StyledTextWrapper } from "./ManageTerritoryReferencesModalStyles";

type CellType = CellProps<ResourceWithDocument>;

interface ManageTerritoryReferencesModal {
  managedTerritory: IResponseTerritory;
  resourcesWithDocuments: ResourceWithDocument[];
  onClose: () => void;
  showLoader?: boolean;
}
export const ManageTerritoryReferencesModal: React.FC<
  ManageTerritoryReferencesModal
> = ({
  managedTerritory,
  resourcesWithDocuments,
  onClose,
  showLoader = false,
}) => {
  const { references, entities } = managedTerritory;

  const newArrayWithOneReferencedId: ResourceWithDocument[] = useMemo(() => {
    const createObjectsWithOneReferencedId = (
      object: ResourceWithDocument
    ): ResourceWithDocument[] => {
      const { document, ...rest } = object;
      if (document) {
        const { referencedEntityIds } = document;
        if (referencedEntityIds.length > 0) {
          return referencedEntityIds.map((id) => ({
            ...rest,
            document: { ...document, referencedEntityIds: [id] },
          }));
        }
        return [
          { ...rest, document: { ...document, referencedEntityIds: [] } },
        ];
      }
      return [{ ...rest, document: false }];
    };

    const result: ResourceWithDocument[] = resourcesWithDocuments.reduce(
      (acc: ResourceWithDocument[], obj: ResourceWithDocument) => {
        const objectsWithOneReferencedId =
          createObjectsWithOneReferencedId(obj);
        acc.push(...objectsWithOneReferencedId);
        return acc;
      },
      []
    );

    return result;
  }, [resourcesWithDocuments]);

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
        queryClient.invalidateQueries(["territory", "statement-list"]);
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

  function extractTextBetweenTags(text: string, id: string) {
    const regex = new RegExp(`<${id}>(.*?)</${id}>`, "g");
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }

    return matches;
  }

  const columns = useMemo<Column<ResourceWithDocument>[]>(
    () => [
      {
        Header: "Resource",
        Cell: ({ row }: CellType) => {
          const resource = entities[row.original.reference.resource];
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
          const part = entities[row.original.reference.value];
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
          const { document } = row.original;
          return (
            <>
              <StyledTextWrapper>
                {document ? (
                  <>
                    <HiOutlineDocumentText size={16} />
                    {document?.title}
                  </>
                ) : (
                  <HiOutlineDocument size={16} />
                )}
              </StyledTextWrapper>
            </>
          );
        },
      },
      {
        Header: "Anchor",
        Cell: ({ row }: CellType) => {
          const { document } = row.original;
          if (document && document.referencedEntityIds.length > 0) {
            const { content, referencedEntityIds } = document;

            const extractedText = extractTextBetweenTags(
              content,
              referencedEntityIds[0]
            );

            return (
              <>
                <StyledTextWrapper>
                  <LuLink2 size={16} />
                  <ManageTerritoryReferencesAnchorText
                    extractedText={extractedText}
                  />
                </StyledTextWrapper>
              </>
            );
          }

          return (
            <>
              {document && (
                <StyledTextWrapper>
                  {document?.referencedEntityIds &&
                  document.referencedEntityIds.length > 0 ? (
                    <>
                      <LuLink2 size={16} />
                      {document?.referencedEntityIds}
                    </>
                  ) : (
                    <LuLink2Off size={16} />
                  )}
                </StyledTextWrapper>
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
    [entities, newArrayWithOneReferencedId, editedRow]
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
            disabled={!newArrayWithOneReferencedId.length}
            icon={<FaTrashAlt />}
            inverted
            color="danger"
            tooltipLabel={`remove all rows`}
            onClick={() => updateEntityMutation.mutate([])}
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
            tooltipLabel={`copy rows from parent`}
            inverted
            disabled={
              managedTerritory.data.parent &&
              !managedTerritory.data.parent.territoryId
            }
            onClick={() => {
              if (managedTerritory.data.parent) {
                api
                  .entitiesGet(managedTerritory.data.parent.territoryId)
                  .then((data) => {
                    if (replaceSection) {
                      updateEntityMutation.mutate(data.data.references);
                    } else {
                      updateEntityMutation.mutate([
                        ...references,
                        ...data.data.references,
                      ]);
                    }
                  });
              }
            }}
          />
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Territory]}
            onPicked={(entity: IEntity) => {
              if (replaceSection) {
                updateEntityMutation.mutate(entity.references);
              } else {
                updateEntityMutation.mutate([
                  ...references,
                  ...entity.references,
                ]);
              }
            }}
            excludedActantIds={[managedTerritory.id]}
            disableTemplatesAccept
            disableCreate
            inputWidth={65}
            placeholder="another T"
          />
          <Button
            icon={<BiRefresh />}
            onClick={() => {
              queryClient.invalidateQueries(["resourcesWithDocuments"]);
              queryClient.invalidateQueries(["documents"]);
              queryClient.invalidateQueries(["territory", "statement-list"]);
            }}
          />
        </ButtonGroup>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <Table
            columns={columns}
            data={newArrayWithOneReferencedId}
            disableHeading
            perPage={20}
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

      <Loader show={showLoader} />
    </Modal>
  );
};
