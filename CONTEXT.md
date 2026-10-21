# InkVisitor

InkVisitor is the data-entry tool of the DISSINET project, where historians turn textual sources (chiefly medieval inquisitorial records) into structured statements for network and computational analysis. This glossary holds the words the research team uses in issues and in the app. The research team's manual, "From Texts to Structured Data" (https://docs.religionistika.phil.muni.cz), is the authority where the two differ.

## Workflow

**CASTEMO** (Computer-Assisted Semantic Text Modelling):
The data collection workflow InkVisitor implements: modelling the clauses of a source text as statements, so the result is a queryable knowledge graph that keeps the order and context of the text. It comes in three depths: summarized (SumCASTEMO), selective (SelCASTEMO), and full sequential (FullCASTEMO).

**Knowledge graph**:
The data a CASTEMO project produces: entities as nodes, tied by props, relations, and references. InkVisitor collects it; analysis happens outside the app.

## Entities

**Entity**:
Any record in the database: a statement, a territory, or one of the things statements talk about. Every entity has a UUID, an entity type, a label, a label language, a detail, and a status.

**Entity type** (entity class):
The kind of an entity, shown as a one-letter badge: S (Statement), P (Person), E (Event), C (Concept), T (Territory), R (Resource), A (Action), B (Living Being), L (Location), O (Object, a physical thing), G (Group), V (Value). The manual's mnemonic SPECTRABLOG names all but Value. Institutions are coded as Groups when they act, as Locations when they are places such as a manuscript's repository.
_Avoid_: type alone (it also names the prop type and the logical type)

**PLOGESTRB**:
The entity types that stand for specific things in the world: Person, Location, Object, Group, Event, Statement, Territory, Resource, Living Being. They are the ones that take classifications and identifications, as opposed to the generic Concepts and Actions.

**Lemma-meaning unit**:
What an Action or a Concept is: one meaning of one lemma. "To see" in the sense of "perceive with sight" and "to see" in the sense of "go to meet somebody" are two Actions.

**Label**:
An entity's name. The UUID, not the label, holds the entity's identity, but renaming changes every place the entity shows, so it needs care.

**Alternative labels**:
Other labels of the same entity, such as spelling variants ("democratisation", "democratization"), so the entity is found instead of duplicated. A label in another language is a separate entity linked by synonym; in Concepts and Actions, a different lemma is a separate entity.

**Label language**:
The language an entity's label is written in.

**Detail** (field):
The definition of an entity, shown as an info box on hover. It matters most for Actions and Concepts, which hold the data together semantically. For an Action it often starts with a short valency note, such as "stroke (sb/slb - with st)".
_Avoid_: confusing it with the Detail box

**Statement** (S):
An entity that models one clause of the source text: an action slot plus three actant slots. Statements keep their order within their territory. A clause in verbal form ("Peter was baptized") is a statement; the same thing in nominal form ("the baptism of Peter") is an Event.

**Quadruple**:
The core shape of a statement: subject, action, actant 1, actant 2. It extends the semantic triple to verbs with two objects ("Peter received a gift from Elisabeth").

**Territory** (T):
A container that groups statements, typically a text (a written work) at the top and its sections or documents below. Territories nest into a tree under the root territory.
_Avoid_: folder, chapter

**SubT**:
A territory nested under another territory, at any depth.
_Avoid_: child territory (fine in speech, but "subT" is the team's word in issues)

**Template territory**:
A territory marked as a template. Editors may delete it, unlike other whole territories.

**Action** (A, Action type):
An entity for one meaning of a verb, the type that a statement's action slot points to. An Action carries its valency frame.
_Avoid_: verb

**Actant**:
An entity that fills a position in a statement: subject, actant 1, actant 2, or pseudo-actant.
_Avoid_: argument, participant

**Pseudo-actant**:
An entity attached to a statement outside the three syntactic positions.
_To confirm_: inferred from the data model; the manual has no definition yet.

**Coreference resolution**:
Filling an actant slot the text leaves implicit but recoverable from context, such as the dropped subject of a Latin verb or the inquisitor a deponent answers. It does not change the actant's epistemic level.

**Valency frame**:
An Action's rules for its three actant slots: entity type valency (which entity types may fill the slot), morphosyntactic valency (the case and prepositions, in a short notation such as `"de" + 6`), and semantic valency (the role the slot's holder plays, recorded as SUS, A1S, and A2S relations). A slot can be required, optional, or empty (no entity allowed).

