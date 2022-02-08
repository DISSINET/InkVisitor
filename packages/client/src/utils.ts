import { IActant, IResponseTree, IStatement } from "@shared/types";

export const findPositionInStatement = (
  statement: IStatement,
  actant: IActant
) => {
  if (
    statement.data.actants
      .filter((a) => a.position === "s")
      .find((a) => a.actant === actant.id)
  ) {
    return "subject";
  } else if (
    statement.data.actants
      .filter((a) => a.position === "a1")
      .find((a) => a.actant === actant.id)
  ) {
    return "actant1";
  } else if (
    statement.data.actants
      .filter((a) => a.position === "a2")
      .find((a) => a.actant === actant.id)
  ) {
    return "actant2";
  } else if (
    statement.data.actants
      .filter((a) => a.position === "p")
      .find((a) => a.actant === actant.id)
  ) {
    return "pseudo-actant";
  } else if (statement.data.tags.find((t) => t === actant.id)) {
    return "tag";
  } else if (statement.data.territory.id === actant.id) {
    return "territory";
  } else if (
    statement.data.actants.find((act) =>
      act.props.find((p) => p.value.id === actant.id)
    )
  ) {
    return "actant property value";
  } else if (
    statement.data.actants.find((act) =>
      act.props.find((p) => p.type.id === actant.id)
    )
  ) {
    return "actant property type";
  } else if (
    statement.data.actions.find((act) =>
      act.props.find((p) => p.value.id === actant.id)
    )
  ) {
    return "action property value";
  } else if (
    statement.data.actions.find((act) =>
      act.props.find((p) => p.type.id === actant.id)
    )
  ) {
    return "action property type";
  } else if (statement.data.references.find((r) => r.resource === actant.id)) {
    return "reference";
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
