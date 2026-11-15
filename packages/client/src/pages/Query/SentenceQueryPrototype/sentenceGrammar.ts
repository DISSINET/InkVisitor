// PROTOTYPE: throwaway code for the sentence query builder demo, not production.
//
// A sentence is a list of tokens. It starts with a root noun ("statements",
// "persons", ...), then clauses follow. Each clause attaches to the noun in
// focus: the latest noun the sentence introduced, unless a "focus" token moved
// it back to an earlier one. A clause either pins an entity ("with subject
// [Jan]") or introduces a new noun ("that are the subject of statements"),
// which becomes a new node of the query and takes the focus.
//
// The sentence compiles to the same Query.INode tree the graph builder edits.

import { EntityEnums } from "@inkvisitor/shared/enums";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { IEntity, Query } from "@inkvisitor/shared/types";

import { edgeTypesWithoutSubordinates, edgeTypesWithSubtreeDepth } from "../types";

export type NounKey =
  | "statements"
  | "persons"
  | "groups"
  | "locations"
  | "objects"
  | "concepts"
  | "entities";

export interface Noun {
  key: NounKey;
  label: string;
  // empty means any class
  classes: EntityEnums.Class[];
}

export const NOUNS: Record<NounKey, Noun> = {
  statements: { key: "statements", label: "statements", classes: [EntityEnums.Class.Statement] },
  persons: { key: "persons", label: "persons", classes: [EntityEnums.Class.Person] },
  groups: { key: "groups", label: "groups", classes: [EntityEnums.Class.Group] },
  locations: { key: "locations", label: "locations", classes: [EntityEnums.Class.Location] },
  objects: { key: "objects", label: "objects", classes: [EntityEnums.Class.Object] },
  concepts: { key: "concepts", label: "concepts", classes: [EntityEnums.Class.Concept] },
  entities: { key: "entities", label: "entities", classes: [] },
};

export const ROOT_NOUNS: NounKey[] = [
  "statements",
  "persons",
  "groups",
  "locations",
  "objects",
  "concepts",
  "entities",
];

export type ClauseTarget =
  // initClass is the class the entity picker opens with
  | { kind: "entity"; classes: EntityEnums.Class[]; initClass?: EntityEnums.Class }
  | { kind: "noun"; noun: NounKey };

export interface Clause {
  id: string;
  phrase: string;
  edgeType: Query.EdgeType;
  logic: Query.EdgeLogic;
  // which nouns the phrase reads well after; the edge's own source rule is
  // checked on top of this
  on: "statements" | "nonStatements" | "any";
  target: ClauseTarget;
}

const anyEntity: ClauseTarget = {
  kind: "entity",
  classes: classesAll,
  initClass: EntityEnums.Class.Person,
};

