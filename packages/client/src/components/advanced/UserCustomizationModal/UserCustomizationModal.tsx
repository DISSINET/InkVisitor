import { languageDict, userRoleDict } from "@shared/dictionaries";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IResponseUser } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "components";
import Dropdown, {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
import { BiHide, BiShow } from "react-icons/bi";
import { toast } from "react-toastify";
import { DropdownItem } from "types";
import {
  StyledButtonWrap,
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
  defaultLanguage: EntityEnums.Language;
  defaultStatementLanguage: EntityEnums.Language;
  searchLanguages: EntityEnums.Language[];
  defaultTerritory?: string | null;
  hideStatementElementsOrderTable?: boolean;
}
interface UserCustomizationModal {
  user: IResponseUser;
  onClose?: () => void;
}
export const UserCustomizationModal: React.FC<UserCustomizationModal> = ({
  user,
  onClose = () => {},
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const initialValues: DataObject = useMemo(() => {
    const { options, name, email } = user;

    // const defaultLanguageObject =
    //   languageDict.find((i) => i.value === options.defaultLanguage) ??
    //   {label: , value: EntityEnums.Language.Empty};
    // const defaultStatementLanguageObject =
    //   languageDict.find((i) => i.value === options.defaultStatementLanguage) ??
    //   {label: , value: EntityEnums.Language.Empty};
    // const searchLanguagesObject = options.searchLanguages.map((sL) => {
    //   return languageDict.find((i) => i.value === sL);
    // });

    return {
      name: name,
      email: email,
      defaultLanguage: options.defaultLanguage ?? EntityEnums.Language.Empty,
      defaultStatementLanguage:
        options.defaultStatementLanguage ?? EntityEnums.Language.Empty,
      searchLanguages: options.searchLanguages,
      defaultTerritory: options.defaultTerritory,
      hideStatementElementsOrderTable: options.hideStatementElementsOrderTable,
    };
  }, [user]);

  const [data, setData] = useState<DataObject>(initialValues);

  useEffect(() => {
    setData(initialValues);
  }, [initialValues]);

  const handleChange = (
    key: string,
    value: string | true | false | DropdownItem
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

  const passwordUpdateMutation = useMutation({
    mutationFn: async () => await api.updatePassword("me", newPassword),
    onSuccess: () => {
      toast.info("Password changed");
    },
  });

  const {
    status,
    data: territory,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["territory", data.defaultTerritory],
    queryFn: async () => {
      if (data.defaultTerritory) {
        const res = await api.territoryGet(data.defaultTerritory);
        return res.data;
      }
    },
    enabled: !!data.defaultTerritory && api.isLoggedIn(),
  });

  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: async (changes: any) => await api.usersUpdate(user.id, changes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.info("User updated!");
      //onClose();
    },
  });

  const handleSubmit = () => {
    if (JSON.stringify(data) !== JSON.stringify(initialValues)) {
      updateUserMutation.mutate({
        name: data.name,
        email: data.email,
        options: {
          defaultLanguage: data.defaultLanguage,
          defaultStatementLanguage: data.defaultStatementLanguage,
          searchLanguages: data.searchLanguages.map((sL) => sL),
          defaultTerritory: data.defaultTerritory,
          hideStatementElementsOrderTable: data.hideStatementElementsOrderTable,
        },
      });
    }
  };

  const { role, rights } = user;
  const { name, email, defaultLanguage, defaultStatementLanguage } = data;

  const readRights = useMemo(
    () => rights.filter((r) => r.mode === UserEnums.RoleMode.Read),
    [rights]
  );
  const writeRights = useMemo(
    () => rights.filter((r) => r.mode === UserEnums.RoleMode.Write),
    [rights]
  );

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  return (
    <div>
      <Modal
        showModal={showModal}
        width="auto"
        onEnterPress={handleSubmit}
        onClose={onClose}
      >
        <ModalHeader title="User customization" />
        <ModalContent column enableScroll>
          <div style={{ position: "relative" }}>
            <StyledRightsHeading>
              <b>{"User information"}</b>
            </StyledRightsHeading>
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
            </ModalInputForm>

            {!showPasswordChange && (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <Button
                  label="change password"
                  noBorder
                  color="warning"
                  inverted
                  noBackground
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                />
              </div>
            )}

            {showPasswordChange && (
              <>
                <StyledRightsHeading>
                  <b>{"Change password"}</b>
                </StyledRightsHeading>

                <ModalInputForm>
                  <ModalInputLabel>{"new password"}</ModalInputLabel>
                  <ModalInputWrap width={165}>
                    <Input
                      type="password"
                      width="full"
                      changeOnType
                      value={newPassword}
                      onChangeFn={(value: string) => setNewPassword(value)}
                    />
                  </ModalInputWrap>
                  <ModalInputLabel>{"repeat password"}</ModalInputLabel>
                  <ModalInputWrap width={165}>
                    <Input
                      type="password"
                      width="full"
                      changeOnType
                      value={repeatPassword}
                      onChangeFn={(value: string) => setRepeatPassword(value)}
                    />
                  </ModalInputWrap>
                </ModalInputForm>

                <StyledButtonWrap>
                  <ButtonGroup>
                    <Button
                      color="warning"
                      label="Cancel"
                      inverted
                      onClick={() => {
                        setShowPasswordChange(false);
                        setNewPassword("");
                        setRepeatPassword("");
                      }}
                    />
                    <Button
                      color="danger"
                      label="Submit"
                      inverted
                      onClick={() => {
                        if (newPassword.length >= 8) {
                          if (newPassword === repeatPassword) {
                            passwordUpdateMutation.mutate();
                            setShowPasswordChange(false);
                            setNewPassword("");
                            setRepeatPassword("");
                          } else {
                            toast.warning("Passwords are not matching");
                          }
                        } else {
                          toast.info("Fill at least 8 characters");
                        }
                      }}
                    />
                  </ButtonGroup>
                </StyledButtonWrap>
              </>
            )}

            <StyledRightsHeading>
              <b>{"Customization"}</b>
            </StyledRightsHeading>

            <ModalInputForm>
              <ModalInputLabel>{"default language"}</ModalInputLabel>
              <ModalInputWrap width={165}>
                <Dropdown.Single.Basic
                  width="full"
                  value={defaultLanguage}
                  onChange={(newValue) =>
                    handleChange("defaultLanguage", newValue)
                  }
                  options={languageDict}
                />
              </ModalInputWrap>
              <ModalInputLabel>{"statement language"}</ModalInputLabel>
              <ModalInputWrap width={165}>
                <Dropdown.Single.Basic
                  width="full"
                  value={defaultStatementLanguage}
                  onChange={(newValue) =>
                    handleChange("defaultStatementLanguage", newValue)
                  }
                  options={languageDict}
                />
              </ModalInputWrap>

              {/* NOT USED NOW */}
              {/* <ModalInputLabel>{"search languages"}</ModalInputLabel>
                <ModalInputWrap width={165}>
                  <Dropdown.Multi.Attribute
                    value={data.searchLanguages}
                    width="full"
                    onChange={(selectedOption) =>
                      handleChange("searchLanguages", selectedOption)
                    }
                    options={languageDict.filter(
                      (lang) => lang.value !== EntityEnums.Language.Empty
                    )}
                  />
                </ModalInputWrap> */}

              <ModalInputLabel>{"default territory"}</ModalInputLabel>
              <ModalInputWrap width={165}>
                {territory ? (
                  <EntityTag
                    entity={territory}
                    tooltipPosition="left"
                    unlinkButton={{
                      onClick: () => {
                        handleChange("defaultTerritory", "");
                      },
                      color: "danger",
                    }}
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

              <ModalInputLabel>{"ordering table in Editor"}</ModalInputLabel>

              <ModalInputWrap width={165}>
                <AttributeButtonGroup
                  noMargin
                  options={[
                    {
                      longValue: "display",
                      shortValue: "",
                      shortIcon: <BiShow />,
                      onClick: () => {
                        handleChange("hideStatementElementsOrderTable", true);
                      },
                      selected:
                        !!data.hideStatementElementsOrderTable &&
                        data.hideStatementElementsOrderTable,
                    },
                    {
                      longValue: "hide",
                      shortValue: "",
                      shortIcon: <BiHide />,
                      onClick: () => {
                        handleChange("hideStatementElementsOrderTable", false);
                      },
                      selected: !data.hideStatementElementsOrderTable,
                    },
                  ]}
                />
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
                        <UserRightItem
                          key={key}
                          territoryId={right.territory}
                        />
                      ))
                    : "all"}
                </StyledRightsWrap>
              </StyledUserRightItem>
              <StyledUserRightHeading>{"write"}</StyledUserRightHeading>
              <StyledUserRightItem>
                <StyledRightsWrap>
                  {role !== UserEnums.Role.Admin
                    ? writeRights.map((right, key) => (
                        <UserRightItem
                          key={key}
                          territoryId={right.territory}
                        />
                      ))
                    : "all"}
                </StyledRightsWrap>
              </StyledUserRightItem>
            </StyledUserRights>

            <Loader show={passwordUpdateMutation.isPending} />
          </div>
        </ModalContent>

        <ModalFooter>
          <ButtonGroup>
            {role === UserEnums.Role.Admin && (
              <Button
                key="reset-password"
                label="Reset password"
                tooltipLabel={`Generate a new password and send it to ${user.email}`}
                color="info"
                onClick={() => handleResetPassword()}
              />
            )}
            <Button
              key="cancel"
              label="Cancel"
              color="warning"
              onClick={onClose}
            />
            <Button
              disabled={JSON.stringify(data) === JSON.stringify(initialValues)}
              key="submit"
              label="Submit"
              color="primary"
              onClick={handleSubmit}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </div>
  );
};
