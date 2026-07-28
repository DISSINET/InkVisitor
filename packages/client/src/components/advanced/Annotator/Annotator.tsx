import {
  autoUpdate,
  flip,
  FloatingPortal,
  limitShift,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useMutation, UseMutationResult, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { getStoredUserRole } from "utils/userStorage";
import { v4 as uuidv4 } from "uuid";

import {
  AnchorOpenTagRef,
  Annotator,
  AsymmetricalAnchor,
  EditMode,
  MoveAnchorBoundaryResult,
  Occurrence,
  Tag,
  WarningType,
} from "@inkvisitor/annotator/src/lib";
import { EntityEnums, InterfaceEnums, UserEnums } from "@inkvisitor/shared/enums";
import {
  IDocument,
  IEntity,
  IResponseEntity,
  IResponseGeneric,
  IResponseStatement,
  IResponseTerritory,
  IResponseTree,
  IResponseUser,
  IStatement,
} from "@inkvisitor/shared/types";
import { AxiosResponse } from "axios";
import { CancelButton, Loader, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { EntityTagById } from "components/advanced";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import { CStatement } from "constructors";
import { useDebounce, useDebouncedCallback, useSearchParams, useTheme } from "hooks";
import useKeypress from "hooks/useKeyPress";
import { useAppSelector } from "redux/hooks";
import {
  collectStatementAnchors,
  collectTerritoryAnchors,
  getStatementOrderByIndex,
  getTerritoryHierarchyAtIndex,
  getTerritoryOrderByIndex,
  searchTree,
} from "utils/utils";
import { EntityCreateModal } from "..";
import { FindPanel, resolveEditActions, resolveFindPanel } from "./annotatorChrome";
import { useAnnotator } from "./AnnotatorContext";
import TextAnnotatorMenu from "./AnnotatorMenu/AnnotatorMenu";
import { AnnotatorFindPanel } from "./AnnotatorSearchLine/AnnotatorFindPanel";
import { AnnotatorFindReplaceModal } from "./AnnotatorSearchLine/AnnotatorFindReplaceModal";
import { AnnotatorSequentialAnchorPanel } from "./AnnotatorSearchLine/AnnotatorSequentialAnchorPanel";
import { AnnotatorToolbar } from "./AnnotatorToolbar/AnnotatorToolbar";
import { AnnotatorWarningsModal, WarningsChip } from "./AnnotatorWarningsModal";
import { ANNOTATOR_MENU_PAGE_PADDING, useAnnotatorMenuDrag } from "./hooks/useAnnotatorMenuDrag";
import { useAnnotatorSearch } from "./hooks/useAnnotatorSearch";
import {
  StyledAnnotatorColumn,
  StyledAnnotatorMenu,
  StyledAnnotatorMenuDraggable,
  StyledCanvasWrapper,
  StyledInfoText,
  StyledLinesCanvas,
  StyledMainCanvas,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./styles";
import { ANNOTATOR_LEFT_MARGIN_PX, RATIO, TerritoryCreateModalType, W_SCROLL } from "./types";
import { annotatorHighlight } from "./utils/highlight";

interface TextAnnotatorProps {
  width: number;
  annotatorWidthTooNarrow?: boolean;
  height: number;
  displayLineNumbers: boolean;
  hlEntities?: EntityEnums.Class[];
  documentId?: string;
  thisTerritoryEntityId?: string;

  forwardAnnotator?: (annotator?: Annotator) => void;

  storedAnnotatorScrollPosition?: number | null;
  setStoredAnnotatorScrollPosition?: React.Dispatch<React.SetStateAction<number | null>>;

  territory?: IResponseTerritory;
  // territoryId is from URL params and is used to reset the annotator when the territory changes
  territoryId?: string;
  dataDocument?: IDocument;
  dataDocumentIsFetching: boolean;
  dataDocumentError: Error | null;
  showStatementList?: boolean;

  statementCreateMutation?: UseMutationResult<
    AxiosResponse<IResponseGeneric<IStatement>, any>,
    Error,
    IStatement,
    unknown
  >;

  userData?: IResponseUser;
  disableCreate?: boolean;

  /**
   * Overrides the annotator's context-menu / settings-overlay stacking layers.
   * Both overlays are appended to `document.body`; the library defaults suit a
   * plain page panel (MainPage). A host that mounts the annotator inside a modal
   * (the Documents page) passes higher values so the overlays sit above it.
   */
  overlayZIndex?: { contextMenu: number; settingsOverlay: number };

  /**
   * When false the document is read-only: text editing, adding/removing
   * anchors, batch replace and the annotate menu are disabled (search,
   * highlight and navigation stay). Editors get this when the loaded Resource
   * is not assigned to them. Defaults to true (callers that don't gate are
   * already restricted upstream). The server still enforces the same rule.
   */
  canEditDocument?: boolean;

  /** When the pointer hovers anchored text, receives the innermost tag id or null (e.g. statement list sync). */
  onStatementAnchorHover?: (statementId: string | null) => void;

  // Asymmetrical-anchor warnings (#2601). When the chip is rendered elsewhere
  // (e.g. next to the document title), the parent controls the modal open state
  // and hides the inline chip; otherwise the annotator owns both.
  hideWarningChip?: boolean;
  warningsModalOpen?: boolean;
  onWarningsModalOpenChange?: (open: boolean) => void;
  onAsymmetricalAnchorCountChange?: (count: number) => void;
  /** Fired when RAW/SEMI text edits diverge from the saved document content. */
  onUnsavedTextEditsChange?: (hasUnsaved: boolean) => void;

  /**
   * True while the host has collapsed the annotator box out of view (e.g. the
   * Statement Editor is full-height). The selection menu is portaled over the
   * whole page, so it must be hidden explicitly; the selection itself is kept,
   * so the menu reopens once the annotator is visible again.
   */
  hideSelectionMenu?: boolean;

  /** Host-specific toolbar controls, rendered in the canvas toolbar. */
  toolbarExtras?: ReactNode;
}

export const TextAnnotator = ({
  width = 400,
  annotatorWidthTooNarrow = false,
  height = 500,
  displayLineNumbers = true,
  hlEntities = Object.values(EntityEnums.Class),
  documentId = undefined,
  thisTerritoryEntityId = undefined,

  forwardAnnotator = (undefined) => {},
  storedAnnotatorScrollPosition = null,
  setStoredAnnotatorScrollPosition,

  territory,
  territoryId,
  dataDocument,
  dataDocumentIsFetching = false,
  dataDocumentError,
  showStatementList,

  statementCreateMutation = undefined,
  userData,
  disableCreate = false,
  overlayZIndex,
  canEditDocument = true,
  onStatementAnchorHover,

  hideWarningChip = false,
  warningsModalOpen,
  onWarningsModalOpenChange,
  onAsymmetricalAnchorCountChange,
  onUnsavedTextEditsChange,
  hideSelectionMenu = false,
  toolbarExtras,
}: TextAnnotatorProps) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  // The theme object carries no light/dark discriminator, so read the id from
  // the store for the few canvas values that need it (block-caret alpha).
  const selectedThemeId: InterfaceEnums.Theme = useAppSelector((state) => state.theme);

  const { appendDetailId, statementId, selectedDetailId, setTerritoryId, setStatementId } =
    useSearchParams();

  const { annotator, setAnnotator } = useAnnotator();

  const [annotatorMode, setAnnotatorMode] = useState<EditMode>(EditMode.HIGHLIGHT);
  const [localTextContent, setLocalTextContent] = useState<string>("");
  // Target mode held while the "unsaved text edits" confirm dialog is open
  // (set when the user tries to enter HIGHLIGHT with pending text edits).
  const [pendingModeSwitch, setPendingModeSwitch] = useState<EditMode | null>(null);

  const isChangeMade = useMemo<boolean>(() => {
    if (annotatorMode === EditMode.HIGHLIGHT) {
      // Don't track text changes in highlight mode where it's not relevant
      // anchors are updated instantly and elvl is being added under the hood
      return false;
    } else {
      return localTextContent !== dataDocument?.content;
    }
  }, [localTextContent, dataDocument?.content, annotatorMode]);

  useEffect(() => {
    onUnsavedTextEditsChange?.(isChangeMade);
  }, [isChangeMade, onUnsavedTextEditsChange]);

  const [territoryElvl, setTerritoryElvl] = useState<EntityEnums.Elvl>();

  /** Which document id the current Annotator instance was built for (avoids rebasing canvas onto stale props on the same doc). */
  const annotatorLoadedForDocIdRef = useRef<string | undefined>(undefined);

  const onStatementAnchorHoverRef = useRef(onStatementAnchorHover);
  useEffect(() => {
    onStatementAnchorHoverRef.current = onStatementAnchorHover;
  }, [onStatementAnchorHover]);

  const annotatorModeRef = useRef(annotatorMode);
  useEffect(() => {
    annotatorModeRef.current = annotatorMode;
  }, [annotatorMode]);

  const resetAnnotator = () => {
    annotatorRef.current?.destroy();
    annotatorLoadedForDocIdRef.current = undefined;
    setAnnotator(null);
    forwardAnnotator(undefined);
  };

  // reset annotator on unmount
  useEffect(() => {
    return resetAnnotator;
  }, []);

  useEffect(() => {
    setAnnotatorMode(EditMode.HIGHLIGHT);
  }, [territoryId]);

  const mergeSavedDocumentIntoCache = useCallback(
    (variables: { id: string; doc: Partial<IDocument> }) => {
      queryClient.setQueryData<IDocument | undefined>(["document", variables.id], (old) => {
        if (!old) return old;
        // Merge ONLY content — the single field this save changes. variables.doc
        // is built by spreading the (stale) dataDocument prop, so its entityIds
        // and anchors trail any optimistic update already written into the cache
        // (e.g. statementCreateMutation.onMutate adds the new Statement id to
        // entityIds). Spreading the whole stale doc clobbers those back, so a
        // just-added anchor's highlight blinks off until the refetch lands. Keep
        // the cached entityIds/anchors; the invalidate refetch reconciles them.
        return variables.doc.content !== undefined
          ? { ...old, content: variables.doc.content }
          : old;
      });
    },
    [queryClient],
  );

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (_data, variables) => {
      mergeSavedDocumentIntoCache(variables);
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.info("Document content saved");
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      queryClient.invalidateQueries({ queryKey: ["entity"] });
    },
    onSettled: () => {
      setIsSaving(false);
      setIsSavingWithoutRefresh(false);
    },
  });

  const updateDocumentMutationQuiet = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (_data, variables) => {
      mergeSavedDocumentIntoCache(variables);
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      queryClient.invalidateQueries({ queryKey: ["entity"] });
    },
    onError: () => {
      // The instant anchor save failed, so the cache was never merged and now
      // trails the live canvas. Surface the failure (otherwise silent in quiet
      // mode) and refetch so the canvas reconciles to true server state instead
      // of a later dep change clobbering it with stale content.
      toast.error("Failed to save document changes");
      queryClient.invalidateQueries({ queryKey: ["document"] });
    },
    onSettled: () => {
      setIsSaving(false);
      setIsSavingWithoutRefresh(false);
    },
  });

  const wLineNumbers = displayLineNumbers ? 50 : 0;
  const wTextArea = Math.max(0, width - wLineNumbers - W_SCROLL - ANNOTATOR_LEFT_MARGIN_PX);

  const [isSelectingText, setIsSelectingText] = useState<boolean>(false);

  // Issue #3108 — a selection drag (including dragging a highlight handle) can end
  // with the pointer released OUTSIDE the canvas, where the canvas onMouseUp never
  // fires and isSelectingText would stay stuck true (keeping the anchor menu hidden
  // and the pending selection uncommitted). Reset it on any document mouseup.
  useEffect(() => {
    const onDocumentMouseUp = () => setIsSelectingText(false);
    document.addEventListener("mouseup", onDocumentMouseUp);
    return () => document.removeEventListener("mouseup", onDocumentMouseUp);
  }, []);

  const mainCanvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lines = useRef<HTMLCanvasElement>(null);

  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isSequentialAnchoringOpen, setIsSequentialAnchoringOpen] = useState(false);
  const findInputRef = useRef<HTMLInputElement | null>(null);

  const annotatorRef = useRef<Annotator | null>(null);
  annotatorRef.current = annotator;

  const applyModeSwitch = useCallback((mode: EditMode) => {
    setAnnotatorMode(mode);
    mainCanvas.current?.focus({ preventScroll: true });
  }, []);

  const handleAnnotatorModeClick = useCallback(
    (mode: EditMode) => {
      // Entering HIGHLIGHT with unsaved text edits would silently lose them:
      // HIGHLIGHT forces isChangeMade false, so the next refetch overwrites the
      // canvas with server content (and the next anchor op quiet-saves the
      // pending edits). Make the user resolve the edits before switching.
      if (mode === EditMode.HIGHLIGHT && isChangeMade) {
        setPendingModeSwitch(mode);
        return;
      }
      applyModeSwitch(mode);
    },
    [isChangeMade, applyModeSwitch],
  );

  const confirmDiscardAndSwitch = useCallback(() => {
    if (dataDocument?.content !== undefined) {
      annotator?.updateText(dataDocument.content);
      setLocalTextContent(dataDocument.content);
    }
    if (pendingModeSwitch) {
      applyModeSwitch(pendingModeSwitch);
    }
    setPendingModeSwitch(null);
  }, [annotator, dataDocument?.content, pendingModeSwitch, applyModeSwitch]);

  const confirmSaveAndSwitch = useCallback(async () => {
    await handleSaveNewContent(false);
    if (pendingModeSwitch) {
      applyModeSwitch(pendingModeSwitch);
    }
    setPendingModeSwitch(null);
  }, [pendingModeSwitch, applyModeSwitch]);

  const saveScrollPositionOnScrollEnd = useDebouncedCallback(() => {
    const a = annotatorRef.current;
    if (a && setStoredAnnotatorScrollPosition) {
      setStoredAnnotatorScrollPosition(a.getViewportStartInRawText());
    }
  }, 500);

  useEffect(() => {
    if (!annotator || !setStoredAnnotatorScrollPosition) return;
    annotator.onScroll(() => saveScrollPositionOnScrollEnd());
  }, [annotator, setStoredAnnotatorScrollPosition, saveScrollPositionOnScrollEnd]);

  useEffect(() => {
    if (annotator) {
      annotator.setMode(annotatorMode);
      setSearchOccurences(null);
      setSearchActiveOccurence(0);
      setSearchTerm("");
      annotator.draw();
      if (mainCanvas.current) {
        mainCanvas.current.focus();
      }
    }
  }, [annotatorMode]);

  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedAnchors, setSelectedAnchors] = useState<Tag[]>([]);
  const [selectionStartIndex, setSelectionStartIndex] = useState<number>(-1);
  const [storedEntities, setStoredEntities] = useState<Record<string, IEntity | false>>({});
  const [asymmetricalAnchors, setAsymmetricalAnchors] = useState<AsymmetricalAnchor[]>([]);

  // The warnings modal open state is controllable: when the parent renders the
  // chip elsewhere (next to the document title) it owns the open state; otherwise
  // the annotator owns it. The inline chip is shown only in the uncontrolled case.
  const [internalWarningsOpen, setInternalWarningsOpen] = useState(false);
  const warningsOpen = warningsModalOpen ?? internalWarningsOpen;
  const setWarningsOpen = onWarningsModalOpenChange ?? setInternalWarningsOpen;

  // Report the broken-anchor count to the parent (drives the title-line chip),
  // and close the modal once everything is fixed.
  useEffect(() => {
    onAsymmetricalAnchorCountChange?.(asymmetricalAnchors.length);
    if (asymmetricalAnchors.length === 0) {
      setWarningsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asymmetricalAnchors.length]);

  /** XML (RAW) mode: pointer over `<entityId>` / `</entityId>` markup → preview chip at cursor */
  const [xmlMarkupAnchorHover, setXmlMarkupAnchorHover] = useState<{
    entityId: string;
    x: number;
    y: number;
  } | null>(null);

  const xmlMarkupPreviewPointerInsideRef = useRef(false);
  const xmlMarkupAnchorHoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const documentEntityIds = useMemo(() => {
    const ids = new Set<string>();
    if (dataDocument?.entityIds) {
      for (const list of Object.values(dataDocument.entityIds)) {
        for (const id of list) {
          ids.add(id);
        }
      }
    }
    return ids;
  }, [dataDocument?.entityIds]);

  // following 3 useEffects are related to XML markup anchor hover preview
  // necessary to preserve the EntityTag preview when leaving the <id> markup
  useEffect(() => {
    return () => {
      if (xmlMarkupAnchorHoverClearTimerRef.current !== null) {
        clearTimeout(xmlMarkupAnchorHoverClearTimerRef.current);
        xmlMarkupAnchorHoverClearTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (annotatorMode !== EditMode.RAW) {
      if (xmlMarkupAnchorHoverClearTimerRef.current !== null) {
        clearTimeout(xmlMarkupAnchorHoverClearTimerRef.current);
        xmlMarkupAnchorHoverClearTimerRef.current = null;
      }
      xmlMarkupPreviewPointerInsideRef.current = false;
      setXmlMarkupAnchorHover(null);
    }
  }, [annotatorMode]);

  const handleCreateStatement = async (
    text: string = "",
    statementId: string,
    // start index of selected text
    startIndex: number,
    // following props are only for creation from EntitySuggester -> EntityCreateModal
    entityCreateModalProps?: {
      label: string;
      detail: string;
      territoryId: string;
      language: EntityEnums.Language;
    },
    // target subT chosen in the anchor menu (New Statement button path).
    // The EntitySuggester path carries its target via entityCreateModalProps.territoryId.
    targetTerritoryId?: string,
  ): Promise<void> => {
    if (dataDocument && statementCreateMutation) {
      // take order from the anchors in the document
      // filter only Statements
      const statementAnchors = Array.from(
        new Map(
          collectStatementAnchors(dataDocument.anchors).map((anchor) => [anchor.anchor, anchor]),
        ).values(),
      );

      // the subT the new Statement should land in: an explicitly chosen target
      // (suggester via modal props, or the New Statement button) wins over the
      // active subT opened in the Statement list / Territory tree.
      const effectiveTerritoryId =
        entityCreateModalProps?.territoryId ?? targetTerritoryId ?? territory?.id;

      if (!effectiveTerritoryId) {
        return;
      }

      // statements of the target subT, used to compute the new Statement's order
      // by text index. The active subT already has them loaded; a different subT
      // is fetched on demand.
      const targetStatements: IResponseStatement[] =
        effectiveTerritoryId === territory?.id
          ? territory?.statements || []
          : ((await api.territoryGetStatements(effectiveTerritoryId)).data ?? []);

      const statementIds = new Set(targetStatements.map((s) => s.id));
      // filter only anchors that are in the statement list
      const statementAnchorsInList = statementAnchors.filter((anchor) =>
        statementIds.has(anchor.anchor),
      );

      // Find the last statement anchor with start index before the given startIndex
      const lastAnchorBeforeIndex =
        startIndex !== -1
          ? statementAnchorsInList
              .filter((anchor) => anchor.indexStart < startIndex)
              .sort((a, b) => b.indexStart - a.indexStart)[0] // Sort descending and take first
          : undefined;

      // see the order of the previous start index statement in the statement list and put the new statement after it
      const lastIndexBeforeHighlight =
        targetStatements.findIndex((statement) => statement.id === lastAnchorBeforeIndex?.anchor) ??
        -1;
      const newOrder = getStatementOrderByIndex(lastIndexBeforeHighlight + 1, targetStatements);

      if (userData && statementCreateMutation) {
        if (entityCreateModalProps) {
          const { label, detail, territoryId, language } = entityCreateModalProps;
          const newStatement: IStatement = CStatement(
            userData.role,
            {
              ...userData.options,
              defaultLanguage: language,
            },
            label,
            detail,
            territoryId,
            statementId,
            newOrder,
          );
          await statementCreateMutation?.mutateAsync(newStatement);
        } else {
          const newStatement: IStatement = CStatement(
            getStoredUserRole() as UserEnums.Role,
            userData.options,
            // Statements are not meant to carry a label — the New Statement
            // button no longer fills it with the selected text.
            "",
            "",
            effectiveTerritoryId,
            statementId,
            newOrder,
          );
          await statementCreateMutation?.mutateAsync(newStatement);
        }

        // when the Statement was created in a subT other than the active one,
        // open that subT so the user sees where it landed
        if (effectiveTerritoryId !== territory?.id) {
          setTerritoryId(effectiveTerritoryId);
        }
        // select the new Statement so it opens in the detail/editor, matching
        // the EntitySuggester create-statement path
        setStatementId(statementId);
      }
    }
  };

  const [territoryCreateModalType, setTerritoryCreateModalType] =
    useState<TerritoryCreateModalType>(false);

  // Parent T the new Territory is created under, resolved relative to the target
  // subT chosen in the menu (the in-document T, not the active Tree T): for a
  // child it is the target itself, for a sibling it is the target's parent.
  const [territoryCreateParent, setTerritoryCreateParent] = useState<IEntity | undefined>(
    undefined,
  );

  // Order among the parent's existing child Ts for the new subT, computed from
  // the selection's position relative to sibling Territory anchors in the
  // document — mirrors how a new Statement's order is derived from its anchor.
  const [territoryCreateOrder, setTerritoryCreateOrder] = useState<number>(EntityEnums.Order.Last);

  // isSaving controls refresh of the annotator
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // isSavingWithoutRefresh is the way to preserve the saving state while not refreshing the annotator
  // e.g. when updating an anchor elvl
  const [isSavingWithoutRefresh, setIsSavingWithoutRefresh] = useState<boolean>(false);

  // implementation of draggable menu
  const {
    dragHandleProps: menuDragHandleProps,
    draggableRef: menuDraggableRef,
    dragOffset: menuDragOffset,
  } = useAnnotatorMenuDrag();

  /** Keeps keyboard focus on the annotator canvas when using menu controls; skips inputs and react-select (BaseDropdown) so they stay interactive. */
  // const handleMenuPointerDownCapture = useCallback(
  //   (e: React.PointerEvent<HTMLDivElement>) => {
  //     const target = e.target as HTMLElement;
  //     if (
  //       target.closest(
  //         "input, textarea, select, [contenteditable='true'], label, .react-select-container"
  //       )
  //     ) {
  //       return;
  //     }
  //     e.preventDefault();
  //     queueMicrotask(() => {
  //       mainCanvas.current?.focus({ preventScroll: true });
  //     });
  //   },
  //   []
  // );

  // quiet does not trigger a toast notification
  const handleSaveNewContent = async (
    quiet: boolean,
    skipRefresh: boolean = false,
  ): Promise<void> => {
    if (annotator && documentId) {
      if (skipRefresh) {
        setIsSavingWithoutRefresh(true);
      } else {
        setIsSaving(true);
      }

      const mutation = quiet ? updateDocumentMutationQuiet : updateDocumentMutation;

      await mutation.mutateAsync({
        id: documentId,
        doc: {
          ...dataDocument,
          content: annotator.text.value,
        },
      });
    }
  };

  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    anchors: Tag[];
    index: number;
  } | null>(null);

  const handleTextSelection = (text: string, anchors: Tag[], index: number) => {
    if (annotatorMode === EditMode.HIGHLIGHT) {
      setPendingSelection({ text, anchors, index });
    }
  };

  useEffect(() => {
    // isSelectingText didn't work as expected without the useEffect and pendingSelection so this implementation was necessary
    if (pendingSelection && !isSelectingText) {
      const { text, anchors, index } = pendingSelection;
      setSelectedText(text);
      setSelectedAnchors(anchors);
      setSelectionStartIndex(index);

      setPendingSelection(null);
    }
  }, [pendingSelection, isSelectingText]);

  const { isFetching: isFetchingAnchorEntities } = useQuery({
    queryKey: ["anchorEntities", selectedAnchors],
    queryFn: async () => {
      const uniqueAnchors = [...new Set(selectedAnchors)];
      const entities = await api.entitiesGet(uniqueAnchors.map((anchor) => anchor.getTagName()));

      const data = entities.data ?? [];

      setStoredEntities(
        data.reduce(
          (acc, entity) => {
            acc[entity.id] = entity;
            return acc;
          },
          {} as Record<string, IEntity>,
        ),
      );

      return data;
    },
    enabled: api.isLoggedIn() && selectedAnchors.length > 0,
  });

  const handleAddAnchor = async (entityId: string, elvl?: EntityEnums.Elvl): Promise<void> => {
    annotator?.addAnchor(
      entityId,
      elvl
        ? {
            elvl: elvl,
          }
        : {},
    );
    await handleSaveNewContent(true);
    handleRefreshEntityAndStatement(entityId);
    toast.info(`Anchor created ${entityId}.`);
  };

  const handleRefreshEntityAndStatement = (entityId: string) => {
    // refresh only if statement entity is open in editor or entity in detail
    if (entityId === statementId || entityId === selectedDetailId) {
      setTimeout(() => {
        if (entityId === selectedDetailId) {
          queryClient.invalidateQueries({
            queryKey: ["entity", entityId],
          });
        }
        if (entityId === statementId) {
          queryClient.invalidateQueries({
            queryKey: ["statement", entityId],
          });
        }
      }, 100);
    }
  };

  const refreshAnnotator = () => {
    if (!mainCanvas.current) {
      return;
    }

    // statement anchor hover to highlight the statement in the statement list (HIGHLIGHT mode)
    const registerAnchorHover = (a: Annotator) => {
      a.onAnchorHover((tags: Tag[]) => {
        const cb = onStatementAnchorHoverRef.current;
        if (!cb) {
          return;
        }
        const id = tags.length > 0 ? tags[tags.length - 1].getTagName() : null;
        cb(id);
      });
    };

    // Entity-tag preview on hover: over `<id>` markup in RAW mode, or over a
    // Territory anchor marker in HIGHLIGHT mode (#2887). The annotator only
    // emits a tag in those cases, so no edit-mode gate is needed here.
    const registerAnchorTagMarkupHover = (a: Annotator) => {
      a.onAnchorTagHover((tag: Tag | null, position: { x: number; y: number } | null) => {
        const clearScheduled = xmlMarkupAnchorHoverClearTimerRef;
        const cancelClear = () => {
          if (clearScheduled.current !== null) {
            clearTimeout(clearScheduled.current);
            clearScheduled.current = null;
          }
        };
        const scheduleClear = () => {
          cancelClear();
          clearScheduled.current = setTimeout(() => {
            clearScheduled.current = null;
            if (!xmlMarkupPreviewPointerInsideRef.current) {
              setXmlMarkupAnchorHover(null);
            }
          }, 200);
        };

        if (!tag || !position) {
          if (xmlMarkupPreviewPointerInsideRef.current) {
            return;
          }
          scheduleClear();
          return;
        }
        cancelClear();
        const entityId = tag.getTagName();
        if (!documentEntityIds.has(entityId)) {
          setXmlMarkupAnchorHover(null);
          return;
        }
        setXmlMarkupAnchorHover({
          entityId,
          x: position.x,
          y: position.y,
        });
      });
    };

    const applyCanvasTheme = (a: Annotator) => {
      a.fontColor = theme.color.black;
      a.bgColor = "transparent";
      // The block caret paints over the letter; a light background needs a
      // fainter fill than a dark one for the same readability.
      a.blockCaretOpacity = selectedThemeId === InterfaceEnums.Theme.Dark ? 0.45 : 0.3;
      a.menuColors = {
        bg: theme.color.white,
        text: theme.color.black,
        border: theme.color.gray[400],
        hover: theme.color.menuHover,
        accent: theme.color.blue[400],
        accentText: "#ffffff",
        separator: theme.color.gray[300],
        disabled: theme.color.gray[500],
        buttonBg: theme.color.gray[200],
      };
      a.setSelectStyle("rgb(122, 209, 255)", 0.8, theme.color.black);
      a.setHoverHighlightStyle({
        color: theme.color.entityS,
        opacity: 0.25,
      });
      // #2487 — font families offered in the annotator's Options modal (the
      // proportional-font picker). The annotator owns the choice + persistence;
      // the app just supplies the candidates, defaulting to the application font.
      a.setFontFamilyOptions([
        { label: "Roboto (app sans)", value: '"Roboto", sans-serif' },
        // System option hidden for now because of inconsistent anchor highlight
        // { label: "System UI (system sans)", value: "system-ui, sans-serif" },
        { label: "Georgia (serif)", value: "Georgia, serif" },
      ]);
    };

    // Check if the document content has actually changed
    const currentContent = annotator?.text?.value;
    const newContent = dataDocument?.content ?? "no text";

    const reuseExistingInstance = (contentForLocalState: string = newContent) => {
      if (!annotator) return;
      applyCanvasTheme(annotator);

      annotator.onHighlight((entityId) => {
        if (dataDocument) {
          return annotatorHighlight(
            entityId,
            {
              thisTerritoryEntityId,
              dataDocument,
            },
            hlEntities,
            theme,
          );
        }
      });

      registerAnchorHover(annotator);
      registerAnchorTagMarkupHover(annotator);

      if (localTextContent !== contentForLocalState) {
        setLocalTextContent(contentForLocalState);
      }

      annotator.draw();
    };

    // The Annotator is rebuilt ONLY when the document it was created for changes.
    // Theme, line-number toggles, highlight-entity changes, and props catching up
    // to live canvas edits all update the existing instance in place — never a
    // rebuild — so the constructor runs once per document instead of on every
    // render (which recreated the canvas and snapped scroll back to the top) (#3092).
    if (annotator && annotatorLoadedForDocIdRef.current === documentId) {
      if (
        currentContent !== undefined &&
        currentContent !== newContent &&
        documentId &&
        dataDocument?.id === documentId
      ) {
        if (isChangeMade) {
          // Local edit in progress — keep the live canvas and DON'T touch the
          // query cache. The save posts annotator.text.value (the canvas), not
          // the cached doc, so it can't be clobbered by the stale fetch; and
          // leaving dataDocument.content as the true saved content keeps
          // isChangeMade — and the save/discard buttons — honest after a
          // background refetch. (Writing the canvas into the cache here made
          // content === localTextContent, so the buttons went disabled as if the
          // edits were already saved, and Discard reverted to a no-op.)
          reuseExistingInstance(currentContent);
        } else {
          // Server content is newer (e.g. another user added anchors) — update
          // the annotator's text in place, preserving scroll position.
          annotator.updateText(newContent);
          reuseExistingInstance(newContent);
        }
      } else {
        reuseExistingInstance();
      }
      return;
    }

    const originalMode = annotatorMode;

    const newAnnotator = new Annotator(
      mainCanvas?.current,
      dataDocument?.content ?? "no text",
      RATIO,
    );

    applyCanvasTheme(newAnnotator);

    // Raise the body-appended overlays above the host modal on the Documents
    // page; MainPage leaves the lib defaults (which sit under app modals).
    if (overlayZIndex) {
      newAnnotator.contextMenu.zIndex = overlayZIndex.contextMenu;
      newAnnotator.settingsOverlay.zIndex = overlayZIndex.settingsOverlay;
    }

    if (scroller?.current) {
      newAnnotator.addScroller(scroller.current);
    }

    if (displayLineNumbers && lines.current) {
      newAnnotator.addLines(lines.current);
    }

    newAnnotator.onSelectText(({ text, anchors, index }) => {
      handleTextSelection(text, anchors, index);
    });

    newAnnotator.onHighlight((entityId) => {
      if (dataDocument) {
        return annotatorHighlight(
          entityId,
          {
            thisTerritoryEntityId,
            dataDocument,
          },
          hlEntities,
          theme,
        );
      }
    });

    registerAnchorHover(newAnnotator);
    registerAnchorTagMarkupHover(newAnnotator);

    newAnnotator.onTextChanged((text) => {
      setLocalTextContent(text);
      // Keyboard edits (typing/backspace) mutate the text without running the
      // lib's warning checks (only paste/replace/anchor ops do). Re-validate
      // here so broken anchors surface immediately while editing (#2601).
      newAnnotator.checkAnchors();
    });

    // Structured warnings drive the warnings panel (#2601). onWarning carries
    // the full payload (type + metadata) and fires on every change, including
    // the cleared state, so the panel updates and resets itself.
    newAnnotator.onWarning((warning) => {
      if (warning.type === WarningType.AsymmetricalAnchor) {
        setAsymmetricalAnchors(warning.anchors);
      }
    });
    // Seed the panel immediately for breakage already present on load, so we
    // don't wait for the constructor's deferred first check to emit.
    setAsymmetricalAnchors(newAnnotator.validateAnchors());

    // Set initial text content
    const initialContent = dataDocument?.content ?? "no text";
    setLocalTextContent(initialContent);

    // Ensure the initial render uses the current mode (e.g. HIGHLIGHT hides XML tags).
    // Otherwise we may briefly draw in RAW mode and show tags on first load.
    newAnnotator.setMode(originalMode);

    if (storedAnnotatorScrollPosition != null) {
      // scrollToRawPosition triggers a draw
      newAnnotator.scrollToRawPosition(storedAnnotatorScrollPosition);
    } else {
      newAnnotator.draw();
    }

    setAnnotator(newAnnotator);
    forwardAnnotator(newAnnotator);
    // Record the document this instance was built for (including `undefined` for
    // the no-document placeholder) so the reuse gate above never rebuilds it.
    annotatorLoadedForDocIdRef.current = documentId;
  };

  useEffect(() => {
    if (!dataDocumentIsFetching && !isSaving) {
      refreshAnnotator();
    }
  }, [
    displayLineNumbers,
    hlEntities ?? [],
    dataDocumentIsFetching,
    theme,
    selectedThemeId,
    dataDocument,
    isSaving,
  ]);

  // Tear down an annotator instance when it is replaced or on unmount, so its
  // caret-blink interval and document listeners don't leak (#3092).
  useEffect(() => {
    return () => {
      annotator?.destroy();
    };
  }, [annotator]);

  // The canvas is the only thing the height budget pays for — the toolbar
  // overlays it and the find panels are portalled out of the layout.
  const canvasHeight = Math.max(0, height);

  // Resize the annotator when the width or available canvas height changes
  useEffect(() => {
    if (annotator && mainCanvas.current) {
      annotator?.resize();
    }
  }, [width, canvasHeight]);

  useEffect(() => {
    if (storedAnnotatorScrollPosition !== null) {
      annotator?.scrollToRawPosition(storedAnnotatorScrollPosition);
    }
  }, [width]);

  const onCreateTerritory = async (
    mode: TerritoryCreateModalType,
    elvl: EntityEnums.Elvl,
    // target subT chosen in the menu (the in-document T at the selection);
    // defaults to the active Tree T when no subT is targeted
    targetTerritoryId?: string,
  ): Promise<void> => {
    setTerritoryElvl(elvl);

    const targetId = targetTerritoryId ?? thisTerritoryEntityId;
    if (!mode || !targetId) {
      return;
    }

    const fetchEntity = (id: string) =>
      queryClient.fetchQuery({
        queryKey: ["territory", id],
        queryFn: async () => (await api.entityGet(id)).data ?? undefined,
      });

    try {
      // child → parent is the target itself; sibling → parent is the target's parent
      let parent: IEntity | undefined;
      if (mode === "child-T") {
        parent = await fetchEntity(targetId);
      } else if (mode === "sibling-T") {
        const target = (await fetchEntity(targetId)) as IResponseTerritory | undefined;
        const parentId = target?.data?.parent ? target.data.parent.territoryId : undefined;
        parent = parentId ? await fetchEntity(parentId) : undefined;
      }

      // Place the new subT among its siblings by the selection's text position,
      // the same way a new Statement's order is derived from its anchor.
      let newOrder: number = EntityEnums.Order.Last;
      if (parent && dataDocument) {
        const treeData = await queryClient.fetchQuery<IResponseTree | undefined>({
          queryKey: ["tree"],
          queryFn: async () => (await api.treeGet()).data ?? undefined,
        });
        const parentNode = treeData ? searchTree(treeData, parent.id) : null;
        // sibling Ts of the new subT, sorted by their order under the parent
        const siblings = (parentNode?.children ?? [])
          .map((child) => child.territory)
          .sort(
            (a, b) =>
              (a.data.parent ? a.data.parent.order : 0) - (b.data.parent ? b.data.parent.order : 0),
          );

        // sibling Territory anchors present in this document, deduped by id
        const siblingIds = new Set(siblings.map((t) => t.id));
        const siblingAnchors = Array.from(
          new Map(
            collectTerritoryAnchors(dataDocument.anchors)
              .filter((anchor) => siblingIds.has(anchor.anchor))
              .map((anchor) => [anchor.anchor, anchor]),
          ).values(),
        );

        // last sibling anchor that starts before the selection
        const lastAnchorBeforeIndex =
          selectionStartIndex !== -1
            ? siblingAnchors
                .filter((anchor) => anchor.indexStart < selectionStartIndex)
                .sort((a, b) => b.indexStart - a.indexStart)[0]
            : undefined;

        const lastIndexBeforeSelection = siblings.findIndex(
          (t) => t.id === lastAnchorBeforeIndex?.anchor,
        );
        newOrder = getTerritoryOrderByIndex(lastIndexBeforeSelection + 1, siblings);
      }

      setTerritoryCreateParent(parent);
      setTerritoryCreateOrder(newOrder);
      setTerritoryCreateModalType(mode);
    } catch {
      toast.error("Failed to resolve the target territory");
    }
  };

  const newTerritoryName = useMemo<string>(() => {
    const parentTName = territoryCreateParent?.labels[0];
    if (parentTName) {
      return `subT of ${parentTName}`;
    }
    return "new Territory";
  }, [territoryCreateParent]);

  const onCreateStatement = async (
    elvl: EntityEnums.Elvl,
    // following props are only for creation from EntitySuggester -> EntityCreateModal
    entityCreateModalProps?: {
      label: string;
      detail: string;
      territoryId: string;
      language: EntityEnums.Language;
    },
    // target subT chosen in the New Statement section of the anchor menu
    targetTerritoryId?: string,
  ): Promise<void> => {
    if (handleCreateStatement && selectedText && selectionStartIndex !== -1) {
      const newStatementId = uuidv4();
      // remove linebreaks from text
      const validatedText = selectedText.replace(/\n/g, " ");
      // Create the statement entity BEFORE saving the document with its anchor.
      // The document's preprocess only indexes anchors whose entity already
      // exists in the DB (findReferencedEntityIds / buildAnchorsTree). If the
      // document is saved first, the new statement's id is dropped from the
      // document's entityIds/anchors tree and the anchor stays invisible (in
      // usedInDocuments) until the document is preprocessed again.
      await handleCreateStatement(
        validatedText,
        newStatementId,
        selectionStartIndex,
        entityCreateModalProps
          ? {
              label: entityCreateModalProps.label,
              detail: entityCreateModalProps.detail,
              territoryId: entityCreateModalProps.territoryId,
              language: entityCreateModalProps.language,
            }
          : undefined,
        targetTerritoryId,
      );
      await handleAddAnchor(newStatementId, elvl);
    }
  };

  // The in-document subT hierarchy (Territory anchors) the current selection
  // sits inside, outermost first with nesting depth. Lets the user target the
  // proper subT for the new Statement, showing the chain from the highest subT
  // owning this document's text down to the deepest leaf at the cursor.
  const annotatorPositionHierarchy = useMemo(() => {
    if (!dataDocument || selectionStartIndex === -1) {
      return [];
    }
    return getTerritoryHierarchyAtIndex(dataDocument.anchors, selectionStartIndex);
  }, [dataDocument, selectionStartIndex]);

  const onRemoveAnchor = (anchor: Tag) => {
    annotator?.removeAnchorFromSelection(anchor);
    handleSaveNewContent(true, true);
    handleRefreshEntityAndStatement(anchor.getTagName());
  };

  const onUpdateAnchor = (anchor: Tag, elvl: EntityEnums.Elvl) => {
    annotator?.updateAnchor(anchor, { elvl });
    handleSaveNewContent(true, true);
  };

  // Unlink a broken (asymmetrical) anchor from the warnings panel (#2601).
  // removeAsymmetricalAnchor re-parses, redraws and re-runs the warning checks,
  // so the panel updates itself via the onWarning subscription.
  const onRemoveAsymmetricalAnchor = (tagName: string, position: number, segmentIndex: number) => {
    const removed = annotator?.removeAsymmetricalAnchor(tagName, position, segmentIndex);
    if (removed) {
      handleSaveNewContent(true, true);
      handleRefreshEntityAndStatement(tagName);
    }
  };

  // Jump to a broken anchor in the text. Broken tag markup is only visible in
  // RAW mode, and line positions there match the raw text, so switch first.
  const onScrollToAsymmetricalAnchor = (
    tagName: string,
    position: number,
    segmentIndex: number,
  ) => {
    if (!annotator) {
      return;
    }
    if (annotatorMode !== EditMode.RAW) {
      setAnnotatorMode(EditMode.RAW);
      // Direct setMode is required: it recalculates segments synchronously so
      // the scroll below computes line positions against RAW-mode segments.
      // The annotatorMode effect re-runs setMode next render (harmless no-op).
      annotator.setMode(EditMode.RAW);
    }
    annotator.scrollToAsymmetricalAnchor(tagName, position, segmentIndex);
  };

  // When the document is read-only (e.g. an Editor viewing an unassigned
  // document) the selection menu still appears, but only as a minimal,
  // view-only variant: clipboard + anchors in selection, no create/edit.
  const isMenuReadOnly = !canEditDocument;

  const isMenuDisplayed = useMemo<boolean>(() => {
    return (
      annotatorMode === EditMode.HIGHLIGHT &&
      selectedText !== "" &&
      !isSelectingText &&
      !hideSelectionMenu &&
      dataDocument !== undefined
    );
  }, [annotatorMode, selectedText, isSelectingText, hideSelectionMenu, dataDocument]);

  // #2885 — anchor-move mode. Arrow clicks edit the raw text on the canvas as a
  // live preview but are NOT saved; the user commits a whole series with Done
  // (save) or reverts it with Discard. The raw text is snapshotted when move
  // mode begins so Discard — and any unconfirmed exit (Esc, closing the menu,
  // unmount) — can restore the original span. Moving a boundary only relocates
  // a fixed-length tag, so the total text length is invariant and the snapshot
  // restores exactly.
  const moveAnchorOriginalTextRef = useRef<string | null>(null);
  const moveAnchorDirtyRef = useRef<boolean>(false);
  const moveAnchorActiveRef = useRef<boolean>(false);

  const handleMoveAnchorBegin = (tagName: string, openTagRef: AnchorOpenTagRef) => {
    if (!annotator) {
      return;
    }
    moveAnchorOriginalTextRef.current = annotator.text.value;
    moveAnchorDirtyRef.current = false;
    moveAnchorActiveRef.current = true;
    // Hide the blue selection, pulse the anchor, and bring it into view.
    annotator.beginAnchorResize(tagName, openTagRef);
  };

  const handleMoveAnchorBoundary = (
    tagName: string,
    openTagRef: AnchorOpenTagRef,
    boundary: "open" | "close",
    direction: -1 | 1,
  ): MoveAnchorBoundaryResult | undefined => {
    if (!annotator) {
      return undefined;
    }
    const result = annotator.moveAnchorBoundary(tagName, openTagRef, boundary, direction);
    if (result.status === "moved") {
      moveAnchorDirtyRef.current = true;
    } else if (result.status === "blocked-same-name") {
      toast.info("Cannot move across another anchor of the same entity");
    } else if (result.status === "not-found") {
      toast.warning("Anchor is broken (unpaired) — fix it in the warnings panel");
    }
    return result;
  };

  // #2885 — jump the viewport to the start (open) or end (close) boundary of the
  // anchor being resized, so a long span whose ends sit off the same screen can
  // be located from the move panel.
  const handleLocateAnchorBoundary = (boundary: "open" | "close") => {
    annotator?.scrollResizeAnchorBoundaryIntoView(boundary);
  };

  // Leave resize mode. commit=true (Done) saves the buffered series; otherwise
  // (Discard, Esc, closing the menu, unmount) the moves are reverted. Either
  // way the pulse stops and the frozen selection is unhidden at its original
  // position. Idempotent — safe to call when no resize is active.
  const endMoveAnchor = (commit: boolean) => {
    if (!moveAnchorActiveRef.current) {
      return;
    }
    moveAnchorActiveRef.current = false;
    if (commit) {
      if (moveAnchorDirtyRef.current) {
        handleSaveNewContent(true, true);
      }
    } else if (moveAnchorDirtyRef.current && moveAnchorOriginalTextRef.current !== null) {
      annotator?.updateText(moveAnchorOriginalTextRef.current);
    }
    annotator?.endAnchorResize();
    moveAnchorDirtyRef.current = false;
    moveAnchorOriginalTextRef.current = null;
  };

  // Ref indirection so the menu-close effect and the unmount cleanup always
  // call the latest closure (with the current annotator/document).
  const endMoveAnchorRef = useRef(endMoveAnchor);
  endMoveAnchorRef.current = endMoveAnchor;

  // Any unconfirmed exit reverts the buffered moves: the selection menu
  // disappearing (Esc, clicking elsewhere, selection cleared) and unmount.
  useEffect(() => {
    if (!isMenuDisplayed) {
      endMoveAnchorRef.current(false);
    }
  }, [isMenuDisplayed]);

  useEffect(() => {
    return () => endMoveAnchorRef.current(false);
  }, []);

  const annotatorMenuMiddleware = useMemo(() => {
    if (typeof document === "undefined") return [];
    const page = document.getElementById("page");
    const centerOnPoint = offset(({ rects }) => ({
      mainAxis: -(rects.floating.height || 0) / 2,
    }));
    if (!page) return [centerOnPoint];
    return [
      centerOnPoint,
      flip({
        boundary: page,
        padding: ANNOTATOR_MENU_PAGE_PADDING,
      }),
      shift({
        boundary: page,
        padding: ANNOTATOR_MENU_PAGE_PADDING,
        crossAxis: true,
        limiter: limitShift(),
      }),
    ];
  }, [isMenuDisplayed]);

  const { refs: menuFloatingRefs, floatingStyles: menuFloatingStyles } = useFloating({
    open: isMenuDisplayed,
    placement: "bottom",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: annotatorMenuMiddleware,
  });

  useLayoutEffect(() => {
    if (!isMenuDisplayed) return;
    const page = document.getElementById("page");
    if (!page) return;
    menuFloatingRefs.setPositionReference({
      getBoundingClientRect() {
        const r = page.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return new DOMRect(cx, cy, 0, 0);
      },
      contextElement: page,
    });
  }, [isMenuDisplayed]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchOccurences, setSearchOccurences] = useState<Occurrence[] | null>(null);
  const [isRegexMode, setIsRegexMode] = useState<boolean>(false);
  const [isCaseSensitiveMode, setIsCaseSensitiveMode] = useState<boolean>(false);
  const [isExtendToWholeWordMode, setIsExtendToWholeWordMode] = useState<boolean>(false);
  const [isWholeWordOnlyMode, setIsWholeWordOnlyMode] = useState<boolean>(false);
  const [searchActiveOccurence, setSearchActiveOccurence] = useState<number>(0);

  // annotate tool
  // entity to anchor
  const [entityToAnchor, setEntityToAnchor] = useState<IResponseEntity | null>(null);
  // does the pre-selected anchor exist in the current selection
  const [currentAnchorExist, setCurrentAnchorExist] = useState(false);

  // check if the entity to anchor exists in the current selection
  useEffect(() => {
    annotator?.onSelectText(({ text, anchors, index }) => {
      handleTextSelection(text, anchors, index);
    });
    // searchActiveOccurence is in dependencies to call onSelectText on occurence change
  }, [searchActiveOccurence]);

  useEffect(() => {
    if (!entityToAnchor) {
      setCurrentAnchorExist(false);
    } else if (selectedAnchors.some((anchor) => anchor.getTagName() === entityToAnchor?.id)) {
      setCurrentAnchorExist(true);
    } else {
      setCurrentAnchorExist(false);
    }
  }, [selectedAnchors, entityToAnchor]);

  // Handle search occurrence selection
  useEffect(() => {
    if (searchOccurences !== null) {
      const newSelectedOccurence = searchOccurences[searchActiveOccurence];

      if (newSelectedOccurence) {
        annotator?.selectSearchOccurrence(newSelectedOccurence);
      } else {
        // The term (or a changed search option) no longer matches anything —
        // drop the highlight left over from the previous hit.
        annotator?.clearSelection();
      }
    }
  }, [searchActiveOccurence, searchOccurences]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [searchRefreshKey, setSearchRefreshKey] = useState<number>(0);
  const refreshSearch = useCallback(() => setSearchRefreshKey((key) => key + 1), []);

  // Execute search, react to width changes
  useAnnotatorSearch({
    annotator,
    debouncedSearchTerm,
    isRegexMode,
    width,
    isExtendToWholeWordMode,
    isWholeWordOnlyMode,
    isCaseSensitiveMode,
    annotatorMode,
    searchRefreshKey,
    setSearchOccurences,
    setSearchActiveOccurence,
    setSelectedText,
  });

  const isSearchAllowed = useMemo<boolean>(() => {
    return annotator !== undefined && !!dataDocument;
  }, [annotator, dataDocument]);

  const goToNextOccurence = useCallback(() => {
    if (searchOccurences === null || searchOccurences.length === 0) return;
    setSearchActiveOccurence((searchActiveOccurence + 1) % searchOccurences.length);
  }, [searchOccurences, searchActiveOccurence]);

  const goToPreviousOccurence = useCallback(() => {
    if (searchOccurences === null || searchOccurences.length === 0) return;
    setSearchActiveOccurence(
      (searchActiveOccurence - 1 + searchOccurences.length) % searchOccurences.length,
    );
  }, [searchOccurences, searchActiveOccurence]);

  // Ctrl/Cmd+F opens the find panel for the current mode, or focuses the input
  // of whichever panel is already open. ctrlKeyCombo is true so it fires
  // page-wide rather than only when the canvas holds focus.
  useKeypress(
    "f",
    () => {
      if (!isSearchAllowed) return;
      if (isFindOpen) {
        findInputRef.current?.focus();
        findInputRef.current?.select();
      } else {
        setIsFindOpen(true);
      }
    },
    [isSearchAllowed, isFindOpen],
    true,
  );

  useKeypress("F3", () => isSearchAllowed && goToNextOccurence(), [
    isSearchAllowed,
    goToNextOccurence,
  ]);

  useKeypress(
    "F3",
    () => isSearchAllowed && goToPreviousOccurence(),
    [isSearchAllowed, goToPreviousOccurence],
    false,
    true,
  );

  const findPanel = resolveFindPanel(annotatorMode, isFindOpen, isSequentialAnchoringOpen);

  const editActions = resolveEditActions({
    canEditDocument,
    mode: annotatorMode,
    isChangeMade,
    isSaving,
    isSavingWithoutRefresh,
    dataDocumentIsFetching: Boolean(dataDocumentIsFetching),
  });

  if (dataDocumentError) {
    return <StyledInfoText>Error loading document: {dataDocumentError.message}</StyledInfoText>;
  }

  return (
    <>
      {findPanel === FindPanel.Find && (
        <AnnotatorFindPanel
          onClose={() => setIsFindOpen(false)}
          onOpenSequentialAnchoring={() => setIsSequentialAnchoringOpen(true)}
          canEdit={canEditDocument}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          findInputRef={findInputRef}
          searchOccurences={searchOccurences}
          searchActiveOccurence={searchActiveOccurence}
          goToNextOccurence={goToNextOccurence}
          goToPreviousOccurence={goToPreviousOccurence}
          isCaseSensitiveMode={isCaseSensitiveMode}
          setIsCaseSensitiveMode={setIsCaseSensitiveMode}
          isExtendToWholeWordMode={isExtendToWholeWordMode}
          setIsExtendToWholeWordMode={setIsExtendToWholeWordMode}
          isRegexMode={isRegexMode}
          setIsRegexMode={setIsRegexMode}
        />
      )}

      {findPanel === FindPanel.SequentialAnchor && (
        <AnnotatorSequentialAnchorPanel
          onBack={() => setIsSequentialAnchoringOpen(false)}
          onClose={() => {
            setIsSequentialAnchoringOpen(false);
            setIsFindOpen(false);
          }}
          annotator={annotator}
          documentId={documentId}
          dataDocument={dataDocument}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          findInputRef={findInputRef}
          searchOccurences={searchOccurences}
          searchActiveOccurence={searchActiveOccurence}
          goToNextOccurence={goToNextOccurence}
          goToPreviousOccurence={goToPreviousOccurence}
          isCaseSensitiveMode={isCaseSensitiveMode}
          setIsCaseSensitiveMode={setIsCaseSensitiveMode}
          isExtendToWholeWordMode={isExtendToWholeWordMode}
          setIsExtendToWholeWordMode={setIsExtendToWholeWordMode}
          isRegexMode={isRegexMode}
          setIsRegexMode={setIsRegexMode}
          entityToAnchor={entityToAnchor}
          setEntityToAnchor={setEntityToAnchor}
          currentAnchorExist={currentAnchorExist}
          selectedText={selectedText}
        />
      )}

      {findPanel === FindPanel.FindReplace && (
        <AnnotatorFindReplaceModal
          onClose={() => setIsFindOpen(false)}
          annotator={annotator}
          documentId={documentId}
          dataDocument={dataDocument || undefined}
          dataDocumentIsFetching={dataDocumentIsFetching}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          findInputRef={findInputRef}
          searchOccurences={searchOccurences}
          setSearchOccurences={setSearchOccurences}
          refreshSearch={refreshSearch}
          searchActiveOccurence={searchActiveOccurence}
          setSearchActiveOccurence={setSearchActiveOccurence}
          goToNextOccurence={goToNextOccurence}
          goToPreviousOccurence={goToPreviousOccurence}
          isCaseSensitiveMode={isCaseSensitiveMode}
          setIsCaseSensitiveMode={setIsCaseSensitiveMode}
          isWholeWordOnlyMode={isWholeWordOnlyMode}
          setIsWholeWordOnlyMode={setIsWholeWordOnlyMode}
          isRegexMode={isRegexMode}
          setIsRegexMode={setIsRegexMode}
        />
      )}

      <AnnotatorWarningsModal
        anchors={asymmetricalAnchors}
        onUnlink={onRemoveAsymmetricalAnchor}
        onScrollTo={onScrollToAsymmetricalAnchor}
        open={warningsOpen}
        onOpenChange={setWarningsOpen}
        showChip={false}
        isLoading={isSaving || isSavingWithoutRefresh}
      />

      <StyledAnnotatorColumn
        style={{ width }}
        onKeyDownCapture={(e) => {
          // Cmd/Ctrl+S saves the document. Intercept in capture so it beats the
          // browser's "save page" dialog and the canvas's own keydown. Mirrors
          // the save button's guard (only when an editable doc has pending
          // changes and isn't already saving/fetching).
          if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
            e.preventDefault();
            e.stopPropagation();
            if (
              canEditDocument &&
              isChangeMade &&
              !isSaving &&
              !isSavingWithoutRefresh &&
              !dataDocumentIsFetching
            ) {
              handleSaveNewContent(false);
            }
            return;
          }
          // Block editing keys in RAW/SEMI view-only mode (non-editable documents).
          // Intercept in capture phase so the canvas's own onkeydown never fires.
          if (!canEditDocument && annotatorMode !== EditMode.HIGHLIGHT) {
            const isEditingKey =
              (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) ||
              e.key === "Backspace" ||
              e.key === "Delete" ||
              e.key === "Enter" ||
              e.key === "Tab" ||
              ((e.ctrlKey || e.metaKey) && ["v", "x", "z", "Z", "y", "Y"].includes(e.key));
            if (isEditingKey) {
              e.stopPropagation();
              e.preventDefault();
              return;
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSelectedText("");
            annotator?.clearSelection();
          }
        }}
      >
        <StyledCanvasWrapper>
          {isMenuDisplayed && (
            <FloatingPortal id="page">
              <StyledAnnotatorMenu
                ref={(node) => {
                  menuFloatingRefs.setFloating(node);
                }}
                style={menuFloatingStyles}
              >
                <StyledAnnotatorMenuDraggable
                  ref={menuDraggableRef}
                  // onPointerDownCapture={handleMenuPointerDownCapture}
                  style={{
                    transform: `translate(${menuDragOffset.x}px, ${menuDragOffset.y}px)`,
                  }}
                >
                  {dataDocument && (
                    <TextAnnotatorMenu
                      menuDragHandleProps={menuDragHandleProps}
                      onEscapePressed={() => {
                        setSelectedText("");
                        annotator?.clearSelection();
                      }}
                      anchors={selectedAnchors}
                      text={selectedText}
                      entities={storedEntities}
                      onAnchorAdd={handleAddAnchor}
                      onCreateTerritory={onCreateTerritory}
                      onCreateStatement={onCreateStatement}
                      annotatorPositionHierarchy={annotatorPositionHierarchy}
                      onRemoveAnchor={isMenuReadOnly ? undefined : onRemoveAnchor}
                      onUpdateAnchor={isMenuReadOnly ? undefined : onUpdateAnchor}
                      onMoveAnchorBoundary={isMenuReadOnly ? undefined : handleMoveAnchorBoundary}
                      onMoveAnchorBegin={isMenuReadOnly ? undefined : handleMoveAnchorBegin}
                      onLocateAnchorBoundary={
                        isMenuReadOnly ? undefined : handleLocateAnchorBoundary
                      }
                      onMoveAnchorSave={
                        isMenuReadOnly ? undefined : () => endMoveAnchorRef.current(true)
                      }
                      onMoveAnchorDiscard={
                        isMenuReadOnly ? undefined : () => endMoveAnchorRef.current(false)
                      }
                      readonly={isMenuReadOnly}
                      activeTerritoryId={thisTerritoryEntityId}
                      onCreateActiveTAnchor={async (elvl) => {
                        await handleAddAnchor(thisTerritoryEntityId ?? "", elvl);
                      }}
                      canCreateActiveTAnchor={
                        !dataDocument?.entityIds.T.includes(thisTerritoryEntityId ?? "")
                      }
                      territory={territory}
                      disableCreate={disableCreate || isMenuReadOnly}
                      isLoading={isSaving || isSavingWithoutRefresh || isFetchingAnchorEntities}
                    />
                  )}
                </StyledAnnotatorMenuDraggable>
              </StyledAnnotatorMenu>
            </FloatingPortal>
          )}

          {xmlMarkupAnchorHover && api.isLoggedIn() && (
            <FloatingPortal id="page">
              <div
                style={{
                  position: "fixed",
                  left: xmlMarkupAnchorHover.x - 35,
                  top: xmlMarkupAnchorHover.y + 12,
                  zIndex: 10050,
                  pointerEvents: "auto",
                  maxWidth: 340,
                  borderRadius: 4,
                  backgroundColor: theme.color.white,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                  padding: "4px 8px",
                }}
                onMouseEnter={() => {
                  xmlMarkupPreviewPointerInsideRef.current = true;
                  if (xmlMarkupAnchorHoverClearTimerRef.current !== null) {
                    clearTimeout(xmlMarkupAnchorHoverClearTimerRef.current);
                    xmlMarkupAnchorHoverClearTimerRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  xmlMarkupPreviewPointerInsideRef.current = false;
                  if (xmlMarkupAnchorHoverClearTimerRef.current !== null) {
                    clearTimeout(xmlMarkupAnchorHoverClearTimerRef.current);
                  }
                  xmlMarkupAnchorHoverClearTimerRef.current = setTimeout(() => {
                    xmlMarkupAnchorHoverClearTimerRef.current = null;
                    if (!xmlMarkupPreviewPointerInsideRef.current) {
                      setXmlMarkupAnchorHover(null);
                    }
                  }, 200);
                }}
              >
                <EntityTagById
                  entityId={xmlMarkupAnchorHover.entityId}
                  disableTooltip={false}
                  disableDoubleClick={false}
                  tagMaxWidth={150}
                />
              </div>
            </FloatingPortal>
          )}

          {displayLineNumbers && (
            <StyledLinesCanvas
              ref={lines}
              style={{
                outline: "none",
                width: wLineNumbers,
                height: canvasHeight,
                backgroundColor: theme?.color.white,
                color: theme?.color.gray[450],
                borderRadius: "4px 0px 0px 4px",
              }}
            />
          )}

          <StyledMainCanvas
            onMouseDown={() => setIsSelectingText(true)}
            onMouseUp={() => setIsSelectingText(false)}
            tabIndex={0}
            ref={mainCanvas}
            id="statement-list-annotator-mainCanvas"
            style={{
              height: canvasHeight,
              width: wTextArea,
              backgroundColor: theme.color.white,
              color: theme.color.text,
              outline: "none",
            }}
          />
          <StyledScrollerViewport ref={scroller}>
            <StyledScrollerCursor />
          </StyledScrollerViewport>

          <Loader show={dataDocumentIsFetching} size={40} />

          <AnnotatorToolbar
            annotatorMode={annotatorMode}
            onModeClick={handleAnnotatorModeClick}
            canEditDocument={canEditDocument}
            editActionsVisible={editActions.visible}
            editActionsDisabled={editActions.disabled}
            onDiscard={() => {
              if (dataDocument?.content) {
                annotator?.updateText(dataDocument.content);
                setLocalTextContent(dataDocument.content);
              }
            }}
            onSave={() => handleSaveNewContent(false)}
            isSavePending={isSaving || isSavingWithoutRefresh}
            isSearchAllowed={isSearchAllowed}
            onFindClick={() => setIsFindOpen(true)}
            warningChip={
              !hideWarningChip && asymmetricalAnchors.length > 0 ? (
                <WarningsChip
                  count={asymmetricalAnchors.length}
                  onClick={() => setWarningsOpen(true)}
                />
              ) : undefined
            }
            toolbarExtras={toolbarExtras}
          />
        </StyledCanvasWrapper>
      </StyledAnnotatorColumn>

      {pendingModeSwitch && (
        <Modal
          showModal={!!pendingModeSwitch}
          onClose={() => setPendingModeSwitch(null)}
          onEnterPress={confirmSaveAndSwitch}
          disableBgClick
          isLoading={isSaving}
          width="auto"
        >
          <ModalHeader title="Unsaved text changes" />
          <ModalContent>
            <div>
              You have unsaved text edits. Save or discard them before switching to highlight mode.
            </div>
          </ModalContent>
          <ModalFooter>
            <ButtonGroup>
              <CancelButton onClick={() => setPendingModeSwitch(null)} />
              <Button label="Discard" color="danger" onClick={confirmDiscardAndSwitch} />
              <Button label="Save" color="info" onClick={confirmSaveAndSwitch} />
            </ButtonGroup>
          </ModalFooter>
        </Modal>
      )}

      {territoryCreateModalType && (
        <EntityCreateModal
          closeModal={() => {
            setTerritoryCreateModalType(false);
            setTerritoryElvl(EntityEnums.Elvl.Textual);
            setTerritoryCreateOrder(EntityEnums.Order.Last);
          }}
          allowedEntityClasses={[EntityEnums.Class.Territory]}
          labelTyped={newTerritoryName}
          parentTerritory={territoryCreateParent}
          entityCreateTerritoryOrder={territoryCreateOrder}
          // propagate the anchor elvl (from the Sibling/Child click) into the
          // modal footer, same as the suggester → create-modal path
          anchorElvl={territoryElvl}
          onAnchorElvlChange={setTerritoryElvl}
          onMutationSuccess={async (entity) => {
            await handleAddAnchor(entity.id, territoryElvl);
            setTerritoryCreateModalType(false);
            setTerritoryCreateParent(undefined);
            setTerritoryCreateOrder(EntityEnums.Order.Last);
            setTerritoryElvl(EntityEnums.Elvl.Textual);
            toast.info(`${newTerritoryName} created!`);
            queryClient.invalidateQueries({ queryKey: ["tree"] });
            // select the new T in the tree so it opens as active, matching the
            // new-Statement path that selects its created entity
            setTerritoryId(entity.id);
            appendDetailId(entity.id);
          }}
        />
      )}
    </>
  );
};

export default TextAnnotator;
