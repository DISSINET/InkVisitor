import { languageDict, userRoleDict } from "@shared/dictionaries";
import { EntityClass, Language, UserRole, UserRoleMode } from "@shared/enums";
import { IResponseUser } from "@shared/types";
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
  Tag,
} from "components";
import React, { useMemo, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { EntitySuggester } from "..";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import {
  StyledRightsHeading,
  StyledRightsWrap,
  StyledUserRightHeading,
  StyledUserRightItem,
  StyledUserRights,
} from "./UserCustomizationModalStyles";
import { UserRightItem } from "./UserRightItem/UserRightItem";

interface DataObject {
  name: string;
  email: string;
  defaultLanguage: {
    label: string;
    value: Language;
  } | null;
  searchLanguages:
    | (
        | {
            label: string;
            value: Language;
          }
        | undefined
      )[]
    | null;
  defaultTerritory: string | null;
}
interface UserCustomizationModal {
  user: IResponseUser;
  onClose?: () => void;
}
export const UserCustomizationModal: React.FC<UserCustomizationModal> = ({
  user,
  onClose = () => {},
}) => {
  const { options, name, email, role, rights } = useMemo(() => user, [user]);

  const initialValues = useMemo(() => {
    const defaultLanguageObject = languageDict.find(
      (i: any) => i.value === options.defaultLanguage
    );
    const searchLanguagesObject = options.searchLanguages.map((sL) => {
      return languageDict.find((i: any) => i.value === sL);
    });

    return {
      name: name,
      email: email,
      defaultLanguage: defaultLanguageObject ? defaultLanguageObject : null,
      searchLanguages:
        searchLanguagesObject.length > 0 ? searchLanguagesObject : null,
      defaultTerritory: options.defaultTerritory,
    };
  }, [user]);

  const [data, setData] = useState<DataObject>(initialValues);

  const handleChange = (
    key: string,
    value: string | false | ValueType<OptionTypeBase, any>
  ) => {
    setData({
      ...data,
      [key]: value,
    });
  };

  const {
    status,
    data: territory,
    error,
    isFetching,
  } = useQuery(
    ["territory", data.defaultTerritory],
    async () => {
      if (data.defaultTerritory) {
        const res = await api.territoryGet(data.defaultTerritory);
        return res.data;
      }
    },
    {
      enabled: !!data.defaultTerritory && api.isLoggedIn(),
    }
  );

  const queryClient = useQueryClient();

  const updateUserMutation = useMutation(
    async (changes: any) => await api.usersUpdate(user.id, changes),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["user"]);
        toast.info("User updated!");
        onClose();
      },
    }
  );

  const handleSubmit = () => {
    if (JSON.stringify(data) !== JSON.stringify(initialValues)) {
      updateUserMutation.mutate({
        name: data.name,
        email: data.email,
        options: {
          defaultLanguage: data.defaultLanguage?.value || Language.Empty,
          searchLanguages: data.searchLanguages?.map((sL) => sL?.value),
          defaultTerritory: data.defaultTerritory,
        },
      });
    }
  };

  const readRights = useMemo(
    () => rights.filter((r) => r.mode === UserRoleMode.Read),
    [rights]
  );
  const writeRights = useMemo(
    () => rights.filter((r) => r.mode === UserRoleMode.Write),
    [rights]
  );

  return (
    <div>
      <Modal
        showModal={true}
        width="thin"
        onEnterPress={() => handleSubmit()}
        onClose={() => onClose()}
      >
        <ModalHeader title="User customization" />
        <ModalContent column>
          <ModalInputForm>
            <ModalInputLabel>{"name"}</ModalInputLabel>
            <ModalInputWrap width={165}>
              <Input
                width="full"
                changeOnType
                value={name}
                onChangeFn={(value: string) => handleChange("name", value)}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"email"}</ModalInputLabel>
            <ModalInputWrap width={165}>
              <Input
                width="full"
                changeOnType
                value={email}
                onChangeFn={(value: string) => handleChange("email", value)}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"default language"}</ModalInputLabel>
            <ModalInputWrap width={165}>
              <Dropdown
                width="full"
                value={data.defaultLanguage}
                onChange={(selectedOption) =>
                  handleChange("defaultLanguage", selectedOption)
                }
                options={languageDict}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"search languages"}</ModalInputLabel>
            <ModalInputWrap width={165}>
              <Dropdown
                value={data.searchLanguages}
                width="full"
                isMulti
                onChange={(selectedOption) =>
                  handleChange("searchLanguages", selectedOption)
                }
                options={languageDict.filter(
                  (lang) => lang.value !== Language.Empty
                )}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"default territory"}</ModalInputLabel>
            <ModalInputWrap width={165}>
              {territory ? (
                <Tag
                  propId={territory.id}
                  label={territory.label}
                  category={territory.class}
                  tooltipPosition={"left center"}
                  button={
                    <Button
                      key="d"
                      icon={<FaUnlink />}
                      color="danger"
                      inverted={true}
                      tooltip="unlink actant"
                      onClick={() => {
                        handleChange("defaultTerritory", "");
                      }}
                    />
                  }
                />
              ) : (
                <div>
                  <EntitySuggester
                    categoryTypes={[EntityClass.Territory]}
                    onSelected={(selected: any) =>
                      handleChange("defaultTerritory", selected)
                    }
                    inputWidth={104}
                  />
                </div>
              )}
            </ModalInputWrap>
          </ModalInputForm>

          <StyledRightsHeading>
            <b>{"User rights"}</b>
          </StyledRightsHeading>
          <StyledUserRights>
            <StyledUserRightHeading>{"role"}</StyledUserRightHeading>
            <StyledUserRightItem>
              <div>
                <AttributeButtonGroup
                  disabled
                  options={[
                    {
                      longValue: userRoleDict[0].label,
                      shortValue: userRoleDict[0].label,
                      selected: role === userRoleDict[0].value,
                      onClick: () => {},
                    },
                    {
                      longValue: userRoleDict[1].label,
                      shortValue: userRoleDict[1].label,
                      selected: role === userRoleDict[1].value,
                      onClick: () => {},
                    },
                    {
                      longValue: userRoleDict[2].label,
                      shortValue: userRoleDict[2].label,
                      selected: role === userRoleDict[2].value,
                      onClick: () => {},
                    },
                  ]}
                />
              </div>
            </StyledUserRightItem>
            <StyledUserRightHeading>{"read"}</StyledUserRightHeading>
            <StyledUserRightItem>
              <StyledRightsWrap>
                {role !== UserRole.Admin
                  ? readRights.map((right, key) => (
                      <UserRightItem key={key} territoryId={right.territory} />
                    ))
                  : "all"}
              </StyledRightsWrap>
            </StyledUserRightItem>
            <StyledUserRightHeading>{"write"}</StyledUserRightHeading>
            <StyledUserRightItem>
              <StyledRightsWrap>
                {role !== UserRole.Admin
                  ? writeRights.map((right, key) => (
                      <UserRightItem key={key} territoryId={right.territory} />
                    ))
                  : "all"}
              </StyledRightsWrap>
            </StyledUserRightItem>
          </StyledUserRights>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="warning"
              onClick={() => {
                onClose();
              }}
            />
            <Button
              disabled={JSON.stringify(data) === JSON.stringify(initialValues)}
              key="submit"
              label="Submit"
              color="primary"
              onClick={() => handleSubmit()}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </div>
  );
};
