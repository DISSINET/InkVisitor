# What an Editor can do in InkVisitor

A quick, non-technical guide for Admins: what a user with the **Editor** role can
and cannot do.

## The roles, briefly

InkVisitor has four roles, from most limited to most powerful:

- **Viewer** — can look around and read (search), but cannot change anything.
- **Editor** — can create and edit most content (this guide).
- **Admin** — everything an Editor can do, plus managing users and the whole tree.
- **Owner** — full control, including other admins.

An Editor sits in the middle: he does the day-to-day research work, but a few
administrative powers are reserved for Admins and Owners.

## Territories (the tree)

- He can **open and read** any Territory he's been given access to.
- In Territories where he has **edit access**, he can add sub-Territories,
  rename them, reorder them, and edit their contents.
- He can **move a Territory** to a new place in the tree, as long as he has edit
  access to both where it comes from and where it goes.
- He **cannot delete a whole Territory** — that stays with Admins and Owners (to
  protect against removing large amounts of work by accident). The one exception
  is Template Territories, described below.

His access to a Territory is inherited: edit access to a Territory also covers
every sub-Territory and Statement within it. To stop the inheritance for one
branch, give read access on a specific sub-Territory — that sub-Territory and
everything below it then becomes read-only.

## Statements

- He can **create, edit, and delete Statements only inside Territories he's been
  assigned edit access to**. In other Territories he can read but not edit
  Statements.
- He can **read Statements** in any Territory he has read or write access to.
- He can **move a Statement by dragging it onto another Territory in the tree**,
  but only between Territories he can edit — both the one it's leaving and the one
  it's going to. Territories he can't edit won't accept the drop.

## Resources

Resources represent external sources. What an Editor can do depends on whether a
Document is attached:

- **A Resource with no Document attached** — he can **edit and delete** it.
- **A Resource that has a Document attached** — he can edit it and work on its
  Document only if that Resource has been **assigned to him** by an Admin. The
  Resource holds the link to its Document, so editing it can detach that Document
  and deleting it removes the link entirely. A Resource can also be assigned to
  several people at once, so deleting it takes away Document access for all of
  them — which is why this is limited to assigned people rather than open to every
  Editor.

## Other Entities (Concepts, Persons, Objects, Actions, Values, and so on)

Territories, Statements, and Resources are Entity classes too, but they have their own rules.
This section is about the remaining classes.

- He can freely **create, edit, and delete** these Entities.
- They aren't tied to a single Territory or Document, so his ability to edit them doesn't
  depend on tree access or Resource.

## Documents and annotation

- He can **read** Documents.
- He can **edit and annotate a Document** when its Resource has been assigned to
  him. Documents he isn't assigned to open in read-only mode.

## Templates

Templates are reusable starting points for new Entities, Statements, or
Territories. An Editor:

- can **create new Templates**;
- can **edit and delete Templates** — any Template, not only the ones he made.
- can **apply any Template** to quickly create new content from it.

## What an Editor cannot do

These stay with Admins and Owners:

- **Manage users** — creating, deleting, or changing other people's accounts and
  their access rights.
- **Delete entire (non-Template) Territories** — even ones he has edit access to.
  Editing a Territory's contents is allowed; removing the whole Territory is not.
- **See the administration/user-management screens.**

He can always manage **his own** account: change his password, his display
options, and his bookmarks.

## The short version

An Editor can do essentially all the research and content work — building and
editing Entities, Statements, and Templates, and organizing the parts of the tree
he has access to. The boundaries are about **scope** (he edits where he's been
given access).

## What each assignment gives him (Admin's view)

As an Admin or Owner, you control an Editor's scope by assigning rights to
Territories and Resources. Here is what each assignment does.

- **Read access on a Territory** — he can open and read that Territory and
  everything nested under it — including its Statements and their related
  Documents — but cannot change anything there.
- **Write access on a Territory** — he can edit that Territory and its whole
  subtree: edit the Territory's own detail (its Entity), create, edit, and delete
  Statements; add, rename, and reorder sub-Territories; and move Statements in and
  out. This applies to every sub-Territory beneath it as well. He still cannot
  delete the Territory itself. He also gets read-only visibility of the
  Territories above it, so he can navigate down to reach his assigned area.
- **Annotate assignment on a Resource** — he can edit, annotate, export, and
  delete that Resource Entity and its linked Document. This is how you hand a specific
  Document over to the person responsible for it.

Two things to keep in mind:

- **Rights flow downward.** An assignment on a Territory automatically applies to
  everything nested inside it — you don't assign each sub-Territory separately.
- **The closest assignment above wins.** A Territory uses the right assigned
  directly on it, or — if it has none — the nearest one on a Territory above it.
  So a more specific assignment lower in the branch overrides a broader one
  higher up.
