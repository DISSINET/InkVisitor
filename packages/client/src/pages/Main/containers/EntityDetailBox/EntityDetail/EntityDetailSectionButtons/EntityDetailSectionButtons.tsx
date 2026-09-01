import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import { AttributeButtonGroup, EntitySuggester } from "components/advanced";
import React, { useState } from "react";
import { MdDeleteSweep } from "react-icons/md";
import { TbReplace } from "react-icons/tb";
import {
  StyledSectionButtonsBorder,
  StyledSectionButtonsGroup,
} from "./EntityDetailSectionButtonsStyles";
import { IcoPlus } from "Theme/icons";

interface EntityDetailSectionButtons {
  setShowSubmit: (value: React.SetStateAction<boolean>) => void;
  entityId: string;
  handleCopyFromEntity: (pickedEntity: IEntity, replace: boolean) => void;
  suggesterCategoryTypes?: EntityEnums.Class[];
  removeBtnTooltip: string;
  removeBtnDisabled: boolean;
  widthTooNarrow?: boolean;
}
export const EntityDetailSectionButtons: React.FC<EntityDetailSectionButtons> = ({
  setShowSubmit,
  entityId,
  handleCopyFromEntity,
  suggesterCategoryTypes = classesAll,
  removeBtnTooltip,
  removeBtnDisabled,
  widthTooNarrow,
}) => {
  const [replaceSection, setReplaceSection] = useState(false);

  return (
    <>
      <StyledSectionButtonsGroup $height={21}>
        <Button
          disabled={removeBtnDisabled}
          icon={<MdDeleteSweep size={18} />}
          inverted
          color="danger"
          tooltipLabel={removeBtnTooltip}
          onClick={() => setShowSubmit(true)}
        />
        <StyledSectionButtonsBorder $rightMargin={widthTooNarrow} />
        <AttributeButtonGroup
          iconsOnly={widthTooNarrow}
          noMargin={widthTooNarrow}
          options={[
            {
              longValue: "append",
              shortValue: "",
              onClick: () => setReplaceSection(false),
              selected: !replaceSection,
              icon: widthTooNarrow ? <IcoPlus /> : undefined,
              shortIcon: <IcoPlus />,
            },
            {
              longValue: "replace",
              shortValue: "",
              onClick: () => setReplaceSection(true),
              selected: replaceSection,
              icon: widthTooNarrow ? <TbReplace /> : undefined,
              shortIcon: <TbReplace />,
            },
          ]}
        />
      </StyledSectionButtonsGroup>
      <EntitySuggester
        categoryTypes={suggesterCategoryTypes}
        onPicked={(entity: IEntity) => handleCopyFromEntity(entity, replaceSection)}
        excludedActantIds={[entityId]}
        disableCreate
        inputWidth={widthTooNarrow ? "full" : 78}
        placeholder="another entity"
        disableTemplateInstantiation
      />
    </>
  );
};
