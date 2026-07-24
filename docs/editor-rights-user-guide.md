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

- He can **open and read** any territory he's been given access to.
- In territories where he has **edit access**, he can add sub-territories,
  rename them, reorder them, and edit their contents.
- He can **move a territory** to a new place in the tree, as long as he has edit
  access to both where it comes from and where it goes.
- He **cannot delete a whole territory** — that stays with Admins and Owners (to
  protect against removing large amounts of work by accident). The one exception
  is template territories, described below.

His access to a territory is inherited: if he can edit a territory, he can edit
everything nested inside it.

## Statements

- He can **create, edit, and delete statements only inside territories he's been
  assigned edit access to**. In other territories he can read but not edit
  statements.
- He can **read statements** in any territory he has read or write access to.
- He can **move a statement by dragging it onto another territory in the tree**,
  but only between territories he can edit — both the one it's leaving and the one
  it's going to. Territories he can't edit won't accept the drop.

## Entities (concepts, persons, objects, actions, values, and so on)

- He can freely **create, edit, and delete** these building-block entities.
- These aren't tied to a single territory, so his ability to edit them doesn't
  depend on tree access.

## Resources

Resources represent external sources. What an Editor can do depends on whether a
document is attached:

- **A resource with no document attached** — he can **edit and delete** it.
- **A resource that has a document attached** — he can edit it and work on its
  document only if that resource has been **assigned to him** by an Admin. The
  resource holds the link to its document, so editing it can detach that document
  and deleting it removes the link entirely. A resource can also be assigned to
  several people at once, so deleting it takes away document access for all of
  them — which is why this is limited to assigned people rather than open to every
  Editor.

## Documents and annotation

- He can **read** documents.
- He can **edit and annotate a document** when its resource has been assigned to
  him. Documents he isn't assigned to open in read-only mode.

## Templates

Templates are reusable starting points for new entities, statements, or
territories. An Editor:

- can **create new templates**;
- can **edit and delete templates** — any template, not only the ones he made.
- can **apply any template** to quickly create new content from it.

## What an Editor cannot do

These stay with Admins and Owners:

- **Manage users** — creating, deleting, or changing other people's accounts and
  their access rights.
- **Delete entire (non-template) territories** — even ones he has edit access to.
  Editing a territory's contents is allowed; removing the whole territory is not.
- **See the administration/user-management screens.**

He can always manage **his own** account: change his password, his display
options, and his bookmarks.

## The short version

An Editor can do essentially all the research and content work — building and
editing entities, statements, and templates, and organizing the parts of the tree
he has access to. The boundaries are about **scope** (he edits where he's been
given access) and **administration** (managing people and deleting big structures
stays with Admins).
