import { EntityEnums } from "@shared/enums";
import {
  IReference,
  IResponseDocument,
  IResponseTerritory,
} from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
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
import { LuLink2Off, LuLink2 } from "react-icons/lu";
import { FaClone, FaEdit, FaPlus, FaTrashAlt } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";
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
                <EntityTag entity={resource} />
              ) : (
                row.original.reference.resource
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
                <EntityTag entity={part} />
              ) : (
                row.original.reference.value
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
              {documentId && (
                <p
                  style={{
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <HiOutlineDocumentText size={16} />
                  {document?.title}
                </p>
              )}
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
          return <Button color="warning" inverted icon={<FaEdit />} />;
        },
      },
    ],
    [managedTerritory, documents]
  );

  const [replaceSection, setReplaceSection] = useState(false);

  return (
    <Modal showModal={showModal} onClose={onClose}>
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

        <Table columns={columns} data={resourcesWithDocuments} disableHeading />
      </ModalContent>
      <ModalFooter>
        <Button color="warning" label="Close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  );
};
