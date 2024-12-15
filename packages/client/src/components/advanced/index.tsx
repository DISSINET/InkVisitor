import { AddTerritoryModal } from "./AddTerritoryModal/AddTerritoryModal";
import { ApplyTemplateModal } from "./ApplyTemplateModal/ApplyTemplateModal";
import { AttributeButtonGroup } from "./AttributeButtonGroup/AttributeButtonGroup";
import { AuditTable } from "./AuditTable/AuditTable";
import { BreadcrumbItem } from "./BreadcrumbItem/BreadcrumbItem";
import DocumentModalEdit from "./DocumentModal/DocumentModalEdit";
import DocumentModalExport from "./DocumentModal/DocumentModalExport";
import { AttributeMultiDropdown } from "./Dropdowns/AttributeMultiDropdown";
import { BasicDropdown } from "./Dropdowns/BasicDropdown";
import { EntityMultiDropdown } from "./Dropdowns/EntityMultiDropdown";
import { EntitySingleDropdown } from "./Dropdowns/EntitySingleDropdown";
import { EmptyTag } from "./EmptyTag/EmptyTag";
import { EntityCreateModal } from "./EntityCreateModal/EntityCreateModal";
import { EntityDropzone } from "./EntityDropzone/EntityDropzone";
import { EntitySuggester } from "./EntitySuggester/EntitySuggester";
import { EntityTag } from "./EntityTag/EntityTag";
import { EntityTooltip } from "./EntityTooltip/EntityTooltip";
import { ElvlButtonGroup } from "./IconButtonGroups/ElvlButtonGroup";
import { LogicButtonGroup } from "./IconButtonGroups/LogicButtonGroup";
import { MoodVariantButtonGroup } from "./IconButtonGroups/MoodVariantButtonGroup";
import { PositionButtonGroup } from "./IconButtonGroups/PositionButtonGroup";
import { JSONExplorer } from "./JSONExplorer/JSONExplorer";
import { LayoutSeparatorHorizontal } from "./LayoutSeparator/LayoutSeparatorHorizontal";
import { LayoutSeparatorVertical } from "./LayoutSeparator/LayoutSeparatorVertical";
import { Menu } from "./Menu/Menu";
import { Page } from "./Page/Page";
import { LeftHeader, RightHeader } from "./PageHeader/PageHeader";
import { TerritoryActionModal } from "./TerritoryActionModal/TerritoryActionModal";
import { UserCustomizationModal } from "./UserCustomizationModal/UserCustomizationModal";
import { ValidationRule } from "./ValidationRule/ValidationRule";

const Dropdown = {
  Single: {
    Basic: BasicDropdown,
    Entity: EntitySingleDropdown,
  },
  Multi: {
    Attribute: AttributeMultiDropdown,
    Entity: EntityMultiDropdown,
  },
};
export default Dropdown;

export {
  AddTerritoryModal,
  ApplyTemplateModal,
  AttributeButtonGroup,
  AuditTable,
  BreadcrumbItem,
  DocumentModalEdit,
  DocumentModalExport,
  ElvlButtonGroup,
  EmptyTag,
  EntityCreateModal,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  EntityTooltip,
  JSONExplorer,
  LayoutSeparatorHorizontal,
  LayoutSeparatorVertical,
  LeftHeader,
  LogicButtonGroup,
  Menu,
  MoodVariantButtonGroup,
  Page,
  PositionButtonGroup,
  RightHeader,
  TerritoryActionModal,
  UserCustomizationModal,
  ValidationRule,
};
