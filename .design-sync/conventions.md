# Building with the InkVisitor design system

InkVisitor is a data-entry application for historical text analysis. Its
components speak in entities, territories and statements, and they are styled
with **styled-components against a single theme object** — there is no utility
class vocabulary here, and inventing one produces unstyled output.

## 1. Wrap the tree in `DSProvider`

Every component reads the styled-components theme, and several also read the
redux store, react-dnd, the router or the query client. `DSProvider` supplies
all of it plus the global stylesheet. Outside it, components render unstyled or
throw.

```jsx
const { DSProvider, Button, Panel } = window.InkVisitorDS;

<DSProvider>
  <Panel>
    <Button label="Save" color="primary" onClick={save} />
  </Panel>
</DSProvider>
```

## 2. Style through props, not classes

Components take **theme keys as strings**, not CSS values. `color`, `textColor`,
`borderColor`, `bgColor` all resolve against `theme.color`; `size` and `shape`
are the component's own scales. `color="#c00"` is wrong — `color="danger"` is
right, and is what keeps dark mode working.

```jsx
<Button label="Delete" color="danger" size="M" shape="rounded-md" />
<Button icon={<IcoSearch />} color="primary" noBackground />
```

## 3. The token vocabulary

Import `theme` (and `darkTheme`) from the bundle for your own layout glue.

| Scale | Real values |
| --- | --- |
| `theme.color` | semantic: `primary` `success` `warning` `danger` `info` `plain` `text` `white` `black` `grey` `greyer` `gray` `blue` `transparent` — surfaces: `pageBg` `modalBg` `tableOddRow` `tableEvenRow` `tableHeaderBg` `tagBackground` `tooltipBackground` `menuHover` — entity classes: `entityA` `entityC` `entityE` `entityG` `entityL` `entityO` `entityP` `entityB` `entityR` `entityS` `entityT` `entityV` |
| `theme.space` | `px`, then the numeric steps `0`–`14`, `16`, `18`, `20`, `22`, `24`, `28`, `30`, `32`, `36`, `40`, `48`, `52`, `56`, `60`, `64` |
| `theme.fontSize` | `xxs` `xs` `sm` `base` `lg` `xl` `2xl` `3xl` `4xl` `5xl` `6xl` |
| `theme.fontWeight` | `hairline` `light` `normal` `medium` `bold` `black` |
| `theme.borderRadius` | `none` `xs` `sm` `default` `md` `lg` `full` `input` |
| `theme.borderWidth` | `default` `0` `1` `2` `4` `6` `8` |
| `theme.boxShadow` | `normal` `subtle` `high` `inset` |

The entity-class colors are the app's core visual code: every entity type
(person, action, concept, location, …) has its own color, and tags carry it.

## 4. Dark mode is not optional

The app ships `theme` and `darkTheme`. **Never hardcode a color value anywhere** —
including black text, which is `theme.color["black"]`. A literal hex or a named
CSS color survives the light theme and breaks the dark one, and nothing
downstream catches it.

## 5. Where the truth lives

- `components/<group>/<Name>/<Name>.d.ts` — the real prop contract, with the
  authors' own JSDoc. Read it before using a component; the props are specific
  (`noBackground`, `inverted`, `tooltipLabel`, `rightContent`, `showOnly`) and
  guessing them produces nothing.
- `components/<group>/<Name>/<Name>.prompt.md` — usage and worked examples.
- `styles.css` and the stylesheets it imports — the shipped CSS.

Icons come from the same bundle as `Ico*` exports (`IcoSearch`, `IcoCheck`,
`IcoClose`, `IcoTrash`, `IcoPlus`, `IcoEdit`, `IcoWarning`, …). Enum-typed props
take members of `EntityEnums`, `RelationEnums` and `UserEnums`, also exported.

## 6. A worked example

```jsx
const {
  DSProvider, Modal, ModalHeader, ModalContent, ModalFooter,
  ButtonGroup, Button, Input, IcoWarning,
} = window.InkVisitorDS;

<DSProvider>
  <Modal showModal width="normal" onClose={close}>
    <ModalHeader title="Create entity" onClose={close} />
    <ModalContent column>
      <Input value={label} onChangeFn={setLabel} width="full" />
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={close} />
        <Button label="Create" color="primary" onClick={create} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
</DSProvider>
```
