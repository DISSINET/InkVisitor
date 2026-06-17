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
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FaPen, FaRegSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import {
  Annotator,
  AsymmetricalAnchor,
  EditMode,
  editModeDisplayLabel,
  Tag,
  WarningType,
} from "@inkvisitor/annotator/src/lib";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import {
  IDocument,
  IEntity,
  IResponseEntity,
  IResponseGeneric,
  IResponseTerritory,
  IResponseUser,
  IStatement,
} from "@inkvisitor/shared/types";
import { AxiosResponse } from "axios";
import { Loader } from "components";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import { CStatement } from "constructors";
import {
  useAnnotatorSearch,
  useDebounce,
  useDebouncedCallback,
  useSearchParams,
  useTheme,
} from "hooks";
import { BsFileTextFill } from "react-icons/bs";
import { HiCodeBracket } from "react-icons/hi2";
import { EntityTagById } from "components/advanced/EntityTag/EntityTagById";
import { collectStatementAnchors, getStatementOrderByIndex } from "utils/utils";
import { EntityCreateModal } from "..";
import { useAnnotator } from "./AnnotatorContext";
import TextAnnotatorMenu from "./AnnotatorMenu";
import { AnnotatorWarningsModal } from "./AnnotatorWarningsModal";
import {
  StyledAnnotatorButtons,
  StyledAnnotatorMenu,
  StyledAnnotatorMenuDraggable,
  StyledCanvasWrapper,
  StyledDisplayModeButtonIconWrapper,
  StyledInfoText,
  StyledLinesCanvas,
  StyledMainCanvas,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./AnnotatorStyles";
import { annotatorHighlight } from "./highlight";
import { ANNOTATOR_LEFT_MARGIN_PX, RATIO, TerritoryCreateModalType, W_SCROLL } from "./types";
import { AnnotatorSearchLine } from "./AnnotatorSearchLine/AnnotatorSearchLine";

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
}

