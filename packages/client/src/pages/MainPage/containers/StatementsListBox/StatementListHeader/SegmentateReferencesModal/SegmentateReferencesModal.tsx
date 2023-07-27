import { EntityEnums } from "@shared/enums";
import { IResponseDocument, IResponseTerritory } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
} from "components";
import { EntityTag } from "components/advanced";
import { CEntity } from "constructors";
import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineFileSearch } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import { TfiLayoutAccordionList } from "react-icons/tfi";
import { CellProps, Column } from "react-table";
import { DropdownItem, ResourceWithDocument } from "types";

type SegmentedText = { text: string };
type CellType = CellProps<SegmentedText>;

interface SegmentateReferencesModal {
  managedTerritory: IResponseTerritory;
  resourcesWithDocuments: ResourceWithDocument[];
  onClose: () => void;
}
export const SegmentateReferencesModal: React.FC<SegmentateReferencesModal> = ({
  managedTerritory,
  resourcesWithDocuments,
  onClose,
}) => {
  // get user data
  const userId = localStorage.getItem("userid");
  const {
    status: statusUser,
    data: user,
    error: errorUser,
    isFetching: isFetchingUser,
  } = useQuery(
    ["user", userId],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    { enabled: !!userId && api.isLoggedIn() }
  );

  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const [selectedOption, setSelectedOption] = useState<
    DropdownItem | undefined
  >();

  const [segmentedStatements, setSegmentedStatements] =
    useState<SegmentedText[]>();

  useEffect(() => {
    if (selectedOption) {
      const document = resourcesWithDocuments.find(
        (r) => r.reference.id === selectedOption.value
      )?.document;

      if (document) {
        const sentences = document.content.replace(/<[^>]+>/g, "").split(".");
        sentences.pop();
        const sentencesWithDot = sentences.map((sentence) => {
          return { text: sentence.trim() + "." };
        });

        setSegmentedStatements(sentencesWithDot);
      }
    }
  }, [selectedOption]);

  const { entities } = managedTerritory;

  const arrayOfDocReference = resourcesWithDocuments
    .filter((obj) => obj.document !== false)
    .map((obj) => {
      return {
        id: obj.reference.id,
        document: obj.document,
        entity: entities[obj.reference.resource],
      };
    });

  const columns: Column<SegmentedText>[] = useMemo(() => {
    return [
      {
        Header: "",
        id: "Statement",
        Cell: ({ row }: CellType) => {
          return (
            <>
              {user ? (
                <div style={{ display: "grid", width: "fit-content" }}>
                  <EntityTag
                    entity={CEntity(
                      user?.options,
                      EntityEnums.Class.Statement,
                      row.original.text
                    )}
                    fullWidth
                    tooltipText={row.original.text}
                    disableDrag
                    disableDoubleClick
                    disableTooltipFetch
                  />
                </div>
              ) : (
                <></>
              )}
            </>
          );
        },
      },
      {
        Header: "",
        id: "buttons",
        Cell: ({ row }: CellType) => {
          return (
            <ButtonGroup>
              <Button
                icon={<FaTrashAlt />}
                color="danger"
                onClick={() => {
                  const newArray = segmentedStatements?.slice();
                  newArray?.splice(row.index, 1);
                  setSegmentedStatements(newArray);
                }}
              />
              <Button icon={<AiOutlineFileSearch />} color="warning" />
            </ButtonGroup>
          );
        },
      },
    ];
  }, [segmentedStatements]);

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
        <div>
          Resource
          <Dropdown
            width={200}
            onChange={(selectedOption) => setSelectedOption(selectedOption[0])}
            value={selectedOption}
            options={arrayOfDocReference.map((obj) => {
              return { value: obj.id, label: obj.entity.label };
            })}
          />
          <Button
            label="Apply segmentation"
            icon={<TfiLayoutAccordionList />}
          />
        </div>
        {segmentedStatements && (
          <Table perPage={10} data={segmentedStatements} columns={columns} />
        )}
      </ModalContent>
      <ModalFooter>
        <Button color="warning" label="Close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  );
};
