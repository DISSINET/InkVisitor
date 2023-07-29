import { EntityEnums } from "@shared/enums";
import {
  IResponseDocument,
  IResponseTerritory,
  IStatement,
} from "@shared/types";
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
import { AttributeButtonGroup, EntityTag } from "components/advanced";
import { CEntity, CStatement } from "constructors";
import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineFileSearch } from "react-icons/ai";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { TbReplace } from "react-icons/tb";
import { TfiLayoutAccordionList } from "react-icons/tfi";
import { CellProps, Column } from "react-table";
import { DropdownItem, ResourceWithDocument } from "types";
import { extractTextBetweenTags } from "utils";
import {
  StyledHeaderRow,
  StyledHeading,
} from "./SegmentateReferencesModalStyles";
import { HiMiniBarsArrowUp } from "react-icons/hi2";

type CellType = CellProps<IStatement>;

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

  const [segmentedStatements, setSegmentedStatements] = useState<IStatement[]>(
    []
  );

  const handleApplySegmentation = () => {
    if (selectedOption) {
      const document = resourcesWithDocuments.find(
        (r) => r.reference.id === selectedOption.value
      )?.document;

      if (document) {
        const { content } = document;
        const selectedContent = extractTextBetweenTags(
          content,
          managedTerritory.id
        );

        const sentences =
          selectedContent.length > 0
            ? selectedContent[0].replace(/<[^>]+>/g, "").split(".")
            : [];
        sentences.pop();

        const sentencesWithDot = sentences.map(
          (sentence) => sentence.trim() + "."
        );

        if (user) {
          const segmentedObjects = sentencesWithDot.map((sentence) => {
            return CStatement(
              user.role,
              user.options,
              "",
              "",
              undefined,
              sentence
            );
          });
          if (replaceSegmentation) {
            setSegmentedStatements(segmentedObjects);
          } else {
            setSegmentedStatements(
              segmentedStatements.concat(segmentedObjects)
            );
          }
        }
      }
    }
  };

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

  const columns: Column<IStatement>[] = useMemo(() => {
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
                    entity={row.original}
                    fullWidth
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

  const [replaceSegmentation, setReplaceSegmentation] = useState(false);
  const [replaceInsert, setReplaceInsert] = useState(false);

  const handleInsertStatements = () => {};

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
        <StyledHeaderRow>
          <StyledHeading>Resource:</StyledHeading>
          <Dropdown
            width={160}
            onChange={(selectedOption) => setSelectedOption(selectedOption[0])}
            value={selectedOption}
            options={arrayOfDocReference.map((obj) => {
              return { value: obj.id, label: obj.entity.label };
            })}
          />
          <AttributeButtonGroup
            options={[
              {
                longValue: "append",
                shortValue: "",
                onClick: () => setReplaceSegmentation(false),
                selected: !replaceSegmentation,
                shortIcon: <FaPlus />,
              },
              {
                longValue: "replace",
                shortValue: "",
                onClick: () => setReplaceSegmentation(true),
                selected: replaceSegmentation,
                shortIcon: <TbReplace />,
              },
            ]}
          />
          <Button
            label="Apply segmentation"
            icon={<TfiLayoutAccordionList />}
            onClick={handleApplySegmentation}
          />
        </StyledHeaderRow>

        <Table
          perPage={10}
          data={segmentedStatements}
          columns={columns}
          entityTitle={{ singular: "statement", plural: "statements" }}
        />
      </ModalContent>
      <ModalFooter>
        <AttributeButtonGroup
          options={[
            {
              longValue: "append",
              shortValue: "",
              onClick: () => setReplaceInsert(false),
              selected: !replaceInsert,
              shortIcon: <FaPlus />,
            },
            {
              longValue: "replace",
              shortValue: "",
              onClick: () => setReplaceInsert(true),
              selected: replaceInsert,
              shortIcon: <TbReplace />,
            },
          ]}
        />
        <ButtonGroup>
          <Button
            color="primary"
            icon={
              <HiMiniBarsArrowUp
                size={14}
                style={{ transform: "rotate(90deg)" }}
              />
            }
            label="Insert statements"
            onClick={handleInsertStatements}
            disabled={!segmentedStatements?.length}
          />
          <Button color="warning" label="Close" onClick={onClose} />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