**Concept** (C):
An entity for one meaning of a noun, adjective, or other non-verbal lemma. Concepts serve as prop types, as the classes entities are classified under, and as superclasses.

**Event** (E):
An entity for something that happened, named by a noun ("birth of Alexander the Great"). Time and place belong on Events, not directly on the Persons or Objects involved.

**Value** (V):
An entity holding a literal value, such as a number, a date, or a distance ("206").

**Resource** (R):
An entity for an external source: an edition, a manuscript reproduction, a database, a website, a lemma or meaning bank. A Resource stands for one specific textual version, not the work in general.

**Reference**:
A pointer from an entity to a resource plus the part of it (page, folio, identifier) where the evidence is. It serves accountability (the evidence for a claim) and interoperability (links to gazetteers, WordNet, lemma banks). A part of "NA" records that the resource was checked and has no match.

**Template**:
An entity marked as a pattern for creating new entities of the same shape, offered in the Templates box.

**Legacy ID**:
An entity's identifier from an earlier database, kept for traceability.

## Properties

**Prop** (property):
A type-value pair attached to an entity, its origin, and read with "has": the prop type says what is described ("age"), the prop value says what it is ("40"). An entity with two values of the same kind gets two props with the same type.
_Avoid_: attribute, field

**In-statement prop**:
A prop attached from within a statement, to an actant or an action. It belongs to that statement's context and territory.

**Metaprop** (meta-level property):
A prop attached to an entity itself in Detail, holding general knowledge that applies to every use of the entity ("Martha Wood has sex female").

**Subproperty** (second-level prop):
A prop nested under another prop, such as the precision of a coordinate or the start date of an office. It is only meaningful together with its parent prop. Props nest up to the third level.
_Avoid_: first-level prop (a subproperty is never a first-level prop)

**Classification** (CLA):
A relation from a specific entity (PLOGESTRB) to the Concept it is an instance of ("this apple" CLA "apple"). An in-statement classification makes the same claim from within a statement ("this person is a heretic").
_Avoid_: superclass (that relates Concepts to Concepts)

**Identification** (IDE):
A relation declaring two specific entities (PLOGESTRB) the same, within or across entity types ("Rocket Man" IDE "Elton John"). It is the only relation with a certainty, so it can be probable, possible, or even false. The entities an entity is identified with are its identificates. An in-statement identification makes the same claim from within a statement.

**Bundle**:
A group of actants, actions, or props in the same position within a statement, joined by logical operators: and, or, xor, or a comparison (greater, greater or equal, equal, less or equal, less). Each member's operator links it to the next; the last carries "and" as a terminator. Optional start and end marks set the group off when its members act as one unit.

## Assessment of claims

