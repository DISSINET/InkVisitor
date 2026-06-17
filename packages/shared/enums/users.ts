export namespace UserEnums {
  export enum Role {
    Owner = "owner",
    Admin = "admin",
    Editor = "editor",
    Viewer = "viewer",
  }

  export enum RoleMode {
    Write = "write",
    Read = "read",
    Admin = "admin",
    // Resource-assignment right (reuses IUser.rights). For entries with this
    // mode the `territory` field carries the assigned Resource entity id, not
    // a territory id. Lets an Editor annotate/edit/export/delete that Resource
    // and its linked document. Ignored by territory/tree right lookups (a
    // resource id never matches a territory id in the tree).
    Annotate = "annotate",
  }
}
