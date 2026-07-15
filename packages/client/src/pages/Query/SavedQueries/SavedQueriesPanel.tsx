import { UserEnums } from "@inkvisitor/shared/enums";
import { ISavedQuery, ISavedQueryCreate, Query } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, Checkbox, Submit } from "components";
import { useSavedQueriesQuery, useUserQuery } from "hooks/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  IcoChevronDown,
  IcoChevronRight,
  IcoCloseMd,
  IcoFolderOpen,
  IcoSave,
  IcoTrash,
} from "Theme/icons";
import { QueryAction, QueryActionType } from "../Query/state";
import { EXAMPLE_QUERIES, IExampleQuery } from "./exampleQueries";
import {
  StyledCloseButton,
  StyledDeleteButton,
  StyledEmptyNote,
  StyledFolderCount,
  StyledFolderHeader,
  StyledFolderList,
  StyledNameInput,
  StyledPanel,
  StyledPanelHeader,
  StyledPanelTitle,
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
    setIsOpen(false);
    toast.info(`Query "${row.name}" loaded`);
  };

  // "ownerId" only exists on real saved queries, never on example rows — used
  // as the discriminant (structural overlap between the two types means a
  // guard based on negating an "is IExampleQuery" check would narrow to
  // `never`, so check the real-query field directly instead).
  const canDelete = (row: FolderRow): row is ISavedQuery =>
    "ownerId" in row && (row.ownerId === userId || isAdminOrOwner);

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
            <StyledNameInput
              value={saveName}
              aria-label="name for the current query"
              placeholder="name for the current query"
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
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
                  {openFolders[key] ? <IcoChevronDown size={11} /> : <IcoChevronRight size={14} />}
                  <IcoFolderOpen size={13} />
                  {label}
                  <StyledFolderCount>({rows.length})</StyledFolderCount>
                </StyledFolderHeader>

                {openFolders[key] &&
                  (rows.length === 0 ? (
                    <StyledEmptyNote>no queries</StyledEmptyNote>
                  ) : (
                    rows.map((row) => (
                      <StyledQueryRow key={row.id}>
                        <StyledQueryName type="button" onClick={() => handleLoad(row)}>
                          {row.name}
                        </StyledQueryName>
                        {canDelete(row) && (
                          <StyledDeleteButton
                            type="button"
                            aria-label={`Delete ${row.name}`}
                            onClick={() => setDeleteTarget(row)}
                          >
                            <IcoTrash size={12} />
                          </StyledDeleteButton>
                        )}
                      </StyledQueryRow>
                    ))
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
