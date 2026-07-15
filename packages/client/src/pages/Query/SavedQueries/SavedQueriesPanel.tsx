import { UserEnums } from "@inkvisitor/shared/enums";
import { ISavedQuery, ISavedQueryCreate, Query } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, Checkbox, Input, Submit } from "components";
import { useSavedQueriesQuery, useUserQuery } from "hooks/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  IcoChevronRight,
  IcoCloseMd,
  IcoEdit,
  IcoFolder,
  IcoFolderOpen,
  IcoLock,
  IcoSave,
  IcoTrash,
} from "Theme/icons";
import { QueryAction, QueryActionType } from "../Query/state";
import { EXAMPLE_QUERIES, IExampleQuery } from "./exampleQueries";
import {
  StyledChevron,
  StyledCloseButton,
  StyledEmptyNote,
  StyledFolderCount,
  StyledFolderHeader,
  StyledFolderIcon,
  StyledFolderList,
  StyledLockIcon,
  StyledPanel,
  StyledPanelHeader,
  StyledPanelTitle,
  StyledQueryActions,
  StyledQueryActionButton,
  StyledQueryName,
  StyledQueryRow,
  StyledSaveRow,
  StyledSavedQueriesRoot,
  StyledToggleButton,
} from "./SavedQueriesPanelStyles";

interface SavedQueriesPanel {
  queryState: Query.INode;
  queryStateDispatch: React.Dispatch<QueryAction>;
  includeEquivalents: boolean;
  includeSubordinates: boolean;
  onToggleIncludeEquivalents: (value: boolean) => void;
  onToggleIncludeSubordinates: (value: boolean) => void;
}

type FolderKey = "examples" | "mine" | "shared";

type FolderRow = ISavedQuery | IExampleQuery;

