import { Input, IconWithTooltip, Button } from "components";
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { IoStar } from "react-icons/io5";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import {
  StyledAlternativeLabels,
  StyledAlternativeLabelWrap,
  StyledGreyBar,
  StyledAlternativeLabel,
  StyledAlternativeLabelButtons,
  StyledPromoteIcon,
  StyledPromoteIconOutline,
  StyledPromoteIconFilled,
  StyledDangerOnHoverButton,
  StyledAddLabel,
} from "../EntityDetailFormSectionStyles";
import { IResponseGeneric, IEntity, IResponseDetail } from "@inkvisitor/shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

interface EntityDetailFormSectionAlternativeLabels {
  entity: IResponseDetail;
  // local state for the main entity label
  newLabel: string;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any, {}>,
    unknown,
    Partial<IEntity>,
    unknown
  >;
  handlePromoteLabel: (label: string) => void;
  userCanEdit: boolean;
}
export const EntityDetailFormSectionAlternativeLabels: React.FC<
  EntityDetailFormSectionAlternativeLabels
> = ({
  entity,
  newLabel,
  updateEntityMutation,
  handlePromoteLabel,
  userCanEdit,
}) => {
  const [currentlyEditedAltLabel, setCurrentlyEditedAltLabel] = useState<
    false | number
  >(false);
  const [newAltLabel, setNewAltLabel] = useState<string>("");
  const alternativeLabels = entity.labels.slice(1);

  return (
    <>
      <StyledAlternativeLabels>
        {alternativeLabels.map((label, key) => {
          return (
            <StyledAlternativeLabelWrap
              key={key}
              $isEditing={currentlyEditedAltLabel === key}
            >
              <StyledGreyBar />
              <>
                {currentlyEditedAltLabel === key ? (
                  <Input
                    width="full"
                    fullHeight
                    autoFocus
                    value={label}
                    onChangeFn={(value) => {
                      if (value.length < 1) {
                        toast.error("Label cannot be empty");
                        return;
                      }
                      updateEntityMutation.mutate({
                        labels: [
                          newLabel,
                          ...alternativeLabels.map((label, index) =>
                            index === key ? value : label
                          ),
                        ],
                      });
                    }}
                    onBlur={() => {
                      setCurrentlyEditedAltLabel(false);
                    }}
                    allowCtrlEnter
                    showSaveExitIcons
                    onEnterPressFn={() => {
                      setCurrentlyEditedAltLabel(false);
                    }}
                    onEscapePressFn={() => {
                      setCurrentlyEditedAltLabel(false);
                    }}
                  />
                ) : (
                  // grid is used to wrap the label if it is too long (text-overflow: ellipsis doesn't work without the grid)
                  <div style={{ maxWidth: "100%", display: "grid" }}>
                    <StyledAlternativeLabel
                      onClick={() => setCurrentlyEditedAltLabel(key)}
                    >
                      {label}
                    </StyledAlternativeLabel>
                  </div>
                )}
              </>

              {currentlyEditedAltLabel !== key && (
                <StyledAlternativeLabelButtons>
                  <StyledPromoteIcon
                    onClick={() => {
                      handlePromoteLabel(label);
                    }}
                  >
                    <StyledPromoteIconOutline size={12} />
                    <StyledPromoteIconFilled>
                      <IconWithTooltip
                        icon={<IoStar size={12} />}
                        tooltipLabel="Promote label"
                        color="info"
                      />
                    </StyledPromoteIconFilled>
                  </StyledPromoteIcon>

                  <StyledDangerOnHoverButton>
                    <Button
                      inverted
                      noBackground
                      noBorder
                      noPadding
                      onClick={() => {
                        updateEntityMutation.mutate({
                          labels: entity.labels.filter((l) => l !== label),
                        });
                      }}
                      icon={<MdClose size={15} />}
                      tooltipLabel="Remove label"
                    />
                  </StyledDangerOnHoverButton>
                </StyledAlternativeLabelButtons>
              )}
            </StyledAlternativeLabelWrap>
          );
        })}
      </StyledAlternativeLabels>

      <StyledAddLabel $marginTop={entity.labels.length > 1}>
        <Input
          placeholder="add label"
          allowCtrlEnter
          disabled={!userCanEdit}
          changeOnType
          value={newAltLabel}
          onChangeFn={(newLabel: string) => setNewAltLabel(newLabel)}
          onEnterPressFn={() => {
            updateEntityMutation.mutate({
              labels: [...entity.labels, newAltLabel],
            });
            setNewAltLabel("");
          }}
        />
        <span>
          <Button
            disabled={
              newAltLabel.length === 0 || entity.labels.includes(newAltLabel)
            }
            color="black"
            icon={<FaPlus />}
            onClick={() => {
              updateEntityMutation.mutate({
                labels: [...entity.labels, newAltLabel],
              });
              setNewAltLabel("");
            }}
          />
        </span>
      </StyledAddLabel>
    </>
  );
};
