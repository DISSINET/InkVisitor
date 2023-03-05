import { languageDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IOption } from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useQuery } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { classesEditorActants } from "types";

interface NewEntityModal {
  closeModal: () => void;
}
export const NewEntityModal: React.FC<NewEntityModal> = ({ closeModal }) => {
  const [detailTyped, setDetailTyped] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<any>(false);
  const [selectedCategory, setSelectedCategory] = useState<IOption>({
    value: "*",
    label: "*",
  });
  const [territoryId, setTerritoryId] = useState<string>("");

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
      } else {
        return false;
      }
    },
    { enabled: !!userId && api.isLoggedIn() }
  );

  useEffect(() => {
    if (user) {
      setSelectedLanguage(user.options.defaultLanguage);
    }
  }, [user]);

  const {
    status,
    data: territory,
    error,
    isFetching,
  } = useQuery(
    ["territory", territoryId],
    async () => {
      if (territoryId) {
        const res = await api.territoryGet(territoryId);
        return res.data;
      }
    },
    {
      enabled: !!territoryId && api.isLoggedIn(),
    }
  );

  return (
    <Modal showModal width="thin">
      <ModalHeader title="Create entity" />
      <ModalContent>
        <ModalInputForm>
          <ModalInputLabel>{"Entity type: "}</ModalInputLabel>
          <ModalInputWrap>
            <EntitySuggester
              categoryTypes={classesEditorActants}
              onSelected={() => console.log("cannot select")}
              onChangeCategory={(
                selectedOption: ValueType<OptionTypeBase, any>
              ) => {
                if (selectedOption)
                  setSelectedCategory(selectedOption as IOption);
              }}
            />
          </ModalInputWrap>
          <ModalInputLabel>{"Detail: "}</ModalInputLabel>
          <ModalInputWrap>
            <Input
              value={detailTyped}
              onChangeFn={(newType: string) => setDetailTyped(newType)}
              changeOnType
            />
          </ModalInputWrap>
          <ModalInputLabel>{"Language: "}</ModalInputLabel>
          <ModalInputWrap>
            <Dropdown
              isMulti={false}
              width="full"
              options={languageDict}
              value={languageDict.find(
                (i: any) => i.value === selectedLanguage
              )}
              onChange={(newValue: any) => {
                setSelectedLanguage(newValue.value);
              }}
            />
          </ModalInputWrap>
          {/* Suggester territory */}
          {(selectedCategory.value === "T" ||
            selectedCategory.value === "S") && (
            <>
              <ModalInputLabel>
                {selectedCategory.value === "T"
                  ? "Parent territory: "
                  : "Territory: "}
              </ModalInputLabel>
              <ModalInputWrap>
                {territory ? (
                  <EntityTag
                    entity={territory}
                    tooltipPosition="left"
                    button={
                      <Button
                        key="d"
                        icon={<FaUnlink />}
                        color="danger"
                        inverted
                        tooltipLabel="unlink actant"
                        onClick={() => {
                          setTerritoryId("");
                        }}
                      />
                    }
                  />
                ) : (
                  <EntitySuggester
                    disableTemplatesAccept
                    filterEditorRights
                    inputWidth={96}
                    disableCreate
                    categoryTypes={[EntityEnums.Class.Territory]}
                    onSelected={(newSelectedId: string) => {
                      setTerritoryId(newSelectedId);
                    }}
                  />
                )}
              </ModalInputWrap>
            </>
          )}
        </ModalInputForm>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="cancel"
            label="Cancel"
            color="greyer"
            inverted
            onClick={() => closeModal()}
          />
          <Button
            key="submit"
            label="Create"
            color="info"
            onClick={() => {
              // if (selectedCategory.value === "S" && !territoryId) {
              //   toast.warning("Territory is required!");
              // } else if (
              //   selectedCategory.value === "T" &&
              //   !territoryId &&
              //   userRole !== UserEnums.Role.Admin
              // ) {
              //   toast.warning("Parent territory is required!");
              // } else {
              //   handleCreateActant();
              //   closeModal();
              // }
            }}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