const SavedQueriesPanel: React.FC<SavedQueriesPanel> = ({
  queryState,
  queryStateDispatch,
  includeEquivalents,
  includeSubordinates,
  onToggleIncludeEquivalents,
  onToggleIncludeSubordinates,
}) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveShared, setSaveShared] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<FolderKey, boolean>>({
    examples: true,
    mine: true,
    shared: true,
  });
  const [deleteTarget, setDeleteTarget] = useState<ISavedQuery | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);

  const { data: user } = useUserQuery(true);
  const userId = user?.id;
  const isAdminOrOwner = user?.role === UserEnums.Role.Owner || user?.role === UserEnums.Role.Admin;

  const { data: savedQueries = [] } = useSavedQueriesQuery(isOpen);

  const mineQueries = useMemo(
    () => savedQueries.filter((q) => q.ownerId === userId && !q.shared),
    [savedQueries, userId],
  );
  const sharedQueries = useMemo(() => savedQueries.filter((q) => q.shared), [savedQueries]);

  const saveMutation = useMutation({
    mutationFn: (payload: ISavedQueryCreate) => api.savedQueryCreate(payload),
    onSuccess: (_data, variables) => {
      toast.success(`Query "${variables.name}" saved`);
      setSaveName("");
      setSaveShared(false);
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
    },
    onError: () => {
      toast.error("Failed to save query");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.savedQueryUpdate(id, { name }),
    onSuccess: (_data, variables) => {
      toast.success(`Query renamed to "${variables.name}"`);
      setEditingId(null);
      setEditingName("");
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
    },
    onError: () => {
      toast.error("Failed to rename query");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (query: ISavedQuery) => api.savedQueryDelete(query.id),
    onSuccess: (_data, variables) => {
      toast.success(`Query "${variables.name}" deleted`);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
    },
    onError: () => {
      toast.error("Failed to delete query");
    },
  });

  const handleSave = () => {
    const trimmed = saveName.trim();
    if (!trimmed || saveMutation.isPending) {
      return;
    }
    saveMutation.mutate({
      name: trimmed,
      shared: saveShared,
      data: { query: queryState, includeEquivalents, includeSubordinates },
    });
  };

  const handleLoad = (row: FolderRow) => {
    queryStateDispatch({
      type: QueryActionType.setQueryState,
      payload: { newState: row.data.query },
    });
    onToggleIncludeEquivalents(row.data.includeEquivalents);
    onToggleIncludeSubordinates(row.data.includeSubordinates);
  };

  const startEditing = (row: ISavedQuery) => {
    setEditingId(row.id);
    setEditingName(row.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const acceptEditing = () => {
    const trimmed = editingName.trim();
    if (!editingId || !trimmed || renameMutation.isPending) {
      return;
    }
    if (trimmed === savedQueries.find((q) => q.id === editingId)?.name) {
      cancelEditing();
      return;
    }
    renameMutation.mutate({ id: editingId, name: trimmed });
  };

  // "ownerId" only exists on real saved queries, never on example rows — used
  // as the discriminant (structural overlap between the two types means a
  // guard based on negating an "is IExampleQuery" check would narrow to
  // `never`, so check the real-query field directly instead).
  // Owner can always moderate; admins may also moderate shared queries.
  const canModerate = (row: FolderRow): row is ISavedQuery =>
    "ownerId" in row && (row.ownerId === userId || (row.shared && isAdminOrOwner));

  const toggleFolder = (key: FolderKey) => {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Close (without saving any pending draft name) when clicking outside the panel.
  // While the delete-confirm modal is up, clicks land in its portal (outside
  // rootRef), so suspend outside-click closing to keep the panel visible behind it.
  useEffect(() => {
    if (!isOpen || deleteTarget) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        cancelEditing();
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [isOpen, deleteTarget]);

  const folders: {
    key: FolderKey;
    label: string;
    rows: FolderRow[];
  }[] = [
    { key: "examples", label: "Examples", rows: EXAMPLE_QUERIES },
    { key: "mine", label: "My queries", rows: mineQueries },
    { key: "shared", label: "Shared", rows: sharedQueries },
  ];

  return (
    <StyledSavedQueriesRoot ref={rootRef}>
      {isOpen && (
        <StyledPanel>
          <StyledPanelHeader>
            <StyledPanelTitle>Saved queries</StyledPanelTitle>
            <StyledCloseButton
              type="button"
              aria-label="Close saved queries"
              onClick={() => setIsOpen(false)}
            >
              <IcoCloseMd size={16} />
            </StyledCloseButton>
          </StyledPanelHeader>

          <StyledSaveRow>
            <Input
              value={saveName}
              placeholder="name for the current query"
              changeOnType
              width="full"
              onChangeFn={setSaveName}
              onEnterPressFn={handleSave}
            />
            <Checkbox
              label="shared"
              value={saveShared}
              onChangeFn={(value) => setSaveShared(value)}
            />
            <Button
              label="Save"
              icon={<IcoSave size={14} />}
              color="info"
              disabled={!saveName.trim() || saveMutation.isPending}
              onClick={handleSave}
            />
          </StyledSaveRow>

          <StyledFolderList>
            {folders.map(({ key, label, rows }) => (
              <div key={key}>
                <StyledFolderHeader
                  type="button"
                  aria-expanded={openFolders[key]}
                  onClick={() => toggleFolder(key)}
                >
                  <StyledChevron $open={openFolders[key]}>
                    <IcoChevronRight size={14} />
                  </StyledChevron>
                  <StyledFolderIcon>
                    {openFolders[key] ? <IcoFolderOpen size={13} /> : <IcoFolder size={13} />}
                  </StyledFolderIcon>
                  {label}
                  {key === "examples" && (
                    <StyledLockIcon title="Built-in examples cannot be edited">
                      <IcoLock size={11} />
                    </StyledLockIcon>
                  )}
                  <StyledFolderCount>({rows.length})</StyledFolderCount>
                </StyledFolderHeader>

                {openFolders[key] &&
                  (rows.length === 0 ? (
                    <StyledEmptyNote>no queries</StyledEmptyNote>
                  ) : (
                    rows.map((row) => {
                      const isEditing = editingId === row.id;

                      if (!canModerate(row)) {
                        return (
                          <StyledQueryRow key={row.id}>
                            <StyledQueryName type="button" onClick={() => handleLoad(row)}>
                              {row.name}
                            </StyledQueryName>
                          </StyledQueryRow>
                        );
                      }

                      return (
                        <StyledQueryRow key={row.id} $editing={isEditing}>
                          {isEditing ? (
                            <Input
                              value={editingName}
                              changeOnType
                              width="full"
                              autoFocus
                              onChangeFn={setEditingName}
                              onEnterPressFn={acceptEditing}
                              onEscapePressFn={cancelEditing}
                              showSaveExitIcons
                              onBlur={acceptEditing}
                            />
                          ) : (
                            <StyledQueryName type="button" onClick={() => handleLoad(row)}>
                              {row.name}
                            </StyledQueryName>
                          )}

                          <StyledQueryActions $forceVisible={isEditing}>
                            {!isEditing && (
                              <StyledQueryActionButton
                                type="button"
                                aria-label={`Rename ${row.name}`}
                                onClick={() => startEditing(row)}
                              >
                                <IcoEdit size={12} />
                              </StyledQueryActionButton>
                            )}
                            <StyledQueryActionButton
                              type="button"
                              $danger
                              aria-label={`Delete ${row.name}`}
                              onClick={() => setDeleteTarget(row)}
                            >
                              <IcoTrash size={12} />
                            </StyledQueryActionButton>
                          </StyledQueryActions>
                        </StyledQueryRow>
                      );
                    })
                  ))}
              </div>
            ))}
          </StyledFolderList>
        </StyledPanel>
      )}

      <StyledToggleButton
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <IcoFolderOpen size={16} />
        Queries
      </StyledToggleButton>

      <Submit
        title="Delete saved query"
        text={deleteTarget ? `Delete saved query "${deleteTarget.name}"?` : ""}
        show={!!deleteTarget}
        loading={deleteMutation.isPending}
        onSubmit={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </StyledSavedQueriesRoot>
  );
};

export default SavedQueriesPanel;
