import { languageDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums, SearchEnums } from "@inkvisitor/shared/enums";
import { DropdownItem } from "@inkvisitor/shared/types";
import {
  IRequestSearch,
  IRequestSearchRootValidity,
} from "@inkvisitor/shared/types/request-search";
import { Input, TypeBar } from "components";
import Dropdown, { AttributeButtonGroup } from "components/advanced";
import { useUsersGetMoreQuery } from "hooks/react-query/useUsersGetMoreQuery";
import React, { useCallback, useMemo, useState } from "react";
import { BsShieldExclamation, BsShieldFillCheck, BsShieldShaded } from "react-icons/bs";
import {
  StyledForm,
  StyledRow,
  StyledRowControl,
  StyledRowHeader,
} from "./FloatingSearchFormStyles";

const defaultLanguageOption = {
  label: "any",
  value: "" as EntityEnums.Language,
};
const languageOptions = [defaultLanguageOption].concat(languageDict);

const defaultClassForTypeBar = "" as EntityEnums.Class;

const initSearchValues: IRequestSearch = {
  labelOrId: "",
  isRootInvalid: IRequestSearchRootValidity.Any,
};

export const FloatingSearchForm: React.FC = () => {
  const [searchData, setSearchData] = useState<IRequestSearch>(initSearchValues);

  const { data: users } = useUsersGetMoreQuery({ enabled: true });

  const languageOptionSelected: EntityEnums.Language = useMemo(() => {
    if (searchData.language) {
      return searchData.language;
    }
    return defaultLanguageOption.value;
  }, [searchData.language]);

  const userOptions = useMemo(() => {
    return [{ label: "any", value: "" }].concat(
      users
        ?.filter((user) => user?.id && user?.name)
        .map((user) => ({
          label: user.name,
          value: user.id,
        })) ?? []
    );
  }, [users]);

  const handleChange = useCallback(
    (changes: {
      [key: string]: string | undefined | Date | IRequestSearchRootValidity;
    }) => {
      const newSearch = { ...searchData, ...changes };

      Object.keys(changes).forEach((changeKey) => {
        if (changes[changeKey] === undefined) {
          delete (newSearch as Record<string, unknown>)[changeKey];
        }
      });

      setSearchData(newSearch);
    },
    [searchData]
  );

  return (
    <StyledForm>
      <StyledRow>
        <StyledRowHeader>{SearchEnums.AdvancedOption.Language}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.Basic
            placeholder=""
            width="full"
            options={languageOptions}
            value={languageOptionSelected}
            onChange={(selectedOption) => {
              handleChange({
                language: selectedOption || undefined,
              });
            }}
          />
          <TypeBar entityLetter={defaultClassForTypeBar} />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{SearchEnums.AdvancedOption.CreatedAt}</StyledRowHeader>
        <StyledRowControl>
          <Input
            type="date"
            width="full"
            value={
              searchData.createdDate
                ? searchData.createdDate.toISOString().split("T")[0]
                : ""
            }
            onChangeFn={(value) => {
              const createdDate = new Date(value);
              if (createdDate && !isNaN(createdDate.getTime())) {
                handleChange({ createdDate });
              } else {
                handleChange({ createdDate: undefined });
              }
            }}
            clearable
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{SearchEnums.AdvancedOption.UpdatedAt}</StyledRowHeader>
        <StyledRowControl>
          <Input
            type="date"
            width="full"
            value={
              searchData.updatedDate
                ? searchData.updatedDate.toISOString().split("T")[0]
                : ""
            }
            onChangeFn={(value) => {
              const updatedDate = new Date(value);
              if (updatedDate && !isNaN(updatedDate.getTime())) {
                handleChange({ updatedDate });
              } else {
                handleChange({ updatedDate: undefined });
              }
            }}
            clearable
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{SearchEnums.AdvancedOption.CreatedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.Basic
            width="full"
            options={userOptions}
            value={searchData.createdBy ?? ""}
            onChange={(value) => {
              handleChange({ createdBy: value || undefined });
            }}
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{SearchEnums.AdvancedOption.UpdatedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.Basic
            width="full"
            options={userOptions}
            value={searchData.updatedBy ?? ""}
            onChange={(value) => {
              handleChange({ updatedBy: value || undefined });
            }}
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{SearchEnums.AdvancedOption.EditedBy}</StyledRowHeader>
        <StyledRowControl>
          <Dropdown.Single.Basic
            width="full"
            options={userOptions}
            value={searchData.editedBy ?? ""}
            onChange={(value) => {
              handleChange({ editedBy: value || undefined });
            }}
          />
        </StyledRowControl>
      </StyledRow>

      <StyledRow>
        <StyledRowHeader>{SearchEnums.AdvancedOption.RootValidity}</StyledRowHeader>
        <StyledRowControl>
          <AttributeButtonGroup
            noMargin
            options={[
              {
                longValue: "Any",
                shortValue: "",
                shortIcon: <BsShieldShaded style={{ margin: "2px 4px" }} />,
                onClick: () => {
                  handleChange({
                    isRootInvalid: IRequestSearchRootValidity.Any,
                  });
                },
                selected:
                  searchData.isRootInvalid === IRequestSearchRootValidity.Any ||
                  searchData.isRootInvalid === undefined ||
                  searchData.isRootInvalid === null,
              },
              {
                longValue: "Valid",
                shortValue: "",
                shortIcon: <BsShieldFillCheck style={{ margin: "2px 4px" }} />,
                onClick: () => {
                  handleChange({
                    isRootInvalid: IRequestSearchRootValidity.Valid,
                  });
                },
                selected:
                  searchData.isRootInvalid === IRequestSearchRootValidity.Valid,
              },
              {
                longValue: "Invalid",
                shortValue: "",
                shortIcon: <BsShieldExclamation style={{ margin: "2px 4px" }} />,
                onClick: () => {
                  handleChange({
                    isRootInvalid: IRequestSearchRootValidity.Invalid,
                  });
                },
                selected:
                  searchData.isRootInvalid === IRequestSearchRootValidity.Invalid,
              },
            ]}
          />
        </StyledRowControl>
      </StyledRow>
    </StyledForm>
  );
};
