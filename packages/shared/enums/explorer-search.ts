export namespace ExplorerSearchEnums {
  export enum SearchOption {
    Label = "label",
    UUIDs = "uuids",
    Status = "status",
    Language = "language",
    CreatedAt = "created at",
    UpdatedAt = "updated at",
    CreatedBy = "created by",
    UpdatedBy = "updated by",
    EditedBy = "edited by",
    RootValidity = "root validity",
  }

  export const ExplorerSearchOptions = Object.values(SearchOption);
}
