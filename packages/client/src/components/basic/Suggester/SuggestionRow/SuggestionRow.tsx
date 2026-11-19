import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseEntity } from "@inkvisitor/shared/types";
import { Button, ButtonGroup } from "components";
import { EntityTag } from "components/advanced";
import { FaLink, FaPlusSquare } from "react-icons/fa";
import { EntitySuggestion, SUGGESTION_ICON_KINDS } from "types";
import {
  StyledSuggestionLineActions,
  StyledSuggestionLineIcon,
  StyledSuggestionLineIcons,
  StyledSuggestionLineTag,
  StyledSuggestionRow,
  StyledTagWrapper,
} from "../SuggesterStyles";

export type SuggestionRowEntityItemData = {
  items: EntitySuggestion[];
};

interface SuggestionRowEntityProps {
  data: SuggestionRowEntityItemData;
  index: number;
  style: any;
  selected: number;
  isInsideTemplate: boolean;
  territoryParentId: string | undefined;
  disableButtons: boolean;
  disableTemplateInstantiation: boolean;
  onPick: (entity: IEntity, duplicate?: boolean) => void;
}

export const SuggestionRowEntityRow: React.FC<SuggestionRowEntityProps> = ({
  data,
  index,
  style,
  selected,
  isInsideTemplate,
  territoryParentId,
  disableButtons,
  disableTemplateInstantiation,
  onPick,
}) => {
  const { items } = data;
  const { entity, icons } = items[index];
  const isNotDiscouraged = entity.status !== EntityEnums.Status.Discouraged;
  const territoryWithoutParent = entity.class === EntityEnums.Class.Territory && !territoryParentId;

  const renderIcons = () => {
    return (
      <ButtonGroup
        $gap="no"
        onMouseDown={(e) => {
          // Prevent input blur when clicking buttons
          e.preventDefault();
        }}
      >
        {!entity.isTemplate && (
          <Button
            tooltipLabel="link entity"
            inverted
            noBorder
            noBackground
            noHoverBackground
            color="black"
            key="link entity"
            noIconMargin
            onClick={() => {
              // onPick nonTemplate entity
              onPick(entity);
            }}
            icon={<FaLink />}
          />
        )}
        {!!entity.isTemplate && (!territoryWithoutParent || disableTemplateInstantiation) && (
          <Button
            tooltipLabel="link a new template instance"
            key="instantiate template"
            inverted
            noBorder
            noBackground
            noHoverBackground
            onClick={() => {
              // onPick template inside nonTemplate
              onPick(entity, true);
            }}
            icon={<FaPlusSquare />}
          />
        )}
        {!!entity.isTemplate && isInsideTemplate && (
          <Button
            tooltipLabel="link template"
            key="link template"
            inverted
            noBorder
            noBackground
            noHoverBackground
            onClick={() => {
              // onPick template entity
              onPick(entity);
            }}
            icon={<FaLink />}
          />
        )}
      </ButtonGroup>
    );
  };

  const entityIsTemplate = entity.isTemplate || false;
  // every row lists the same icon columns, one per kind some suggestion in the
  // list carries, so an icon of one kind sits in the same column on every row
  const iconKinds = SUGGESTION_ICON_KINDS.filter((kind) =>
    items.some((item) => item.icons?.[kind]),
  );

  return (
    <StyledSuggestionRow
      key={index}
      style={style}
      $twoIcons={entityIsTemplate && isInsideTemplate && !territoryWithoutParent}
      $isSelected={selected === index}
      $iconColumns={iconKinds.length}
    >
      <StyledSuggestionLineActions>
        {!disableButtons && isNotDiscouraged && <>{renderIcons()}</>}
      </StyledSuggestionLineActions>
      <StyledSuggestionLineTag>
        <StyledTagWrapper>
          <EntityTag
            fullWidth
            entity={entity}
            isEquivalent={(entity as IResponseEntity).isEquivalent}
            isSubordinate={(entity as IResponseEntity).isSubordinate}
            tooltipPosition="right"
          />
        </StyledTagWrapper>
      </StyledSuggestionLineTag>
      <StyledSuggestionLineIcons $columns={iconKinds.length}>
        {iconKinds.map((kind) => (
          <StyledSuggestionLineIcon key={kind}>{icons?.[kind]}</StyledSuggestionLineIcon>
        ))}
      </StyledSuggestionLineIcons>
    </StyledSuggestionRow>
  );
};
