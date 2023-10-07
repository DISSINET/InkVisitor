## 1.3.2 Changelog [May 23th 2023]

### New features:

- Attributes of the actants / actions / props are now displayed next to the Entity - modal windows for handling attributes are removed #1633
- New icon symbolizing the connection latency to the server #1681
- Handling relations in template entitiy details #1262
- Batch actions for editing references in Statements #1666
- Select entity class by key down first #1662
- Autofocus on suggester entity class dropdown #1667
- User can hide entity sorting in Statement Editor #1589
- Assigning parent for new instances of T and S #1675
- Footer removed #1695

### Bugs:

- Show bundle start and bundle end attributes #1668
- Empty relations leading to deleted entities bug #1665
- Smaller space for note #1688
- Actions missing in search dropdown bug #1697
- Username updated when changed in user settings #1729
- Fixed non-breaking space symbols in the text fields
- Wrong date format in dates #1513

### Code refactor:

- Merge interfaces IOption and DropdownItem #1653
- Inactive user is stored as a logged-out user in db #1504
- Updating react-query library to the latest version #1723
- React-portal library is applied to the dropdowns resulting in better UX #1699