**Epistemic level** (elvl):
How close a claim is to the text: textual (explicitly in the text), interpretive (an interpretation of the text, such as a verbal phrase turned nominal), or inferential (inferred, largely independent of the text, including a label in another language than the text's). Anchors carry one too.

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
_Avoid_: type alone

**Status**:
The review state of an entity: pending, approved, discouraged, warning, or unfinished. Entities an editor creates start as pending until an admin or owner approves them. Discouraged entities stay findable but should not be reused.

**Validation**:
A data-quality rule whose failures show as warnings. Global validations apply to the whole database and only the owner sets them; other validations are set on a territory.
_To confirm_: the manual describes only global validations, not those set on a territory.

**Protocol**:
The metadata of a top-level territory describing its data collection choices: project, data collection methods, guidelines, dates, and related publications.

## Relations

**Relation**:
A typed link between two entities, edited in Detail and outside any statement. There are 17 types, counting in-statement classification and identification.

**Superclass** (SCL):
A Concept's or Action's more generic class, its hypernym ("apple" SCL "fruit"). Every Concept should have one; Actions often do not.
_Avoid_: classification (that relates a specific entity to its class)

**Superordinate entity** (SOE):
A specific entity's link to the entity that fully contains it ("Milan" SOE "Italy"). Only the upward direction is stored; the app shows subordinate entities as its inverse.

**Holonym** (HOL):
A Concept for a part linked to the Concept for its whole ("door of a house" HOL "house"); the inverse is meronym. It is the Concept counterpart of SOE. A fragment that does not amount to the whole takes HOL, not SCL.

**Synonym** (SYN):
Two Actions or two Concepts with the same meaning, within or across languages ("dog" SYN "Hund"). Synonyms must share all superclasses, which makes synonymy transitive.

**SYN cloud**:
The set of entities linked by synonym relations, including the entity itself. Synonymy is reciprocal and transitive, so the cloud is shared by all its members, and an entity belongs to only one cloud.

**Antonym** (ANT):
Two Actions or two Concepts with opposite meanings ("good" ANT "bad").

**Property reciprocal** (PRR):
The prop type a prop would have if read the other way ("mother" PRR "child": Bernard has mother Anna, so Anna has child Bernard). It lets props be queried from either end.

**Subject-actant 1 reciprocal** (SAR):
The Action implied in the reverse direction, from actant 1 back to the subject ("accompanied" SAR "was accompanied"). It can be the same Action or a different one.

**Implication** (IMP):
An Action that must also have happened when this one did ("travelled with" IMP "was in the company of"). Linguists call it entailment.

**Action-event equivalent** (AEE):
The Concept naming an Action as a noun ("to baptize" AEE "baptism"), so statements and Events of the same kind can be queried together. Through it, Actions gain the Concept's superclasses. It is usually written in the project's analytical language.

**Actant semantics** (SUS, A1S, A2S):
The Concepts naming the role of an Action's subject, actant 1, and actant 2 ("to talk": speaker, listener, speech content). Several on one slot all apply at once.

**Related** (REL):
A free association between any two entities, for links no more specific relation covers.

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

**Project-curated digital text**:
The cleaned version of a source text that a project imports, as opposed to the original OCR. The two are separate resources, and the document links to the curated one.

**CAFE**:
Critical Apparatus, Footnotes, and Editorial matter: the parts of an edition removed from a full text before import.

**Anchor**:
A link between a span of a document's text and an entity or statement, carrying an epistemic level. Anchoring a statement in the full text is the default way of recording where it comes from.
_Avoid_: tag, highlight (the XML markup of an anchor is a tag, but the concept is the anchor)

**Territory anchor**:
The anchor of a territory around the text it covers. It declares that the document represents that territory and splits the text into subTs.

**Span**:
The stretch of text an anchor covers.

**Multianchor**:
One entity anchored to several separate spans, displayed together.

**Sequential anchoring**:
The Annotator workflow of stepping through the text, or through search hits, and anchoring entity after entity ("Anchor & next").

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

**Detail** (box):
The box for viewing and editing one entity, opened in tabs.
_Avoid_: confusing it with the detail field

**Used in**:
The section of Detail, and a column in Explorer, that lists where an entity appears: statements, props, relations, and references.

**Search box**:
The basic search for entities by label, UUID, entity type, and filters.

**Explorer** (Query page):
The query builder: a graph of nodes (entities or conditions) connected by edges (such as "used in statements under T" or "has relation"), with result columns and batch operations. Saved queries are private to their author unless an admin or owner shares them.

**Suggester**:
The input that looks up entities by label or UUID and offers matches to pick or drop in.

**Annotator**:
The document view for reading a full text and creating anchors. It has three modes: highlight (add and remove anchors), text edit (correct the text), and XML (view and edit the raw markup).

**Audit**:
The log of changes to an entity, shown in Detail.

## People and access

**Owner**, **admin**, **editor**, **viewer**:
The user roles, from most to least rights. Viewers read only. Editors do the day-to-day research work. Admins also manage users and the whole territory tree. Owners also control admins and set global validations.
_Avoid_: calling the Editor box "the editor" when a role is also in play

**Rights**:
Per-territory access granted to an editor (edit) or viewer (view). A right covers the territory and every subT and statement under it, and the closest grant above a territory wins, so a grant lower in the tree overrides a broader one higher up. Edit rights also give read-only sight of the territories above. Editors change territories and statements only where they have edit rights, and never delete a whole territory except a template territory. Entities outside the tree (Concepts, Persons, Actions, and so on) and relations between them are open to every editor.

**Resource assignment**:
An admin or owner handing a resource with a document to specific editors. Only assigned editors may edit or delete that resource and edit, annotate, or export its document; every editor can read documents.
