import { languageDict, userRoleDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { DropdownItem, IResponseUser, IUser } from "@inkvisitor/shared/types";
import { UnsafePasswordError } from "@inkvisitor/shared/types/errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SAFE_PASSWORD_DESCRIPTION } from "Theme/constants";
import { IcoSettings, IcoShield, IcoUserAlt } from "Theme/icons";
import api from "api";
import {
  Button,
  ButtonGroup,
  CancelButton,
  IconWithTooltip,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  Toggle,
} from "components";
import Dropdown, { AttributeButtonGroup, EntitySuggester, EntityTag } from "components/advanced";
import { useOrderedLanguageDict } from "hooks/react-query";
import { StyledDescription } from "pages/AuthModalSharedStyles";
import React, { useEffect, useMemo, useState } from "react";
import { FaQuestion } from "react-icons/fa";
import { toast } from "react-toastify";
import { isSafePassword } from "utils/utils";
import {
  StyledFieldControl,
  StyledFieldGrid,
  StyledFieldHelp,
  StyledFieldLabel,
  StyledFieldSpan,
  StyledInlineAction,
  StyledRightsGrid,
  StyledRightsLabel,
  StyledRightsWrap,
  StyledSectionTitle,
  StyledSectionTitleIcon,
  StyledUserCustomization,
  StyledUserCustomizationSection,
} from "./UserCustomizationModalStyles";
import { UserRightItem } from "./UserRightItem/UserRightItem";

interface DataObject {
  name: string;
  email: string;
  defaultLanguage: EntityEnums.Language;
  defaultStatementLanguage: EntityEnums.Language;
  searchLanguages: EntityEnums.Language[];
  workingLanguages: EntityEnums.Language[];
  defaultTerritory?: string | null;
  askBeforePropDelete: boolean;
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

  // captured once on mount on purpose - the user query can refetch while the
  // modal is open (window focus, invalidations) and deliver a new object
  // reference; recomputing here would reset the form and wipe unsaved edits
  const [initialValues] = useState<DataObject>(() => {
    const { options, name, email } = user;

    return {
      name: name,
      email: email,
      defaultLanguage: options.defaultLanguage ?? EntityEnums.Language.Empty,
      defaultStatementLanguage: options.defaultStatementLanguage ?? EntityEnums.Language.Empty,
      searchLanguages: options.searchLanguages ?? [],
      workingLanguages: options.workingLanguages ?? [],
      defaultTerritory: options.defaultTerritory,
      askBeforePropDelete: options.askBeforePropDelete !== false,
    };
  });

  const [data, setData] = useState<DataObject>(initialValues);

  const orderedLanguageDict = useOrderedLanguageDict();

  const handleChange = (key: string, value: string | true | false | DropdownItem) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const passwordUpdateMutation = useMutation({
    mutationFn: async () => await api.updatePassword("me", newPassword),
    onSuccess: () => {
      toast.info("Password changed");
    },
  });

  const queryClient = useQueryClient();

  const { data: defaultTerritory } = useQuery({
    queryKey: ["territory", data.defaultTerritory],
    queryFn: async () => {
      const res = await api.entityGet(data.defaultTerritory as string);
      return res.data ?? null;
    },
    enabled: !!data.defaultTerritory && api.isLoggedIn(),
  });

  const updateUserMutation = useMutation({
    mutationFn: async (changes: Partial<IUser>) => await api.usersUpdate(user.id, changes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.info("User updated!");
      onClose();
    },
    onError: (err) => {
      toast.error("User not updated");
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
          workingLanguages: data.workingLanguages.map((wL) => wL),
          defaultTerritory: data.defaultTerritory || "",
          askBeforePropDelete: data.askBeforePropDelete,
        },
      });
    }
  };

  const { role, rights } = user;
  const { name, email, defaultLanguage, defaultStatementLanguage } = data;

  const readRights = useMemo(
    () => rights.filter((r) => r.mode === UserEnums.RoleMode.Read),
    [rights],
  );
  const writeRights = useMemo(
    () => rights.filter((r) => r.mode === UserEnums.RoleMode.Write),
    [rights],
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
        isLoading={updateUserMutation.isPending}
      >
        <ModalContent column enableScroll>
          <StyledUserCustomization>
            <StyledUserCustomizationSection>
              <StyledSectionTitle>
                <StyledSectionTitleIcon>
                  <IcoUserAlt />
                </StyledSectionTitleIcon>
                User information
              </StyledSectionTitle>
              <StyledFieldGrid>
                <StyledFieldLabel>Name</StyledFieldLabel>
                <StyledFieldControl>
                  <Input
                    width="full"
                    changeOnType
                    value={name}
                    onChangeFn={(value: string) => handleChange("name", value)}
                  />
                </StyledFieldControl>
                <StyledFieldHelp />

                <StyledFieldLabel>Email</StyledFieldLabel>
                <StyledFieldControl>
                  <Input
                    width="full"
                    changeOnType
                    value={email}
                    onChangeFn={(value: string) => handleChange("email", value)}
                  />
                </StyledFieldControl>
                <StyledFieldHelp />

                {!showPasswordChange && (
                  <>
                    <StyledFieldLabel />
                    <StyledFieldControl>
                      <StyledInlineAction>
                        <Button
                          label="Change password"
                          noBorder
                          color="success"
                          inverted
                          noBackground
                          onClick={() => setShowPasswordChange(true)}
                        />
                      </StyledInlineAction>
                    </StyledFieldControl>
                    <StyledFieldHelp />
                  </>
                )}

                {showPasswordChange && (
                  <>
                    <StyledFieldLabel>New password</StyledFieldLabel>
                    <StyledFieldControl>
                      <Input
                        type="password"
                        width="full"
                        changeOnType
                        value={newPassword}
                        onChangeFn={(value: string) => setNewPassword(value)}
                      />
                    </StyledFieldControl>
                    <StyledFieldHelp />

                    <StyledFieldLabel>Repeat password</StyledFieldLabel>
                    <StyledFieldControl>
                      <Input
                        type="password"
                        width="full"
                        changeOnType
                        value={repeatPassword}
                        onChangeFn={(value: string) => setRepeatPassword(value)}
                      />
                    </StyledFieldControl>
                    <StyledFieldHelp />

                    <StyledFieldSpan>
                      <StyledDescription>{SAFE_PASSWORD_DESCRIPTION}</StyledDescription>
                      <ButtonGroup>
                        <CancelButton
                          onClick={() => {
                            setShowPasswordChange(false);
                            setNewPassword("");
                            setRepeatPassword("");
                          }}
                        />
                        <Button
                          color="danger"
                          label="Save password"
                          inverted
                          onClick={() => {
                            if (newPassword.length > 0 && !isSafePassword(newPassword)) {
                              toast.warning(UnsafePasswordError.message);
                            } else {
                              if (newPassword === repeatPassword) {
                                passwordUpdateMutation.mutate();
                                setShowPasswordChange(false);
                                setNewPassword("");
                                setRepeatPassword("");
                              } else {
                                toast.warning("Passwords are not matching");
                              }
                            }
                          }}
                        />
                      </ButtonGroup>
                    </StyledFieldSpan>
                  </>
                )}
              </StyledFieldGrid>
            </StyledUserCustomizationSection>
            <StyledUserCustomizationSection>
              <StyledSectionTitle>
                <StyledSectionTitleIcon>
                  <IcoSettings size={13} />
                </StyledSectionTitleIcon>
                Customization
              </StyledSectionTitle>

              <StyledFieldGrid>
                <StyledFieldLabel>Default label language</StyledFieldLabel>
                <StyledFieldControl>
                  <Dropdown.Single.Basic
                    width="full"
                    value={defaultLanguage}
                    onChange={(newValue) => handleChange("defaultLanguage", newValue)}
                    options={orderedLanguageDict}
                  />
                </StyledFieldControl>
                <StyledFieldHelp>
                  <IconWithTooltip
                    color="success"
                    icon={<FaQuestion />}
                    tooltipLabel="Default language used for labeling entities."
                  />
                </StyledFieldHelp>

                <StyledFieldLabel>Default source language</StyledFieldLabel>
                <StyledFieldControl>
                  <Dropdown.Single.Basic
                    width="full"
                    value={defaultStatementLanguage}
                    onChange={(newValue) => handleChange("defaultStatementLanguage", newValue)}
                    options={orderedLanguageDict}
                  />
                </StyledFieldControl>
                <StyledFieldHelp>
                  <IconWithTooltip
                    color="success"
                    icon={<FaQuestion />}
                    tooltipLabel="Dominant language of the source texts being coded into statements"
                  />
                </StyledFieldHelp>

                <StyledFieldLabel>Working languages</StyledFieldLabel>
                <StyledFieldControl>
                  <Dropdown.Multi.Basic
                    width="full"
                    value={data.workingLanguages}
                    onChange={(selectedOptions) =>
                      setData((prev) => ({
                        ...prev,
                        workingLanguages: selectedOptions as EntityEnums.Language[],
                      }))
                    }
                    options={languageDict.filter(
                      (lang) => lang.value !== EntityEnums.Language.Empty,
                    )}
                  />
                </StyledFieldControl>
                <StyledFieldHelp>
                  <IconWithTooltip
                    color="success"
                    icon={<FaQuestion />}
                    tooltipLabel="Languages you work with. They are shown first in every language dropdown to make them easy to find in the full list."
                  />
                </StyledFieldHelp>

                <StyledFieldLabel>Default territory</StyledFieldLabel>
                <StyledFieldControl>
                  {defaultTerritory ? (
                    <EntityTag
                      entity={defaultTerritory}
                      tooltipPosition="left"
                      unlinkButton={{
                        onClick: () => {
                          setData((prev) => ({ ...prev, defaultTerritory: "" }));
                        },
                        color: "danger",
                      }}
                      fullWidth
                    />
                  ) : (
                    <EntitySuggester
                      categoryTypes={[EntityEnums.Class.Territory]}
                      onPicked={(entity) => {
                        queryClient.setQueryData(["territory", entity.id], entity);
                        setData((prev) => ({ ...prev, defaultTerritory: entity.id }));
                      }}
                      inputWidth="full"
                      disableTemplatesAccept
                    />
                  )}
                </StyledFieldControl>
                <StyledFieldHelp>
                  <IconWithTooltip
                    color="success"
                    icon={<FaQuestion />}
                    tooltipLabel="Territory opened in the tree when InkVisitor is loaded without any parameters in the url. A link that already points to a territory, statement or detail opens that instead."
                  />
                </StyledFieldHelp>

                <StyledFieldLabel>Ask before deleting metaprop with children</StyledFieldLabel>
                <StyledFieldControl>
                  <Toggle
                    value={data.askBeforePropDelete}
                    onChange={(value) => handleChange("askBeforePropDelete", value)}
                    // hideLabels
                  />
                </StyledFieldControl>
                <StyledFieldHelp>
                  <IconWithTooltip
                    color="success"
                    icon={<FaQuestion />}
                    tooltipLabel="Show a confirmation before deleting a metaprop that has child properties, since they would be deleted too."
                  />
                </StyledFieldHelp>
              </StyledFieldGrid>
            </StyledUserCustomizationSection>
            <StyledUserCustomizationSection>
              <StyledSectionTitle>
                <StyledSectionTitleIcon>
                  <IcoShield />
                </StyledSectionTitleIcon>
                User rights
              </StyledSectionTitle>
              <StyledRightsGrid>
                <StyledRightsLabel>Role</StyledRightsLabel>
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
                    {
                      longValue: userRoleDict[3].label,
                      shortValue: userRoleDict[3].label,
                      selected: role === userRoleDict[3].value,
                      onClick: () => {},
                    },
                  ]}
                />

                <StyledRightsLabel>Read</StyledRightsLabel>
                <StyledRightsWrap>
                  {role !== UserEnums.Role.Admin && role !== UserEnums.Role.Owner
                    ? readRights.map((right, key) => (
                        <UserRightItem key={key} territoryId={right.territory} />
                      ))
                    : "all"}
                </StyledRightsWrap>

                <StyledRightsLabel>Write</StyledRightsLabel>
                <StyledRightsWrap>
                  {role !== UserEnums.Role.Admin && role !== UserEnums.Role.Owner
                    ? writeRights.map((right, key) => (
                        <UserRightItem key={key} territoryId={right.territory} />
                      ))
                    : "all"}
                </StyledRightsWrap>
              </StyledRightsGrid>
            </StyledUserCustomizationSection>

            <Loader show={passwordUpdateMutation.isPending} />
          </StyledUserCustomization>
        </ModalContent>

        <ModalFooter spaceBetween={process.env.NODE_ENV === "development"}>
          {process.env.NODE_ENV === "development" && (
            <StyledUserCustomizationSection>
              <div>
                <Button
                  label="Simulate HTML API response"
                  color="primary"
                  noBorder
                  inverted
                  onClick={async () => {
                    const response = await api.devSimulateHtmlError({ ignoreErrorToast: true });
                    console.log("response", response);
                  }}
                />
              </div>
            </StyledUserCustomizationSection>
          )}
          <ButtonGroup>
            <CancelButton key="cancel" onClick={onClose} />
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
