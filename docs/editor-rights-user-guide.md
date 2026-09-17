# What an Editor can do in InkVisitor

A quick, non-technical guide for Admins: what a user with the **Editor** role can and cannot do.

## The roles, briefly

InkVisitor has four roles, from most limited to most powerful:

- **Viewer** — can look around and read (search), but cannot change anything.
- **Editor** — can create and edit most content (this guide).
- **Admin** — everything an Editor can do, plus managing users and the whole tree.
- **Owner** — full control, including other Admins.

An Editor sits in the middle: they do the day-to-day research work, but a few administrative powers are reserved for Admins and Owners.

## Territories (the tree)

- They can **open and read** any Territory they've been given access to.
- In Territories where they have **edit access**, they can add sub-Territories,
  rename them, reorder them, and edit their contents.
- They can **move a Territory** to a new place in the tree, as long as they have edit
  access to both where it comes from and where it goes.
- They **cannot delete a whole Territory** — that stays with Admins and Owners (to
  protect against removing large amounts of work by accident). The one exception
  is Template Territories, described below.

Their access to a Territory is inherited: edit access to a Territory also covers
every sub-Territory and Statement within it.

## Statements

- They can **create, edit, and delete Statements only inside Territories they've been
  assigned edit access to**. In other Territories they can read but not edit
  Statements.
- They can **read Statements** in any Territory they have read or write access to.
- They can **move a Statement by dragging it onto another Territory in the tree**,  
  but only between Territories they can edit — both the one it's leaving and the one  
  it's going to. Territories they can't edit won't accept the drop.

### Statement list batch actions

Row of batch actions above the Statement list appears **only in a
Territory they can edit**.

- **move** — source T and the destination T has to be theirs to edit
- **duplicate** — source T and the destination T has to be theirs to edit

The following batch actions are allowed for Territories which Editor has write access to:

- **delete**
- **auto order**
- **replace a referenced Resource**
- **append a referenced Resource**
- **relate to superordinate entity**
- **classify as**

Picking a target for one of these four with **more than 10 Statements selected**
opens a confirmation asking whether to apply the action to that many Entities.

The last two create Relations, and this is where a Relation's rules meet the
tree: a Relation attached to a Statement shows up on that Statement, so it
follows the Territory holding it (see [Relations](#relations)).

## Resources

Resources represent external sources. What an Editor can do depends on whether a
Document is attached:

- **A Resource with no Document attached** — they can **edit and delete** it.
- **A Resource that has a Document attached** — they can edit it and delete it and work on its
  Document only if that Resource has been **assigned to them** by an Admin / Owner. The
  Resource holds the link to its Document, so editing it can detach that Document
  and deleting it removes the link entirely. A Resource can also be assigned to
  several people at once, so deleting it takes away Document access for all of
  them — which is why the delete operation is limited to assigned people rather than
  open to every Editor.

## Other Entities (Concepts, Persons, Objects, Actions, Values, and so on)

Territories, Statements, and Resources are Entity classes too, but they have their own rules.
This section is about the remaining classes.

- They can freely **create, edit, and delete** these Entities but with status pending and it’s up to the Admin / Owner to approve them.
- They aren't tied to a single Territory or Document, so their ability to edit them doesn't
  depend on tree access or a Resource.

## Relations

An Editor can **create, edit, and delete any Relation between Entities that live
outside the Territory tree**. Like the Entities above, those are not tied to a Territory,
so this does not depend on their tree access.

A Relation that links a **Statement or a Territory** is the exception. It shows
up on that Entity, so writing it counts as editing the Entity and needs **edit
access to the Territory guarding it** — the Territory that includes the Statement, or the
Territory itself.

## Documents and annotation

Editor can:

- **read** all Documents
- **edit, annotate, export and delete a Document** when its Resource has been assigned to them

## Templates

Editor can:

- **create new Templates**
- **edit and delete Templates** — any Template, not only the ones they made
- **apply any Template**

## Explorer

The Explorer (Query page) is open to an Editor: they can build and run queries,
add columns, and edit some values directly in the table — Status, Label
language, Part of speech, Legacy ID, Detail, and alternative labels.

**Searching is not the same as editing.** A query can return Entities from
anywhere, including parts of the tree they have no access to. The table applies the
same rules as the rest of the app, row by row:

- a **Territory** row is editable only where they have edit access;
- a **Statement** row only when they can edit the Territory it sits in;
- a **Resource** row only when it has no Document, or when that Resource has been
  assigned to them;
- **other Entities** (Concepts, Persons, and so on) are always editable.

Rows they cannot edit still appear, with their values shown as plain text instead
of editable fields, so a query still returns the full picture — they simply cannot
change what is outside their scope. This applies to every editable column,
including the ones that add or unlink related Entities, since those edit the row
Entity itself.

Of the batch actions offered above the results, they may use only:

- **open in detail**
- **copy UUIDs to clipboard**

The rest — **export as TSV**, **add new metaproperty**, **add new reference**,
and **add new relation** — are reserved for Admins and Owners, because they act
on a whole selection at once with no per-Entity confirmation.

Saved queries follow the same split: they can create and manage **their own private
queries**, while sharing a query with everyone, and moderating shared ones, stays
with Admins and Owners.

## Statistics

An Editor can open the **Statistics** page. It only aggregates data they can
already reach, so it is not restricted further.

## What an Editor cannot do

These stay with Admins and Owners:

- **Manage users** — creating, deleting, or changing other people's accounts and
  their access rights.
- **Delete entire (non-Template) Territories** — even ones they have edit access to.
  Editing a Territory's contents is allowed; deleting the whole Territory is not.
- **See the administration/user-management screens.**
- **Run the restricted Explorer batch actions** listed above.
- **Open Backups**, and (Owner only) **Global validations**.

They can always manage **their own** account: change their password, their display
options, and their bookmarks.

## What each assignment gives them (Admin's view)

As an Admin or Owner, you control an Editor's scope by assigning rights to
Territories and Resources. Here is what each assignment does.

- **Read access on a Territory** — they can open and read that Territory and
  everything nested under it — including its Statements and their related
  Documents — but cannot change anything there.
- **Write access on a Territory** — they can edit that Territory and its whole
  subtree: edit the Territory's own detail (its Entity), create, edit, and delete
  Statements; add, rename, and reorder sub-Territories; and move Statements in and
  out. This applies to every sub-Territory beneath it as well. They still cannot
  delete the Territory itself. They also get read-only visibility of the
  Territories above it, so they can navigate down to reach their assigned area.
- **Annotate assignment on a Resource** — they can edit, annotate, export, and
  delete that Resource Entity and its linked Document. This is how you hand a specific
  Document over to the person responsible for it.

Two things to keep in mind:

- **Rights flow downward.** An assignment on a Territory automatically applies to
  everything nested inside it — you don't assign each sub-Territory separately.
- **The closest assignment above wins.** A Territory uses the right assigned
  directly on it, or — if it has none — the nearest one on a Territory above it.
  So a more specific assignment lower in the branch overrides a broader one
  higher up.
