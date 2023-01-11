import { languageDict, userRoleDict } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
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
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useMemo, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import {
  notifyManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
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
    value: EntityEnums.Language;
  } | null;
  searchLanguages:
    | (
        | {
            label: string;
            value: EntityEnums.Language;
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

  const handleResetPassword = async () => {
    const resetRes = await api.resetMyPassword();
    if (resetRes.status == 200) {
      toast.success(
        `an email with a new pre-generated password has been sent to ${user.email}`
      );
    }
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
          defaultLanguage:
            data.defaultLanguage?.value || EntityEnums.Language.Empty,
          searchLanguages: data.searchLanguages?.map((sL) => sL?.value),
          defaultTerritory: data.defaultTerritory,
        },
      });
    }
  };

  const readRights = useMemo(
    () => rights.filter((r) => r.mode === UserEnums.RoleMode.Read),
    [rights]
  );
  const writeRights = useMemo(
    () => rights.filter((r) => r.mode === UserEnums.RoleMode.Write),
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
                  (lang) => lang.value !== EntityEnums.Language.Empty
                )}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"default territory"}</ModalInputLabel>
            <ModalInputWrap width={165}>
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
                        handleChange("defaultTerritory", "");
                      }}
                    />
                  }
                />
              ) : (
                <div>
                  <EntitySuggester
                    categoryTypes={[EntityEnums.Class.Territory]}
                    onSelected={(selected: string) =>
                      handleChange("defaultTerritory", selected)
                    }
                    inputWidth={104}
                    disableTemplatesAccept
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
                {role !== UserEnums.Role.Admin
                  ? readRights.map((right, key) => (
                      <UserRightItem key={key} territoryId={right.territory} />
                    ))
                  : "all"}
              </StyledRightsWrap>
            </StyledUserRightItem>
            <StyledUserRightHeading>{"write"}</StyledUserRightHeading>
            <StyledUserRightItem>
              <StyledRightsWrap>
                {role !== UserEnums.Role.Admin
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
              key="reset-password"
              label="Reset password"
              tooltipLabel={`Generate a new password and send it to ${user.email}`}
              color="info"
              onClick={() => handleResetPassword()}
            />
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
