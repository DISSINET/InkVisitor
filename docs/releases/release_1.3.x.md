## InkVisitor 1.3.x notes

Throughout versions 1.3.1 to 1.3.3, the InkVisitor application has seen a series of improvements, both in functionality and user experience. While new features have consistently been added to simplify data handling and improve interface usability, there's been a strong emphasis on fixing identified bugs to ensure smooth operations. Simultaneously, the underlying code has undergone regular refactoring to optimize performance and incorporate the latest tech updates.
Besides minor improvements and a number of bug fixes, the main enhancements in the 1.3.x versions are:

- New filtering on the Territory tree.
- Actants are now validated based on valency rules.
- Relations in Entities are now validated based on logical constraints.
- Modals in the Statement editor have been redesigned to use a system of toggles and buttons.
- Batch actions have been added for the Statement list and Statement Editor.

### InkVisitor Update Summary for each minor version

Version 1.3.1 [Mar 6th, 2023]:
The 1.3.1 update brought several new features to the InkVisitor application. This includes significant improvements in handling and editing data. Users can now perform batch actions on statements, choose their default language for entities, add semantic relations to entity tooltips, and directly replace entity tags via drag-and-drop. The searching capability was enhanced with language-specific searches. On the bug-fixing front, issues such as hiding tooltips when dragging an entity and refreshing the Territory tree box were resolved. Code refactoring saw major changes like unlinking button in Entity tags and a rewrite of the data-import code for selective collection imports.

Version 1.3.2 [May 23th, 2023]:
Version 1.3.2 made the handling of entities more streamlined. Instead of modal windows, attributes of actants, actions, and props are now directly displayed next to the entity. The user interface saw the addition of an icon indicating server connection latency and options for batch-editing references in statements. Furthermore, the user experience was enhanced by the removal of the footer and a more intuitive system for selecting entity classes. Bugs fixed in this version include corrections to date formats, bundle start and end attribute display, and space adjustments for notes. Additionally, there were significant code refactoring updates, such as merging interface options and applying the React-portal library to dropdowns for a better user experience.

Version 1.3.3 [Sep 30, 2023]:
The latest update, 1.3.3, centered on refining the application's interface and expanding its functionality. The Territory tree was given a fresh design and now boasts a new filtering functionality. There were multiple additions to the feature set, including an improved warning system for Entities and Statements, an integrated "Expectation" modality, and enhanced password management tools. Several bugs like alignment issues, tooltip problems, and handling audits for deleted users were addressed and resolved. Code optimization continued to be a focus, with major changes including the adoption of Pnpm for bundling, standardization of npm scripts, and an upgrade to React-router.
