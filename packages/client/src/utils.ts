import { EntityEnums, RelationEnums } from "@shared/enums";
import {
  EntityTooltip,
  IEntity,
  IResponseEntity,
  IResponseTree,
  IStatement,
  Relation,
} from "@shared/types";
import { DropTargetMonitor, XYCoord } from "react-dnd";
import { DragItem, EntityDragItem } from "types";

// TODO: not used, references not in statement data interface
export const findPositionInStatement = (
  statement: IStatement,
  actant: IEntity
) => {
  if (
    statement.data.actants
      .filter((a) => a.position === EntityEnums.Position.Subject)
      .find((a) => a.entityId === actant.id)
  ) {
    return "subject";
  } else if (
    statement.data.actants
      .filter((a) => a.position === EntityEnums.Position.Actant1)
      .find((a) => a.entityId === actant.id)
  ) {
    return "actant1";
  } else if (
    statement.data.actants
      .filter((a) => a.position === EntityEnums.Position.Actant2)
      .find((a) => a.entityId === actant.id)
  ) {
    return "actant2";
  } else if (
    statement.data.actants
      .filter((a) => a.position === EntityEnums.Position.PseudoActant)
      .find((a) => a.entityId === actant.id)
  ) {
    return "pseudo-actant";
  } else if (statement.data.tags.find((t) => t === actant.id)) {
    return "tag";
  } else if (statement.data.territory?.territoryId === actant.id) {
    return "territory";
  } else if (
    statement.data.actants.find((act) =>
      act.props.find((p) => p.value.entityId === actant.id)
    )
  ) {
    return "actant property value";
  } else if (
    statement.data.actants.find((act) =>
      act.props.find((p) => p.type.entityId === actant.id)
    )
  ) {
    return "actant property type";
  } else if (
    statement.data.actions.find((act) =>
      act.props.find((p) => p.value.entityId === actant.id)
    )
  ) {
    return "action property value";
  } else if (
    statement.data.actions.find((act) =>
      act.props.find((p) => p.type.entityId === actant.id)
    )
  ) {
    return "action property type";
  }
};

export const searchTree = (
  element: IResponseTree,
  matchingTitle: string
): IResponseTree | null => {
  if (element.territory.id === matchingTitle) {
    return element;
  } else if (element.children != null) {
    var i;
    var result = null;
    for (i = 0; result === null && i < element.children.length; i++) {
      result = searchTree(element.children[i], matchingTitle);
    }
    return result;
  }
  return null;
};

export const collectTerritoryChildren = (
  element: IResponseTree,
  childArray: string[] = []
): string[] => {
  if (element.children.length) {
    element.children.map((child) => {
      childArray.push(child.territory.id);
    });
    for (var i = 0; i < element.children.length; i++) {
      collectTerritoryChildren(element.children[i], childArray);
    }
  } else {
    return childArray;
  }
  return childArray;
};

export const dndHoverFn = (
  item: EntityDragItem | DragItem,
  index: number,
  monitor: DropTargetMonitor,
  ref: React.RefObject<HTMLDivElement>,
  moveFn: (dragIndex: number, hoverIndex: number) => void
) => {
  if (!ref.current) {
    return;
  }

  const dragIndex: number = item.index;
  const hoverIndex: number | undefined = index;

  if (dragIndex === hoverIndex) {
    return;
  }

  const hoverBoundingRect = ref.current?.getBoundingClientRect();
  const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
  const clientOffset = monitor.getClientOffset();
  const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
  if (hoverIndex === undefined) {
    return;
  }
  if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
    return;
  }

  if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
    return;
  }

  moveFn(dragIndex, hoverIndex);
  item.index = hoverIndex;
};

export const getEntityLabel = (entity?: IResponseEntity) =>
  entity?.label || entity?.data.text || "no label";

export const getShortLabelByLetterCount = (
  label: string,
  maxLetterCount: number
) => {
  const isOversized = label.length > maxLetterCount;
  return isOversized ? label.slice(0, maxLetterCount).concat("...") : label;
};

// Returns one more level, because there's always empty subtree array on the deepest level
export const getRelationTreeDepth = (
  array: EntityTooltip.ISuperclassTree[]
): number => {
  return (
    1 +
    Math.max(
      0,
      ...array.map(({ subtrees = [] }) => getRelationTreeDepth(subtrees))
    )
  );
};

export const getEntityRelationRules = (
  entityClass: EntityEnums.Class,
  relationTypes?: RelationEnums.Type[]
) => {
  const typesToFilter = relationTypes ? relationTypes : RelationEnums.AllTypes;
  return typesToFilter.filter((rule) => {
    if (!Relation.RelationRules[rule]?.allowedEntitiesPattern.length) {
      return rule;
    } else if (
      Relation.RelationRules[rule]?.allowedEntitiesPattern.some(
        (pair) => pair[0] === entityClass
      )
    ) {
      return rule;
    }
  });
};

export const getRelationInvertedRules = (
  entityClass: EntityEnums.Class,
  relationTypes?: RelationEnums.Type[]
) => {
  const typesToFilter = relationTypes ? relationTypes : RelationEnums.AllTypes;
  return RelationEnums.AllTypes.filter((rule) => {
    if (
      Relation.RelationRules[rule]?.asymmetrical &&
      Relation.RelationRules[rule]?.allowedEntitiesPattern.some(
        (pair) => pair[1] === entityClass
      )
    ) {
      return rule;
    }
  });
};
