# InkVisitor

InkVisitor is the data-entry tool of the DISSINET project, where historians turn textual sources (chiefly medieval inquisitorial records) into structured statements for network and computational analysis. This glossary holds the words the research team uses in issues and in the app.

## Entities

**Entity**:
Any record in the database: a statement, a territory, or one of the things statements talk about. Every entity has a UUID, a class, a label, and a status.

**Entity class**:
The kind of an entity, shown as a one-letter badge: A (Action), T (Territory), S (Statement), R (Resource), P (Person), B (Living Being), G (Group), O (Object), C (Concept), L (Location), V (Value), E (Event).
_Avoid_: entity type (the team uses it as a synonym, but "type" also names the prop type and the logical type)

**Statement** (S):
An entity that relates other entities, following the syntax of one clause of the source text. Statements keep their order within their territory.

**Quadruple**:
The core shape of a statement: subject, action, actant 1, actant 2. It extends the semantic triple to verbs with two objects ("Mary gave a present to Peter").

**Territory** (T):
A container that groups statements, usually one section of a source. Territories nest into a tree under the root territory.
_Avoid_: folder, chapter

**SubT**:
A territory nested under another territory, at any depth.
_Avoid_: child territory (fine in speech, but "subT" is the team's word in issues)

**Action** (A):
An entity for a verb or predicate, the "action type" that a statement's action slot points to. An Action carries its valency frame.
_Avoid_: verb

**Actant**:
An entity that fills a position in a statement: subject, actant 1, actant 2, or pseudo-actant.
_Avoid_: argument, participant

**Pseudo-actant**:
An entity attached to a statement outside the three syntactic positions.

**Valency frame**:
An Action's rules for its three positions: the entity classes allowed in each (entity type valency), the grammatical form of each (morphosyntactic valency), and the semantics of each (SUS, A1S, A2S relations).

**Concept** (C):
An entity for a general idea or category, often used as the type of a prop or as a superclass.

**Value** (V):
An entity holding a literal value, such as a number, a date, or a distance ("206").

**Resource** (R):
An entity for an external source: an edition, a manuscript, a database, a website.

**Reference**:
A pointer from an entity to a resource plus the part of it (page, folio) where the evidence is.

**Template**:
An entity marked as a pattern for creating new entities of the same shape, offered in the Templates box.

**Legacy ID**:
An entity's identifier from an earlier database, kept for traceability.

## Properties

**Prop** (property):
A type-value pair attached to an actant, an action, or an entity: the prop type says what is described ("age"), the prop value says what it is ("40").
_Avoid_: attribute, field

**Metaprop** (metaproperty):
A prop attached to an entity itself in Detail, as opposed to a prop inside a statement.

**Subproperty**:
A prop nested under another prop, such as the precision of a coordinate or the distance of a relation between two cities. It is only meaningful together with its parent prop.
_Avoid_: second-level prop, first-level prop (a subproperty is never a first-level prop)

**Classification**:
A statement-level claim that an actant belongs to a class ("this person is a heretic").

**Identification**:
A statement-level claim that an actant is the same as another entity.

**Bundle**:
A group of actants, actions, or props within a statement, joined by one logical operator (and, or, xor).

## Assessment of claims

**Epistemic level** (elvl):
How close a claim is to the text: textual (explicitly in the text), interpretive (an interpretation of the text), or inferential (inferred, largely independent of the text).

**Certainty**:
The editor's confidence in a claim, from certain through almost certain, probable, possible, and dubious to false.

**Logic**:
Whether a claim is positive or negated.

**Mood**:
The modality of a claim in the text: indication, question, condition, wish, order, belief, allegation, and others. A claim can carry several moods.

**Mood variant**:
Whether the mood describes something real (realis), unreal (irrealis), or not yet decided.

**Virtuality**:
Whether an actant or prop value exists in reality or only as a possibility, probability, allegation, or semblance.

**Partitivity**:
Whether a group-like actant acts as a whole (unison), in parts, or either.

**Logical type**:
Whether an entity is definite (a specific individual), indefinite, hypothetical, or generic.
_Avoid_: type, entity type

**Status**:
The review state of an entity: pending, approved, discouraged, warning, or unfinished. Discouraged entities stay findable but should not be reused.

**Validation**:
A data-quality rule, global or set on a territory, whose failures show as warnings.

**Protocol**:
The metadata of a top-level territory: project, data collection methods, guidelines, dates, and related publications.

## Relations

**Relation**:
A typed link between two entities, edited in Detail and outside any statement. The types are superclass (SCL), synonym (SYN), antonym (ANT), holonym (HOL, inverse meronym), property reciprocal (PRR), subject-actant1 reciprocal (SAR), action-event equivalent (AEE), classification (CLA), identification (IDE), implication (IMP), superordinate entity (SOE), subject, actant 1 and actant 2 semantics (SUS, A1S, A2S), and related (REL).

**SYN cloud**:
The set of entities linked by synonym relations, including the entity itself. Synonymy is reciprocal and transitive, so the cloud is shared by all its members.

**Equivalents**:
In search and Explorer, the entities treated as the same as the target: its synonyms, identifications, and action-event equivalents.

**Subordinates**:
In search and Explorer, the entities under the target: its subclasses, subordinate entities, meronyms, and, for a territory, its subTs.

## Documents and annotation

**Document**:
A full source text uploaded to InkVisitor and linked to a resource, in which entities and statements are anchored.
_Avoid_: file

**Full text**:
The text of a document, as the team refers to it in issues.

**Anchor**:
A link between a span of a document's text and an entity or statement. Anchoring a statement in the full text is the default way of recording where it comes from.
_Avoid_: tag, highlight (the XML markup of an anchor is a tag, but the concept is the anchor)

**Span**:
The stretch of text an anchor covers.

**Multianchor**:
One entity anchored to several separate spans, displayed together.

**Sequential anchoring**:
The Annotator workflow of stepping through the text and anchoring entity after entity ("Anchor & next").

**Statement label**:
A statement's own text field, deprecated in favor of anchoring. When a statement has no label, the text of its anchor span shows in its place as a pseudo-label.

## Screens

**Territories box** (T tree):
The tree of territories on the main page.

**Statements box**:
The list of statements in the selected territory.

**Editor**:
The box for editing the selected statement.
_Avoid_: confusing it with the editor role

**Detail**:
The box for viewing and editing one entity, opened in tabs. Its "detail" field is a short free-text description, distinct from the box.

**Used in**:
The section of Detail, and a column in Explorer, that lists where an entity appears: statements, props, relations, and references.

**Search box**:
The basic search for entities by label, UUID, class, and filters.

**Explorer**:
The query builder: a graph of nodes (entities or conditions) connected by edges (such as "used in statements under T" or "has relation"), with result columns and batch operations.

**Suggester**:
The input that looks up entities by label or UUID and offers matches to pick or drop in.

**Annotator**:
The document view for reading a full text and creating anchors.

**Audit**:
The log of changes to an entity, shown in Detail.

## People and access

**Owner**, **admin**, **editor**, **viewer**:
The user roles, from most to least rights. Editors and viewers see and change only the territories they were granted.
_Avoid_: calling the Editor box "the editor" when a role is also in play

**Rights**:
Per-territory access granted to an editor (edit) or viewer (view), inherited by the territory's subTs.
