// Design-system entry for claude.ai/design. The client is an application, not
// a published library, so the surface synced to the design tool is declared
// here: the whole basic layer plus the presentational parts of the advanced
// layer. Components that only exist to drive application data (fetching
// modals, the annotator, statement editors) are deliberately absent.
import "./env-shim";

export { DSProvider } from "./DSProvider";

// The component props speak in these: `color` keys come from the theme,
// `icon` slots take one of the `Ico*` elements, and the enum members are the
// literal unions in the status/logic props.
export * from "Theme/icons";
export { default as theme } from "Theme/theme";
export { darkTheme } from "Theme/theme-dark";
export { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
// `Toast` is the container; the notifications themselves are raised by calling
// `toast()`, so the two only make sense together.
export { toast } from "react-toastify";

export * from "components";

export { AttributeButtonGroup } from "components/advanced/AttributeButtonGroup/AttributeButtonGroup";
export { ElvlButtonGroup } from "components/advanced/IconButtonGroups/ElvlButtonGroup";
export { LogicButtonGroup } from "components/advanced/IconButtonGroups/LogicButtonGroup";
export { MoodVariantButtonGroup } from "components/advanced/IconButtonGroups/MoodVariantButtonGroup";
export { PositionButtonGroup } from "components/advanced/IconButtonGroups/PositionButtonGroup";
export { BreadcrumbItem } from "components/advanced/BreadcrumbItem/BreadcrumbItem";
export { EntityTag } from "components/advanced/EntityTag/EntityTag";
export { EmptyEntityTag } from "components/advanced/EntityTag/EmptyEntityTag";
export { LayoutSeparatorHorizontal } from "components/advanced/PanelSeparator/LayoutSeparatorHorizontal";
export { LayoutSeparatorVertical } from "components/advanced/PanelSeparator/LayoutSeparatorVertical";
export { Menu } from "components/advanced/Menu/Menu";
export { Page } from "components/advanced/Page/Page";
export { LeftHeader, RightHeader } from "components/advanced/PageHeader/PageHeader";
export { PaginationControls } from "components/advanced/PaginationControls/PaginationControls";
export { UserTag } from "components/advanced/UserTag/UserTag";
export { AbbreviatedTextWithTooltip } from "components/advanced/AbbreviatedTextWithTooltip/AbbreviatedTextWithTooltip";
