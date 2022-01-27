import { languageDict } from "@shared/dictionaries";
import { ActantType, Language } from "@shared/enums";
import { IResponseUser } from "@shared/types";
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
import React, { useEffect, useMemo, useState } from "react";
import { ValueType, OptionTypeBase } from "react-select";
import { EntitySuggester } from "..";

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

  defaultTerritory: {
    label: string;
    value: Language;
  } | null;
}
interface UserCustomizationModal {
  user: IResponseUser;
  onClose?: () => void;
}
export const UserCustomizationModal: React.FC<UserCustomizationModal> = ({
  user,
  onClose = () => {},
}) => {
  const { options, name, email } = user;

  const initialValues = useMemo(() => {
    // console.log(user);
    const defaultLanguageObject = languageDict.find(
      (i: any) => i.value === options.defaultLanguage
    );
    const searchLanguagesObject = options.searchLanguages.map((sL) => {
      return languageDict.find((i: any) => i.value === sL);
    });
    const defaultTerritoryObject = languageDict.find(
      (i: any) => i.value === options.defaultTerritory
    );

    console.log({
      name: name,
      email: email,
      defaultLanguage: defaultLanguageObject ? defaultLanguageObject : null,
      searchLanguages: searchLanguagesObject ? searchLanguagesObject : null,
      defaultTerritory: defaultTerritoryObject ? defaultTerritoryObject : null,
    });

    return {
      name: name,
      email: email,
      defaultLanguage: defaultLanguageObject ? defaultLanguageObject : null,
      searchLanguages: searchLanguagesObject ? searchLanguagesObject : [],
      defaultTerritory: defaultTerritoryObject ? defaultTerritoryObject : null,
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

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <div>
      <Modal
        showModal={true}
        width="thin"
        // onEnterPress={handleCreateActant}
        onClose={() => onClose()}
      >
        <ModalHeader title="User customization" />
        <ModalContent>
          <ModalInputForm>
            <ModalInputLabel>{"name"}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={name}
                onChangeFn={(value: string) => handleChange("name", value)}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"email"}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={email}
                onChangeFn={(value: string) => handleChange("email", value)}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"default language"}</ModalInputLabel>
            <ModalInputWrap>
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
            <ModalInputWrap>
              <Dropdown
                value={data.searchLanguages}
                width="full"
                isMulti
                onChange={(selectedOption) =>
                  handleChange("searchLanguages", selectedOption)
                }
                options={languageDict}
              />
            </ModalInputWrap>
            <ModalInputLabel>{"default territory"}</ModalInputLabel>
            <ModalInputWrap>
              <EntitySuggester
                categoryTypes={[ActantType.Territory]}
                onSelected={(selected: any) =>
                  handleChange("defaultTerritory", selected)
                }
                inputWidth={71}
              />
            </ModalInputWrap>
          </ModalInputForm>
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
              key="submit"
              label="Submit"
              color="primary"
              onClick={() => {
                console.log("submit");
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </div>
  );
};
