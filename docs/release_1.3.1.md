## 1.3.1 Changelog [Mar 6th 2023]

### New features:

- Batch actions on Statements in Territory (#1566)
- Buttons to replace / append content from previous or from selected statement (#1607)
- Searching (in Search box) by language (#1651)
- A new button + modal for creating new entity from Detail box (#1648)
- Dragging to an already occupied place (you can replace entity tag directly by drag-dropping another entity tag) (#1640)
- User can choose their default language which is applied as language parameter for all new entities (#1626)
- Add semantic relations to the entity tooltip (#1624)
- Users can hide / display ordering table in Statement Editor (through user customization modal) (#1654)
- Display entity tags even for entities with invalid data (but show that they are invalid) (#1657)

### Bug fixes:

- Hiding tooltips when dragging entity (#1643)
- Hide those inverse relation types which are empty (#1608)
- Removed searching (in Seach box) by used template (#1651)
- C a A are now created with status pending (#1638)
- Reset password Toast allows copy the new password to clipboard (#1637)
- "Search language" option hidden from the User customization modal
- Suggester does not lists Entities with Value class
- Territory tree box refreshes after a new entity class T is created

### Code refactor:

- Unlink button in Entity tags (#1650)
- Box scrolling update and styling (#1641)
- Data-import code rewritten, allows importing only selected collections (#1635)
