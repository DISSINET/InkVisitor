export namespace SearchEnums {
  export enum AdvancedOption {
    Class = "class",
    Status = "status",
    Language = "language",
    Territory = "territory",
    CoOccurrence = "co-occurrence",
    ReferencedTo = "referenced to",
    CreatedAt = "created at",
    UpdatedAt = "updated at",
    CreatedBy = "created by",
    UpdatedBy = "updated by",
    EditedBy = "edited by",
    RootValidity = "root validity",
  }

  export const AdvancedOptions = Object.values(AdvancedOption);
}
