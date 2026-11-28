/**
 * The most Concepts one `classified-under` request may ask about. A project has
 * a dozen location types, and each asked-about Concept is a walk of its own.
 */
export const CLASSIFIED_UNDER_MAX_CONCEPTS = 100;

/**
 * One way an entity is classified at or below a Concept that was asked about.
 */
export interface IClassifiedUnder {
  /** The Concept that was asked about, which the entity's classification reaches. */
  concept: string;
  /**
   * The Concept the entity is classified under: `concept` itself, or one of its
   * subclasses or synonyms, or a subclass or synonym of those.
   */
  via: string;
  /** False exactly when the entity is classified under `concept` itself. */
  inferred: boolean;
  /**
   * True when another Concept that was asked about lies below `concept` on the
   * same classification, so that the entity is better described by that one:
   * classified "city", it is under both "city" and "settlement" and is shadowed
   * as the second. A Concept that merely shares a subclass with another is not
   * shadowed by it.
   */
  shadowed: boolean;
}

/** One Concept of the subclass tree below an asked Concept. */
export interface IConceptTreeNode {
  id: string;
  /**
   * The Concepts of the same tree it is a subclass of, every one of them, sorted;
   * empty for the asked Concept itself. A parent edge that would close a cycle is
   * left out, so following parents always ends at the asked Concept.
   */
  parents: string[];
}

/**
 * The subclasses of one asked Concept at every depth, as the superclass
 * relations draw them.
 */
export interface IConceptTree {
  /** The asked Concept first, then the others in the order the walk found them. */
  nodes: IConceptTreeNode[];
  /**
   * Synonyms of a node, each to the node it stands beside. A synonym is not a
   * node of its own: an entity classified under it reads as the node.
   */
  aliases: Record<string, string>;
}

/**
 * The entities classified under any of the Concepts asked about, or under a
 * subclass or synonym of one, with how each got there.
 *
 * Every class of entity is included: the response says nothing of what an entity
 * is, which the caller already knows of the ones it lists.
 */
export interface IResponseClassifiedUnder {
  /** Entity id to its ways of being classified, in the order the Concepts were asked. */
  entities: Record<string, IClassifiedUnder[]>;
  /**
   * The Concepts asked about whose walk below was cut short by the safety limit
   * of the expansion, so that entities classified deeper down are missing.
   */
  truncated: string[];
  /** Asked Concept to its subclass tree. */
  trees: Record<string, IConceptTree>;
  /**
   * Entity id to every Concept in any of the trees (nodes and synonyms) it is
   * classified under, sorted. `entities` keeps only the one that says most per
   * asked Concept; a caller placing the entity within a tree needs them all.
   */
  classifiedAs: Record<string, string[]>;
}
