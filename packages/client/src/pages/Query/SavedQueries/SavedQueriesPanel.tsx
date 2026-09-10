import { FloatingPortal, autoUpdate, offset, size, useFloating } from "@floating-ui/react";
import { UserEnums } from "@inkvisitor/shared/enums";
import { ISavedQuery, ISavedQueryCreate, Query } from "@inkvisitor/shared/types";
import { SavedQueryNameNotUnique } from "@inkvisitor/shared/types/errors";
import { Explore } from "@inkvisitor/shared/types/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, Checkbox, Input, Submit } from "components";
import { useSavedQueriesQuery, useUserQuery } from "hooks/react-query";
import React, { useEffect, useMemo, useState } from "react";
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
import { ExploreActionType } from "../Explorer/state";
import { QueryAction, QueryActionType } from "../Query/state";
import { EXAMPLE_QUERIES, IExampleQuery } from "./exampleQueries";
import {
  StyledCharCounter,
  StyledChevron,
  StyledCloseButton,
  StyledEmptyNote,
  StyledFolderCard,
  StyledFolderCount,
  StyledFolderHeader,
  StyledFolderIcon,
  StyledFolderList,
  StyledLockIcon,
  StyledNameError,
  StyledPanel,
  StyledPanelHeader,
  StyledPanelTitle,
  StyledQueryActions,
  StyledQueryActionButton,
  StyledQueryBullet,
  StyledQueryName,
  StyledQueryRow,
  StyledSaveAction,
  StyledSaveFooter,
  StyledSaveRow,
  StyledSavedQueriesRoot,
  StyledShareRow,
  StyledToggleButton,
} from "./SavedQueriesPanelStyles";

interface SavedQueriesPanel {
  queryState: Query.INode;
  queryStateDispatch: React.Dispatch<QueryAction>;
  includeEquivalents: boolean;
  includeSubordinates: boolean;
  onToggleIncludeEquivalents: (value: boolean) => void;
  onToggleIncludeSubordinates: (value: boolean) => void;
  exploreFilters: Explore.IExploreSearchFilter[];
  exploreDispatch: React.Dispatch<any>;
}

// gap between the Queries toggle and the panel (matches the old flex gap)
const PANEL_OFFSET = 10;

// Inset kept when clamping max-height (~2rem). The size middleware measures
// against the floating element's clipping ancestors; #page-content is the
// nearest one because it sets overflow: hidden (see StyledPageContent), so in
// practice this insets from its edges.
const CLIPPING_INSET = 20;

// keeps names within the two lines the query rows show (see StyledQueryName);
// matters most for shared queries, which every user sees in their list
const QUERY_NAME_MAX_LENGTH = 80;

type FolderKey = "examples" | "mine" | "shared";

const MINE_LABEL = "My queries";
const SHARED_LABEL = "Shared";

// Names are unique within a folder: every shared query shares one namespace,
// each user's private queries another. Names that read the same collide, so
// the comparison ignores case and surrounding whitespace (the server applies
// the same rule - it is the only place that sees other users' shared saves).
const normalizeName = (name: string): string => name.trim().toLowerCase();

type FolderRow = ISavedQuery | IExampleQuery;