export const CLAUSES: Clause[] = [
  // statements
  {
    id: "s-subject",
    phrase: "with subject",
    edgeType: Query.EdgeType["I_IS:S"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: anyEntity,
  },
  {
    id: "s-action",
    phrase: "with action",
    edgeType: Query.EdgeType["I_IS:A"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: { kind: "entity", classes: [EntityEnums.Class.Action] },
  },
  {
    id: "s-actant1",
    phrase: "with actant1",
    edgeType: Query.EdgeType["I_IS:A1"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: anyEntity,
  },
  {
    id: "s-mentions",
    phrase: "mentioning",
    edgeType: Query.EdgeType["I_IS:"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: anyEntity,
  },
  {
    id: "s-not-mentions",
    phrase: "not mentioning",
    edgeType: Query.EdgeType["I_IS:"],
    logic: Query.EdgeLogic.Negative,
    on: "statements",
    target: anyEntity,
  },
  {
    id: "s-under",
    phrase: "under territory",
    edgeType: Query.EdgeType["SUT:"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: { kind: "entity", classes: [EntityEnums.Class.Territory] },
  },
  // other entities, linking to statements
  {
    id: "e-subject-of",
    phrase: "that are the subject of",
    edgeType: Query.EdgeType["IS:S"],
    logic: Query.EdgeLogic.Positive,
    on: "nonStatements",
    target: { kind: "noun", noun: "statements" },
  },
  {
    id: "e-appear-in",
    phrase: "that appear in",
    edgeType: Query.EdgeType["IS:"],
    logic: Query.EdgeLogic.Positive,
    on: "nonStatements",
    target: { kind: "noun", noun: "statements" },
  },
  {
    id: "e-used-under",
    phrase: "used in statements under territory",
    edgeType: Query.EdgeType["EUT:"],
    logic: Query.EdgeLogic.Positive,
    on: "nonStatements",
    target: { kind: "entity", classes: [EntityEnums.Class.Territory] },
  },
  // props, on anything
  {
    id: "p-type",
    phrase: "with a property of type",
    edgeType: Query.EdgeType["EP:T"],
    logic: Query.EdgeLogic.Positive,
    on: "any",
    target: { kind: "entity", classes: [EntityEnums.Class.Concept] },
  },
  {
    id: "p-value",
    phrase: "with a property value",
    edgeType: Query.EdgeType["HP:V"],
    logic: Query.EdgeLogic.Positive,
    on: "any",
    target: anyEntity,
  },
];

export const clauseById = (id: string): Clause => CLAUSES.find((clause) => clause.id === id)!;

export interface PickedEntity {
  id: string;
  label: string;
  class: EntityEnums.Class;
  // the whole entity, for its tag
  entity: IEntity;
  // EQ / SUB of the graph builder's node: widen the picked entity to its
  // equivalents and to what is under it
  includeEquivalents?: boolean;
  includeSubordinates?: boolean;
}

export type Widening = "equivalents" | "subordinates";

export const subordinatesApply = (clause: Clause) =>
  !edgeTypesWithoutSubordinates.includes(clause.edgeType);

// worded after the EQ / SUB toggles of the graph node, so the two read alike
export const wideningPhrase = (clause: Clause, widening: Widening): string => {
  if (widening === "equivalents") return "+ equivalents";
  // I_CT: reads SUB as how deep below the territory to match
  return edgeTypesWithSubtreeDepth.includes(clause.edgeType)
    ? "+ all levels below"
    : "+ subordinates";
};

const wideningField = (widening: Widening) =>
  widening === "equivalents" ? "includeEquivalents" : "includeSubordinates";

/** The widenings a picked entity has on, or could have, under its clause. */
export const widenings = (clause: Clause, entity: PickedEntity, on: boolean): Widening[] =>
  (["equivalents", "subordinates"] as Widening[]).filter(
    (widening) =>
      (widening === "equivalents" || subordinatesApply(clause)) &&
      !!entity[wideningField(widening)] === on
  );

// how the clauses on a noun combine, AND unless set; the graph builder keeps
// one operator per node, so it is one per noun here too
type Operator = { operator?: Query.NodeOperator };

export type Token =
  | ({ kind: "root"; noun: NounKey } & Operator)
  // the operator only counts on a clause that introduces a noun
  | ({ kind: "clause"; clauseId: string; entity?: PickedEntity } & Operator)
  // moves the focus back to the noun introduced by the token at `tokenIndex`
  | { kind: "focus"; tokenIndex: number };

export const operatorOf = (tokens: Token[], nounTokenIndex: number): Query.NodeOperator => {
  const token = tokens[nounTokenIndex];
  return (token.kind !== "focus" && token.operator) || Query.NodeOperator.And;
};

export const withOperator = (
  tokens: Token[],
  nounTokenIndex: number,
  operator: Query.NodeOperator
): Token[] =>
  tokens.map((token, tokenIndex) =>
    tokenIndex === nounTokenIndex && token.kind !== "focus" ? { ...token, operator } : token
  );

/**
 * For each token, the noun whose AND / OR is shown right before it: every
 * clause on a noun after its first one gets it. A clause right after
 * "and those X" reads the operator from that phrase instead.
 */
export const connectives = (tokens: Token[]): (number | undefined)[] => {
  const attachedTo = attachments(tokens);
  const clausesSoFar = new Map<number, number>();
  return tokens.map((token, tokenIndex) => {
    if (token.kind !== "clause") return undefined;
    const noun = attachedTo[tokenIndex];
    const count = clausesSoFar.get(noun) ?? 0;
    clausesSoFar.set(noun, count + 1);
    if (count === 0 || tokens[tokenIndex - 1]?.kind === "focus") return undefined;
    return noun;
  });
};

/** The nouns a sentence has introduced, by the index of the token that did. */
export const introducedNouns = (tokens: Token[]): { tokenIndex: number; noun: NounKey }[] => {
  const nouns: { tokenIndex: number; noun: NounKey }[] = [];
  tokens.forEach((token, tokenIndex) => {
    if (token.kind === "root") {
      nouns.push({ tokenIndex, noun: token.noun });
    } else if (token.kind === "clause") {
      const target = clauseById(token.clauseId).target;
      if (target.kind === "noun") {
        nouns.push({ tokenIndex, noun: target.noun });
      }
    }
  });
  return nouns;
};

/**
 * For each token, the index of the token whose noun it attaches to, and the
 * noun in focus once the whole sentence is read.
 */
const walkFocus = (tokens: Token[]): { attachedTo: number[]; focus: number } => {
  let focus = 0;
  const attachedTo = tokens.map((token, tokenIndex) => {
    if (token.kind === "root") {
      focus = tokenIndex;
      return tokenIndex;
    }
    if (token.kind === "focus") {
      focus = token.tokenIndex;
      return token.tokenIndex;
    }
    const attached = focus;
    if (clauseById(token.clauseId).target.kind === "noun") {
      focus = tokenIndex;
    }
    return attached;
  });
  return { attachedTo, focus };
};

export const attachments = (tokens: Token[]): number[] => walkFocus(tokens).attachedTo;

export const nounOfToken = (tokens: Token[], tokenIndex: number): NounKey | undefined =>
  introducedNouns(tokens).find((noun) => noun.tokenIndex === tokenIndex)?.noun;

/** The index of the token that introduced the noun in focus. */
export const focusTokenIndex = (tokens: Token[]): number => walkFocus(tokens).focus;

export const focusedNoun = (tokens: Token[]): NounKey | undefined =>
  tokens.length ? nounOfToken(tokens, focusTokenIndex(tokens)) : undefined;

const sourceRuleAllows = (edgeType: Query.EdgeType, noun: Noun): boolean => {
  const sourceClasses = Query.EdgeTypeNodeRules[edgeType][0].params.entityClass ?? [];
  if (!sourceClasses.length) return true;
  return noun.classes.length > 0 && noun.classes.every((cls) => sourceClasses.includes(cls));
};

export const clausesFor = (nounKey: NounKey): Clause[] => {
  const noun = NOUNS[nounKey];
  const isStatement = nounKey === "statements";
  return CLAUSES.filter((clause) => {
    if (clause.on === "statements" && !isStatement) return false;
    if (clause.on === "nonStatements" && isStatement) return false;
    return sourceRuleAllows(clause.edgeType, noun);
  });
};

export type SuggestionAction =
  | { kind: "add"; token: Token }
  // widens the entity picked by the clause the suggestion is offered for
  | { kind: "widen"; widening: Widening };

export interface Suggestion {
  text: string;
  hint?: string;
  action: SuggestionAction;
}

export const wideningSuggestions = (token: Token | undefined): Suggestion[] => {
  if (token?.kind !== "clause" || !token.entity) return [];
  const clause = clauseById(token.clauseId);
  const entity = token.entity;
  return widenings(clause, entity, false).map((widening) => ({
    text: wideningPhrase(clause, widening),
    hint: `of ${entity.label}`,
    action: { kind: "widen", widening },
  }));
};

/** What the sentence can continue with, unless a clause waits for its entity. */
export const nextSuggestions = (tokens: Token[]): Suggestion[] => {
  if (!tokens.length) {
    return ROOT_NOUNS.map((noun) => ({
      text: NOUNS[noun].label,
      hint: "start with",
      action: { kind: "add", token: { kind: "root", noun } },
    }));
  }
  const noun = focusedNoun(tokens);
  if (!noun) return [];
  const clauses: Suggestion[] = clausesFor(noun).map((clause) => ({
    text:
      clause.target.kind === "noun"
        ? `${clause.phrase} ${NOUNS[clause.target.noun].label}`
        : clause.phrase,
    hint: `about the ${NOUNS[noun].label}`,
    action: { kind: "add", token: { kind: "clause", clauseId: clause.id } },
  }));
  const focus = focusTokenIndex(tokens);
  const backReferences: Suggestion[] = introducedNouns(tokens)
    .filter((introduced) => introduced.tokenIndex !== focus)
    .map((introduced) => ({
      text: `${operatorOf(tokens, introduced.tokenIndex)} those ${NOUNS[introduced.noun].label}`,
      hint: "go back to",
      action: { kind: "add", token: { kind: "focus", tokenIndex: introduced.tokenIndex } },
    }));

  // right after a picked entity, its EQ / SUB come first
  return [...wideningSuggestions(tokens[tokens.length - 1]), ...clauses, ...backReferences];
};

/**
 * The tokens at `drop`, together with every later token that hangs off a noun
 * one of them introduced, directly or through a noun introduced in turn. A
 * dropped "and those X" takes the clauses that went back to X through it.
 */
const withDependents = (tokens: Token[], drop: Set<number>): Set<number> => {
  const attachedTo = attachments(tokens);
  const dropped = new Set(drop);
  // the noun the sentence went back to through a dropped focus token
  let droppedFocus: number | undefined;
  // a token only ever attaches to an earlier one, so one pass in order is enough
  tokens.forEach((token, tokenIndex) => {
    if (token.kind === "root") return;
    const anchor = attachedTo[tokenIndex];
    if (token.kind === "focus") {
      if (dropped.has(anchor)) dropped.add(tokenIndex);
      droppedFocus = dropped.has(tokenIndex) ? anchor : undefined;
      return;
    }
    if (dropped.has(anchor) || anchor === droppedFocus) dropped.add(tokenIndex);
  });
  return dropped;
};

// focus tokens point at token indices, which shift as earlier tokens go
const withoutTokens = (tokens: Token[], dropped: Set<number>): Token[] => {
  const newIndex = new Map<number, number>();
  const kept: Token[] = [];
  tokens.forEach((token, tokenIndex) => {
    if (dropped.has(tokenIndex)) return;
    newIndex.set(tokenIndex, kept.length);
    kept.push(token);
  });
  const renumbered = kept.map((token) =>
    token.kind === "focus" ? { ...token, tokenIndex: newIndex.get(token.tokenIndex)! } : token
  );
  // an "and those X" while X is already in focus says nothing; dropping it
  // leaves every attachment as it was
  const redundant = new Set<number>();
  let focus = 0;
  renumbered.forEach((token, tokenIndex) => {
    if (token.kind === "focus") {
      if (token.tokenIndex === focus) redundant.add(tokenIndex);
      focus = token.tokenIndex;
    } else if (token.kind === "clause" && clauseById(token.clauseId).target.kind === "noun") {
      focus = tokenIndex;
    }
  });
  return redundant.size ? withoutTokens(renumbered, redundant) : renumbered;
};

/** Removes a token and everything that talks about the noun it introduced. */
export const removeToken = (tokens: Token[], tokenIndex: number): Token[] =>
  withoutTokens(tokens, withDependents(tokens, new Set([tokenIndex])));

/** Clauses that no longer fit the noun they attach to, and focus tokens left without a noun. */
const misfits = (tokens: Token[]): Set<number> => {
  const attachedTo = attachments(tokens);
  const misfit = new Set<number>();
  tokens.forEach((token, tokenIndex) => {
    if (token.kind === "focus" && !nounOfToken(tokens, token.tokenIndex)) misfit.add(tokenIndex);
    if (token.kind !== "clause") return;
    const noun = nounOfToken(tokens, attachedTo[tokenIndex]);
    if (!noun || !clausesFor(noun).some((clause) => clause.id === token.clauseId)) {
      misfit.add(tokenIndex);
    }
  });
  return misfit;
};

/** What the token at `tokenIndex` can be swapped for, the current one included. */
export const swapSuggestions = (tokens: Token[], tokenIndex: number): Suggestion[] => {
  const token = tokens[tokenIndex];
  if (token.kind === "root") {
    return ROOT_NOUNS.map((noun) => ({
      text: NOUNS[noun].label,
      hint: noun === token.noun ? "current" : undefined,
      action: { kind: "add", token: { kind: "root", noun } },
    }));
  }
  if (token.kind !== "clause") return [];
  const noun = nounOfToken(tokens, attachments(tokens)[tokenIndex]);
  if (!noun) return [];
  // a picked entity's EQ / SUB come first, as they do right after picking it
  return [
    ...wideningSuggestions(token),
    ...clausesFor(noun).map(
      (clause): Suggestion => ({
        text: tokenText([{ kind: "clause", clauseId: clause.id }], 0),
        hint: clause.id === token.clauseId ? "current" : undefined,
        action: { kind: "add", token: { kind: "clause", clauseId: clause.id } },
      })
    ),
  ];
};

/**
 * Puts `token` in place of the one at `tokenIndex`. A picked entity stays when
 * the new clause takes its class. When the noun the old token introduced goes
 * away, so does everything said about it, and clauses that stop fitting their
 * noun drop out with their own dependents.
 */
export const swapToken = (tokens: Token[], tokenIndex: number, token: Token): Token[] => {
  const old = tokens[tokenIndex];
  let next = token;
  if (old.kind === "clause" && old.entity && next.kind === "clause") {
    const target = clauseById(next.clauseId).target;
    if (target.kind === "entity" && target.classes.includes(old.entity.class)) {
      next = { ...next, entity: old.entity };
    }
  }

  // the noun's AND / OR stays with whatever introduces a noun in its place
  if (old.kind !== "focus" && old.operator && next.kind !== "focus") {
    next = { ...next, operator: old.operator };
  }

  let swapped = [...tokens];
  swapped[tokenIndex] = next;
  const introducedBefore = nounOfToken(tokens, tokenIndex);
  // a root keeps its dependents, the misfit pass below sorts them out
  if (old.kind === "clause" && introducedBefore !== nounOfToken(swapped, tokenIndex)) {
    const dependents = withDependents(tokens, new Set([tokenIndex]));
    dependents.delete(tokenIndex);
    swapped = withoutTokens(swapped, dependents);
  }

  // dropping a misfit can move the focus of the tokens after it, so repeat
  for (let misfit = misfits(swapped); misfit.size; misfit = misfits(swapped)) {
    swapped = withoutTokens(swapped, withDependents(swapped, misfit));
  }
  return swapped;
};

/** The clause at the end of the sentence that still waits for its entity. */
export const pendingEntityClause = (tokens: Token[]): Clause | undefined => {
  const last = tokens[tokens.length - 1];
  if (last?.kind !== "clause" || last.entity) return undefined;
  const clause = clauseById(last.clauseId);
  return clause.target.kind === "entity" ? clause : undefined;
};

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

const newNode = (
  params: Query.INodeParams,
  operator = Query.NodeOperator.And,
  id?: string
): Query.INode => ({
  id: id ?? nextId("sentence-node"),
  type: Query.NodeType.E,
  params,
  operator,
  edges: [],
});

/**
 * Compiles the sentence to a query tree. A clause still waiting for its entity
 * is left out, so a half-typed sentence still compiles to what it says so far.
 */
export const compileSentence = (tokens: Token[]): Query.INode | undefined => {
  const root = tokens[0];
  if (root?.kind !== "root") return undefined;

  const nodesByToken = new Map<number, Query.INode>();
  nodesByToken.set(
    0,
    newNode({ entityClasses: NOUNS[root.noun].classes }, operatorOf(tokens, 0), "root")
  );
  const attachedTo = attachments(tokens);

  tokens.forEach((token, tokenIndex) => {
    if (token.kind !== "clause") return;
    const clause = clauseById(token.clauseId);
    const source = nodesByToken.get(attachedTo[tokenIndex]);
    if (!source) return;

    let target: Query.INode;
    if (clause.target.kind === "noun") {
      target = newNode(
        { entityClasses: NOUNS[clause.target.noun].classes },
        operatorOf(tokens, tokenIndex)
      );
      nodesByToken.set(tokenIndex, target);
    } else if (token.entity) {
      // a pinned entity is the whole match of its node, as the graph builder
      // stores it
      target = newNode({
        entityId: token.entity.id,
        entityClasses: [],
        includeEquivalents: token.entity.includeEquivalents || undefined,
        includeSubordinates:
          (subordinatesApply(clause) && token.entity.includeSubordinates) || undefined,
      });
    } else {
      return;
    }

    source.edges.push({
      id: nextId("sentence-edge"),
      type: clause.edgeType,
      params: {},
      logic: clause.logic,
      node: target,
    });
  });

  return nodesByToken.get(0);
};

/** Plain text of a token, as the sentence shows it. */
export const tokenText = (tokens: Token[], tokenIndex: number): string => {
  const token = tokens[tokenIndex];
  if (token.kind === "root") return NOUNS[token.noun].label;
  if (token.kind === "focus") {
    const noun = nounOfToken(tokens, token.tokenIndex);
    return `${operatorOf(tokens, token.tokenIndex)} those ${noun ? NOUNS[noun].label : ""}`;
  }
  const clause = clauseById(token.clauseId);
  if (clause.target.kind === "noun") {
    return `${clause.phrase} ${NOUNS[clause.target.noun].label}`;
  }
  return clause.phrase;
};

const classNames: Partial<Record<EntityEnums.Class, string>> = {
  [EntityEnums.Class.Action]: "action",
  [EntityEnums.Class.Territory]: "territory",
  [EntityEnums.Class.Concept]: "concept",
  [EntityEnums.Class.Person]: "person",
};

/** The placeholder of an entity slot: its class when it allows only one. */
export const blankLabel = (clause: Clause): string => {
  if (clause.target.kind !== "entity") return "";
  const classes = clause.target.classes;
  return classes.length === 1 ? (classNames[classes[0]] ?? "entity") : "entity";
};
