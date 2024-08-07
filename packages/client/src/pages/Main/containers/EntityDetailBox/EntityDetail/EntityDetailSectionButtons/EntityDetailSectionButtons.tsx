import { IEntity, IProp } from "@shared/types";
import { Button, ButtonGroup } from "components";
import { AttributeButtonGroup, EntitySuggester } from "components/advanced";
import React, { useState } from "react";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { TbReplace } from "react-icons/tb";
import { StyledSectionButtonsBorder } from "./EntityDetailSectionButtonsStyles";
import { classesAll } from "@shared/dictionaries/entity";

interface EntityDetailSectionButtons {
  props: IProp[];
  setShowSubmit: (value: React.SetStateAction<boolean>) => void;
  entityId: string;
  handleCopyFromEntity: (pickedEntity: IEntity, replace: boolean) => void;
}
export const EntityDetailSectionButtons: React.FC<
  EntityDetailSectionButtons
> = ({ props, setShowSubmit, entityId, handleCopyFromEntity }) => {
  const [replaceSection, setReplaceSection] = useState(false);

  return (
    <>
      <ButtonGroup
        height={19}
        style={{ marginLeft: "0.5rem", marginRight: "1rem" }}
      >
        <Button
          disabled={!props.length}
          icon={<FaTrashAlt />}
          inverted
          color="danger"
          tooltipLabel={`remove all metaprops from entity`}
          onClick={() => setShowSubmit(true)}
        />
        <StyledSectionButtonsBorder />
        <AttributeButtonGroup
          options={[
            {
              longValue: "append",
              shortValue: "",
              onClick: () => setReplaceSection(false),
              selected: !replaceSection,
              shortIcon: <FaPlus />,
            },
            {
              longValue: "replace",
              shortValue: "",
              onClick: () => setReplaceSection(true),
              selected: replaceSection,
              shortIcon: <TbReplace />,
            },
          ]}
        />
      </ButtonGroup>
      <EntitySuggester
        categoryTypes={classesAll}
        onPicked={(entity: IEntity) =>
          handleCopyFromEntity(entity, replaceSection)
        }
        excludedActantIds={[entityId]}
        disableTemplatesAccept
        disableCreate
        inputWidth={90}
        placeholder="another Entity"
      />
    </>
  );
};