const SavedQueriesPanel: React.FC<SavedQueriesPanel> = ({
  queryState,
  queryStateDispatch,
  includeEquivalents,
  includeSubordinates,
  onToggleIncludeEquivalents,
  onToggleIncludeSubordinates,
  exploreFilters,
  exploreDispatch,
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

  // Panel is portaled into #page-content and capped with maxHeight only (never
  // height), so it stays content-sized until it hits the page-content floor.
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: "left-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(PANEL_OFFSET),
      size({
        padding: CLIPPING_INSET,
        apply({ availableHeight, elements }) {
          // maxHeight only — short lists stay short; overflow scrolls the folder list
          elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
        },
      }),
    ],
  });

  const { data: user } = useUserQuery(true);
  const userId = user?.id;
  const isAdminOrOwner = user?.role === UserEnums.Role.Owner || user?.role === UserEnums.Role.Admin;
  // editors and up may create shared queries; viewers only get private ones
  const canShare = isAdminOrOwner || user?.role === UserEnums.Role.Editor;

  const { data: savedQueries = [] } = useSavedQueriesQuery(isOpen);

  const mineQueries = useMemo(
    () => savedQueries.filter((q) => q.ownerId === userId && !q.shared),
    [savedQueries, userId],
  );
  const sharedQueries = useMemo(() => savedQueries.filter((q) => q.shared), [savedQueries]);

  const isNameTaken = (name: string, shared: boolean, exceptId?: string): boolean => {
    const normalized = normalizeName(name);
    return (shared ? sharedQueries : mineQueries).some(
      (q) => q.id !== exceptId && normalizeName(q.name) === normalized,
    );
  };

  const trimmedSaveName = saveName.trim();
  const saveNameTaken = !!trimmedSaveName && isNameTaken(trimmedSaveName, saveShared);

  const saveMutation = useMutation({
    mutationFn: (payload: ISavedQueryCreate) => api.savedQueryCreate(payload),
    onSuccess: (_data, variables) => {
      toast.success(`Query "${variables.name}" saved`);
      setSaveName("");
      setSaveShared(false);
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof SavedQueryNameNotUnique ? error.message : "Failed to save query",
      );
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
    onError: (error) => {
      toast.error(
        error instanceof SavedQueryNameNotUnique ? error.message : "Failed to rename query",
      );
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
    if (!trimmedSaveName || saveNameTaken || saveMutation.isPending) {
      return;
    }
    saveMutation.mutate({
      name: trimmedSaveName,
      shared: saveShared,
      // every Explorer filter in play (UUIDs, label, floating search) travels
      // with the query, so loading it reproduces the whole result
      data: {
        query: queryState,
        includeEquivalents,
        includeSubordinates,
        filters: exploreFilters,
      },
    });
  };

  const handleLoad = (row: FolderRow) => {
    queryStateDispatch({
      type: QueryActionType.setQueryState,
      payload: { newState: row.data.query },
    });
    onToggleIncludeEquivalents(row.data.includeEquivalents);
    onToggleIncludeSubordinates(row.data.includeSubordinates);
    // the stored filters replace the current set: a query saved without a given
    // filter is meant to run without it, not to inherit whatever is applied now
    exploreDispatch({
      type: ExploreActionType.setFilters,
      payload: { filters: row.data.filters ?? [] },
    });
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
    const edited = savedQueries.find((q) => q.id === editingId);
    if (!edited || trimmed === edited.name) {
      cancelEditing();
      return;
    }
    // the row stays in edit mode with the rejected name, so the user can
    // correct it without retyping (blur also lands here)
    if (isNameTaken(trimmed, edited.shared, edited.id)) {
      toast.error(`Name already used in ${edited.shared ? SHARED_LABEL : MINE_LABEL}`);
      return;
    }
    renameMutation.mutate({ id: editingId, name: trimmed });
  };

  // "ownerId" only exists on real saved queries, never on example rows — used
  // as the discriminant (structural overlap between the two types means a
  // guard based on negating an "is IExampleQuery" check would narrow to
  // `never`, so check the real-query field directly instead).
  // Shared queries: admins/owners moderate any, editors only their own;
  // private queries stay with their owner alone (mirrors the server rule).
  const canModerate = (row: FolderRow): row is ISavedQuery =>
    "ownerId" in row &&
    (row.shared ? isAdminOrOwner || (row.ownerId === userId && canShare) : row.ownerId === userId);

  const toggleFolder = (key: FolderKey) => {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Close (without saving any pending draft name) when clicking outside the
  // panel or toggle. The panel lives in a #page-content portal, so check both
  // floating-ui refs. Suspend while the delete-confirm modal is up — its portal
  // clicks would otherwise look "outside" and close the panel behind it.
  useEffect(() => {
    if (!isOpen || deleteTarget) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const reference = refs.reference.current;
      const inToggle = reference instanceof Element ? reference.contains(target) : false;
      const inPanel = refs.floating.current?.contains(target) ?? false;
      if (!inToggle && !inPanel) {
        setIsOpen(false);
        cancelEditing();
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [isOpen, deleteTarget, refs.reference, refs.floating]);

  const folders: {
    key: FolderKey;
    label: string;
    rows: FolderRow[];
  }[] = [
    // built-in examples for testing (production import only)
    ...(process.env.NODE_ENV === "development"
      ? [
          {
            key: "examples" as const,
            label: "Examples (dev only)",
            rows: EXAMPLE_QUERIES as FolderRow[],
          },
        ]
      : []),
    { key: "mine", label: MINE_LABEL, rows: mineQueries },
    { key: "shared", label: SHARED_LABEL, rows: sharedQueries },
  ];

  return (
    <StyledSavedQueriesRoot>
      <StyledToggleButton
        ref={refs.setReference}
        type="button"
        aria-expanded={isOpen}
        $isActive={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <IcoFolderOpen size={16} />
        Queries
      </StyledToggleButton>

      {isOpen && (
        <FloatingPortal id="page-content">
          <StyledPanel ref={refs.setFloating} style={floatingStyles}>
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
                autoFocus
                maxLength={QUERY_NAME_MAX_LENGTH}
                borderColor={saveNameTaken ? "danger" : undefined}
                rightContent={
                  <StyledCharCounter>
                    {saveName.length}/{QUERY_NAME_MAX_LENGTH}
                  </StyledCharCounter>
                }
                onChangeFn={setSaveName}
                onEnterPressFn={handleSave}
              />
              {saveNameTaken && (
                <StyledNameError role="alert">
                  Name already used in {saveShared ? SHARED_LABEL : MINE_LABEL}
                </StyledNameError>
              )}
              <StyledSaveFooter
                onKeyDown={(e) => {
                  // Enter while the Save button holds focus saves; the checkbox
                  // stops its own Enter from bubbling here (see handleKeyToggle),
                  // so tabbing checkbox -> Save -> Enter is the save path
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
              >
                {canShare && (
                  <StyledShareRow>
                    <Checkbox
                      label="shared with everyone"
                      value={saveShared}
                      onChangeFn={(value) => setSaveShared(value)}
                    />
                  </StyledShareRow>
                )}
                <StyledSaveAction>
                  <Button
                    label="Save"
                    icon={<IcoSave size={14} />}
                    color="info"
                    disabled={!trimmedSaveName || saveNameTaken || saveMutation.isPending}
                    onClick={handleSave}
                  />
                </StyledSaveAction>
              </StyledSaveFooter>
            </StyledSaveRow>

            <StyledFolderList>
              {folders.map(({ key, label, rows }) => (
                <StyledFolderCard key={key}>
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
                              <StyledQueryBullet>•</StyledQueryBullet>
                              <StyledQueryName
                                type="button"
                                title={row.name}
                                onClick={() => handleLoad(row)}
                              >
                                {row.name}
                              </StyledQueryName>
                            </StyledQueryRow>
                          );
                        }

                        return (
                          <StyledQueryRow key={row.id} $editing={isEditing}>
                            <StyledQueryBullet>•</StyledQueryBullet>
                            {isEditing ? (
                              <Input
                                value={editingName}
                                changeOnType
                                width="full"
                                maxLength={QUERY_NAME_MAX_LENGTH}
                                autoFocus
                                onChangeFn={setEditingName}
                                onEnterPressFn={acceptEditing}
                                onEscapePressFn={cancelEditing}
                                showSaveExitIcons
                                onBlur={acceptEditing}
                              />
                            ) : (
                              <StyledQueryName
                                type="button"
                                title={row.name}
                                onClick={() => handleLoad(row)}
                              >
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
                </StyledFolderCard>
              ))}
            </StyledFolderList>
          </StyledPanel>
        </FloatingPortal>
      )}

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