const ANNOTATOR_MENU_PAGE_PADDING = 4;

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
  canEditDocument = true,
  onStatementAnchorHover,

  hideWarningChip = false,
  warningsModalOpen,
  onWarningsModalOpenChange,
  onAsymmetricalAnchorCountChange,
}: TextAnnotatorProps) => {
  const queryClient = useQueryClient();
  const theme = useTheme();

  const { appendDetailId, statementId, selectedDetailId } = useSearchParams();

  const { annotator, setAnnotator } = useAnnotator();

  const [annotatorMode, setAnnotatorMode] = useState<EditMode>(EditMode.HIGHLIGHT);
  const [localTextContent, setLocalTextContent] = useState<string>("");

  const isChangeMade = useMemo<boolean>(() => {
    if (annotatorMode === EditMode.HIGHLIGHT) {
      // Don't track text changes in highlight mode where it's not relevant
      // anchors are updated instantly and elvl is being added under the hood
      return false;
    } else {
      return localTextContent !== dataDocument?.content;
    }
  }, [localTextContent, dataDocument?.content]);

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

  const parentTerritoryId = territory?.data?.parent
    ? territory?.data?.parent?.territoryId
    : undefined;

  const { data: dataParentTerritory } = useQuery({
    queryKey: ["territory", parentTerritoryId as string],
    queryFn: async () => {
      if (parentTerritoryId) {
        const res = await api.entityGet(parentTerritoryId);
        return res.data ?? undefined;
      }
      return undefined;
    },
    enabled: !!parentTerritoryId,
  });

  const mergeSavedDocumentIntoCache = useCallback(
    (variables: { id: string; doc: Partial<IDocument> }) => {
      queryClient.setQueryData<IDocument | undefined>(["document", variables.id], (old) =>
        old ? { ...old, ...variables.doc } : old,
      );
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
  const warningsPanelRef = useRef<HTMLDivElement>(null);
  const annotatorRef = useRef<Annotator | null>(null);
  annotatorRef.current = annotator;

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

  // Rendered height of the warnings chip (incl. its bottom gap). The canvas has
  // a fixed pixel height fed by the parent, so the chip's height must be
  // subtracted from it to keep the bottom controls visible (#2601).
  const [warningsPanelHeight, setWarningsPanelHeight] = useState<number>(0);

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
  ): Promise<void> => {
    if (dataDocument && statementCreateMutation) {
      // take order from the anchors in the document
      // filter only Statements
      const statementAnchors = Array.from(
        new Map(
          collectStatementAnchors(dataDocument.anchors).map((anchor) => [anchor.anchor, anchor]),
        ).values(),
      );
      const territoryStatements = territory?.statements || [];

      const statementIds = new Set(territoryStatements.map((s) => s.id));
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
        territoryStatements.findIndex(
          (statement) => statement.id === lastAnchorBeforeIndex?.anchor,
        ) ?? -1;
      const newOrder = getStatementOrderByIndex(lastIndexBeforeHighlight + 1, territoryStatements);

      if (userData && territory && statementCreateMutation) {
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
            localStorage.getItem("userrole") as UserEnums.Role,
            userData.options,
            text,
            "",
            territory.id,
            statementId,
            newOrder,
          );
          await statementCreateMutation?.mutateAsync(newStatement);
        }
      }
    }
  };

  const [territoryCreateModalType, setTerritoryCreateModalType] =
    useState<TerritoryCreateModalType>(false);

  // isSaving controls refresh of the annotator
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // isSavingWithoutRefresh is the way to preserve the saving state while not refreshing the annotator
  // e.g. when updating an anchor elvl
  const [isSavingWithoutRefresh, setIsSavingWithoutRefresh] = useState<boolean>(false);

  // implementation of draggable menu
  const [menuDragOffset, setMenuDragOffset] = useState({ x: 0, y: 0 });
  const menuDragOffsetRef = useRef(menuDragOffset);
  menuDragOffsetRef.current = menuDragOffset;

  const menuDragSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const menuDragHandleRef = useRef<HTMLDivElement | null>(null);
  const menuDragWindowListenersRef = useRef<AbortController | null>(null);

  const menuDraggableRef = useRef<HTMLDivElement | null>(null);

  const endMenuDrag = useCallback((ev?: { pointerId: number }) => {
    const session = menuDragSessionRef.current;
    if (!session) return;
    if (ev !== undefined && ev.pointerId !== session.pointerId) return;

    menuDragWindowListenersRef.current?.abort();
    menuDragWindowListenersRef.current = null;

    const el = menuDragHandleRef.current;
    try {
      el?.releasePointerCapture(session.pointerId);
    } catch {
      /* capture already released */
    }
    menuDragHandleRef.current = null;
    menuDragSessionRef.current = null;
  }, []);

  const handleMenuDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      menuDragWindowListenersRef.current?.abort();
      const ac = new AbortController();
      menuDragWindowListenersRef.current = ac;
      const signal = ac.signal;
      const pointerId = e.pointerId;

      menuDragHandleRef.current = e.currentTarget;
      e.currentTarget.setPointerCapture(pointerId);
      menuDragSessionRef.current = {
        pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originX: menuDragOffsetRef.current.x,
        originY: menuDragOffsetRef.current.y,
      };

      const opts = { capture: true, signal } as const;
      const onWindowPointerEnd = (wev: PointerEvent) => {
        if (wev.pointerId !== pointerId) return;
        endMenuDrag(wev);
      };
      window.addEventListener("pointerup", onWindowPointerEnd, opts);
      window.addEventListener("pointercancel", onWindowPointerEnd, opts);
      window.addEventListener("blur", () => endMenuDrag(), opts);
      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.visibilityState === "hidden") endMenuDrag();
        },
        opts,
      );
    },
    [endMenuDrag],
  );

  const handleMenuDragPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const session = menuDragSessionRef.current;
    if (!session || e.pointerId !== session.pointerId) return;
    e.preventDefault();
    const page = document.getElementById("page");
    const menuEl = menuDraggableRef.current;
    let px = session.originX + (e.clientX - session.startClientX);
    let py = session.originY + (e.clientY - session.startClientY);

    if (page && menuEl) {
      const pr = page.getBoundingClientRect();
      const pad = ANNOTATOR_MENU_PAGE_PADDING;
      const mr = menuEl.getBoundingClientRect();
      const cur = menuDragOffsetRef.current;
      const innerLeft = (x: number) => mr.left + (x - cur.x);
      const innerTop = (y: number) => mr.top + (y - cur.y);
      for (let i = 0; i < 4; i++) {
        const l = innerLeft(px);
        const t = innerTop(py);
        const r = l + mr.width;
        const b = t + mr.height;
        if (l < pr.left + pad) px += pr.left + pad - l;
        if (t < pr.top + pad) py += pr.top + pad - t;
        if (r > pr.right - pad) px -= r - (pr.right - pad);
        if (b > pr.bottom - pad) py -= b - (pr.bottom - pad);
      }
    }

    setMenuDragOffset({ x: px, y: py });
  }, []);

  const handleMenuDragPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endMenuDrag(e.nativeEvent);
    },
    [endMenuDrag],
  );

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

    // XML markup anchor hover to preview the entity tag when hovering over the <id> markup (RAW mode)
    const registerAnchorTagMarkupHover = (a: Annotator) => {
      a.onAnchorTagHover((tag: Tag | null, position: { x: number; y: number } | null) => {
        if (annotatorModeRef.current !== EditMode.RAW) {
          return;
        }
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
      a.setSelectStyle("turquoise", 0.8, theme.color.black);
      a.setHoverHighlightStyle({
        color: theme.color.entityS,
        opacity: 0.25,
      });
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
      // Props lag behind the live canvas (e.g. after anchor + save before the
      // refetch lands): keep the live instance and sync the query cache instead
      // of rebuilding from the stale dataDocument.
      if (
        currentContent !== undefined &&
        currentContent !== newContent &&
        documentId &&
        dataDocument?.id === documentId
      ) {
        queryClient.setQueryData<IDocument | undefined>(["document", documentId], (old) => {
          if (!old || old.id !== documentId) return old;
          return { ...old, content: currentContent };
        });
        reuseExistingInstance(currentContent);
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
  }, [displayLineNumbers, hlEntities ?? [], dataDocumentIsFetching, theme, dataDocument, isSaving]);

  // Tear down an annotator instance when it is replaced or on unmount, so its
  // caret-blink interval and document listeners don't leak (#3092).
  useEffect(() => {
    return () => {
      annotator?.destroy();
    };
  }, [annotator]);

  // Measure the warnings panel so the canvas can give up exactly its height.
  useEffect(() => {
    const el = warningsPanelRef.current;
    if (!el) {
      return;
    }
    const update = () => setWarningsPanelHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The canvas keeps its fixed pixel height minus whatever the panel occupies.
  const canvasHeight = Math.max(0, height - warningsPanelHeight);

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

  const onCreateTerritory = (mode: TerritoryCreateModalType, elvl: EntityEnums.Elvl) => {
    setTerritoryCreateModalType(mode);
    setTerritoryElvl(elvl);
  };

  const newTerritoryName = useMemo<string>(() => {
    const thisTName = territory?.labels[0];
    const parentTName = dataParentTerritory?.labels[0];

    if (territoryCreateModalType === "sibling-T") {
      return `subT of ${parentTName}`;
    } else if (territoryCreateModalType === "child-T") {
      return `subT of ${thisTName}`;
    }
    return "new Territory";
  }, [territoryCreateModalType, territory]);

  const onCreateStatement = async (
    elvl: EntityEnums.Elvl,
    // following props are only for creation from EntitySuggester -> EntityCreateModal
    entityCreateModalProps?: {
      label: string;
      detail: string;
      territoryId: string;
      language: EntityEnums.Language;
    },
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
      );
      await handleAddAnchor(newStatementId, elvl);
    }
  };

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
      dataDocument !== undefined
    );
  }, [annotatorMode, selectedText, isSelectingText, dataDocument]);

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

  const hasParentT = territory?.data?.parent !== undefined;

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchOccurences, setSearchOccurences] = useState<
    { segmentIndex: number; lineIndex: number; start: number; end: number }[] | null
  >(null);
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
      }
    }
  }, [searchActiveOccurence, searchOccurences]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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
    setSearchOccurences,
    setSearchActiveOccurence,
    setSelectedText,
  });

  const isSearchAllowed = useMemo<boolean>(() => {
    return annotator !== undefined && !!dataDocument;
  }, [annotator, dataDocument]);

  if (dataDocumentError) {
    return <StyledInfoText>Error loading document: {dataDocumentError.message}</StyledInfoText>;
  }

  return (
    <>
      <AnnotatorSearchLine
        showStatementList={showStatementList ?? false}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchOccurences={searchOccurences}
        searchActiveOccurence={searchActiveOccurence}
        isSearchAllowed={isSearchAllowed}
        annotatorWidthTooNarrow={annotatorWidthTooNarrow}
        setSearchActiveOccurence={setSearchActiveOccurence}
        annotator={annotator}
        documentId={documentId}
        dataDocument={dataDocument || undefined}
        setEntityToAnchor={setEntityToAnchor}
        entityToAnchor={entityToAnchor}
        currentAnchorExist={currentAnchorExist}
        annotatorMode={annotatorMode}
        selectedText={selectedText}
        setSearchOccurences={setSearchOccurences}
        isRegexMode={isRegexMode}
        setIsRegexMode={setIsRegexMode}
        dataDocumentIsFetching={dataDocumentIsFetching}
        isExtendToWholeWordMode={isExtendToWholeWordMode}
        setIsExtendToWholeWordMode={setIsExtendToWholeWordMode}
        isWholeWordOnlyMode={isWholeWordOnlyMode}
        setIsWholeWordOnlyMode={setIsWholeWordOnlyMode}
        isCaseSensitiveMode={isCaseSensitiveMode}
        setIsCaseSensitiveMode={setIsCaseSensitiveMode}
        canEdit={canEditDocument}
      />

      <div
        ref={warningsPanelRef}
        style={{
          paddingBottom: !hideWarningChip && asymmetricalAnchors.length > 0 ? "0.5rem" : 0,
        }}
      >
        <AnnotatorWarningsModal
          anchors={asymmetricalAnchors}
          onUnlink={onRemoveAsymmetricalAnchor}
          onScrollTo={onScrollToAsymmetricalAnchor}
          open={warningsOpen}
          onOpenChange={setWarningsOpen}
          showChip={!hideWarningChip}
          isLoading={isSaving || isSavingWithoutRefresh}
        />
      </div>

      <div
        style={{
          width,
          position: "relative",
          paddingLeft: ANNOTATOR_LEFT_MARGIN_PX,
        }}
        onKeyDownCapture={(e) => {
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
        <StyledCanvasWrapper style={{ position: "relative" }}>
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
                      menuDragHandleProps={{
                        onPointerDown: handleMenuDragPointerDown,
                        onPointerMove: handleMenuDragPointerMove,
                        onPointerUp: handleMenuDragPointerUp,
                        onPointerCancel: handleMenuDragPointerUp,
                      }}
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
                      onRemoveAnchor={isMenuReadOnly ? undefined : onRemoveAnchor}
                      onUpdateAnchor={isMenuReadOnly ? undefined : onUpdateAnchor}
                      readonly={isMenuReadOnly}
                      isTextInsideThisT={selectedAnchors.some(
                        (anchor) => anchor.getTagName() === thisTerritoryEntityId,
                      )}
                      activeTerritoryId={thisTerritoryEntityId}
                      onCreateActiveTAnchor={async (elvl) => {
                        await handleAddAnchor(thisTerritoryEntityId ?? "", elvl);
                      }}
                      canCreateActiveTAnchor={
                        !dataDocument?.entityIds.T.includes(thisTerritoryEntityId ?? "")
                      }
                      hasParentT={hasParentT}
                      territory={territory}
                      disableCreate={disableCreate || isMenuReadOnly}
                      isLoading={isSaving || isSavingWithoutRefresh || isFetchingAnchorEntities}
                    />
                  )}
                </StyledAnnotatorMenuDraggable>
              </StyledAnnotatorMenu>
            </FloatingPortal>
          )}

          {xmlMarkupAnchorHover && annotatorMode === EditMode.RAW && api.isLoggedIn() && (
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
                <EntityTagById entityId={xmlMarkupAnchorHover.entityId} disableTooltip={false} />
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
        </StyledCanvasWrapper>

        <StyledAnnotatorButtons>
          <ButtonGroup $marginTop>
            <Button
              key={EditMode.HIGHLIGHT}
              icon={
                <StyledDisplayModeButtonIconWrapper
                  $annotatorWidthTooNarrow={annotatorWidthTooNarrow}
                >
                  <FaPen size={11} />
                </StyledDisplayModeButtonIconWrapper>
              }
              label={!annotatorWidthTooNarrow ? editModeDisplayLabel[EditMode.HIGHLIGHT] : ""}
              color="success"
              inverted={annotatorMode !== EditMode.HIGHLIGHT}
              onClick={() => {
                setAnnotatorMode(EditMode.HIGHLIGHT);
              }}
              tooltipLabel="anchor entities"
              tooltipPosition="top"
            />
            <Button
              key={EditMode.SEMI}
              icon={
                <StyledDisplayModeButtonIconWrapper
                  $annotatorWidthTooNarrow={annotatorWidthTooNarrow}
                >
                  <BsFileTextFill size={11} />
                </StyledDisplayModeButtonIconWrapper>
              }
              color="success"
              label={!annotatorWidthTooNarrow ? editModeDisplayLabel[EditMode.SEMI] : ""}
              inverted={annotatorMode !== EditMode.SEMI}
              onClick={() => {
                setAnnotatorMode(EditMode.SEMI);
              }}
              tooltipLabel={canEditDocument ? "edit plain text" : "view plain text"}
              tooltipPosition="top"
            />
            <Button
              key={EditMode.RAW}
              icon={
                <StyledDisplayModeButtonIconWrapper
                  $annotatorWidthTooNarrow={annotatorWidthTooNarrow}
                >
                  <HiCodeBracket size={11} />
                </StyledDisplayModeButtonIconWrapper>
              }
              color="success"
              label={!annotatorWidthTooNarrow ? editModeDisplayLabel[EditMode.RAW] : ""}
              inverted={annotatorMode !== EditMode.RAW}
              onClick={() => {
                setAnnotatorMode(EditMode.RAW);
              }}
              tooltipLabel={canEditDocument ? "display and edit XML" : "display XML"}
              tooltipPosition="top"
            />
          </ButtonGroup>

          {canEditDocument && (
            <ButtonGroup $marginTop style={{ marginLeft: "0.5rem" }}>
              <Button
                label="discard"
                color="greyer"
                inverted
                icon={<FaTrash />}
                disabled={
                  !isChangeMade || isSaving || isSavingWithoutRefresh || dataDocumentIsFetching
                }
                onClick={() => {
                  if (dataDocument?.content) {
                    annotator?.updateText(dataDocument?.content);
                    setLocalTextContent(dataDocument.content);
                  }
                }}
              />
              <span style={{ display: "flex", position: "relative" }}>
                <Button
                  label="save"
                  color="info"
                  icon={<FaRegSave size={14} />}
                  disabled={
                    !isChangeMade || isSaving || isSavingWithoutRefresh || dataDocumentIsFetching
                  }
                  onClick={() => {
                    handleSaveNewContent(false);
                  }}
                />
                <Loader show={isSaving || isSavingWithoutRefresh} size={14} />
              </span>
            </ButtonGroup>
          )}
        </StyledAnnotatorButtons>
      </div>

      {territory && territoryCreateModalType && (
        <EntityCreateModal
          closeModal={() => {
            setTerritoryCreateModalType(false);
            setTerritoryElvl(EntityEnums.Elvl.Textual);
          }}
          allowedEntityClasses={[EntityEnums.Class.Territory]}
          labelTyped={newTerritoryName}
          parentTerritory={
            territoryCreateModalType === "sibling-T" ? dataParentTerritory : territory
          }
          onMutationSuccess={async (entity) => {
            await handleAddAnchor(entity.id, territoryElvl);
            setTerritoryCreateModalType(false);
            setTerritoryElvl(EntityEnums.Elvl.Textual);
            toast.info(`${newTerritoryName} created!`);
            queryClient.invalidateQueries({ queryKey: ["tree"] });
            appendDetailId(entity.id);
          }}
        />
      )}
    </>
  );
};

export default TextAnnotator;
