import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "api";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaPen, FaRegSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import { Annotator, EditMode, Tag } from "@inkvisitor/annotator/src/lib";
import {
  IDocument,
  IEntity,
  IResponseEntity,
  IResponseGeneric,
  IResponseTerritory,
  IResponseUser,
  IStatement,
} from "@shared/types";
import { EntityEnums, UserEnums } from "@shared/enums";
import { AxiosResponse } from "axios";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import { CStatement } from "constructors";
import { useDebounce, useSearchParams, useTheme } from "hooks";
import { BsFileTextFill } from "react-icons/bs";
import { HiCodeBracket } from "react-icons/hi2";
import { collectStatementAnchors, getStatementOrderByIndex } from "utils/utils";
import { EntityCreateModal } from "..";
import { useAnnotator } from "./AnnotatorContext";
import TextAnnotatorMenu from "./AnnotatorMenu";
import {
  StyledAnnotatorButtons,
  StyledAnnotatorMenu,
  StyledCanvasWrapper,
  StyledDisplayModeButtonIconWrapper,
  StyledInfoText,
  StyledLinesCanvas,
  StyledMainCanvas,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./AnnotatorStyles";
import { annotatorHighlight } from "./highlight";
import { RATIO, TerritoryCreateModalType, W_SCROLL } from "./types";
import { StatementListSearchLine } from "pages/Main/containers/StatementsListBox/StatementListSearchLine/StatementListSearchLine";
import { Loader } from "components";
interface TextAnnotatorProps {
  width: number;
  annotatorWidthTooNarrow?: boolean;
  height: number;
  displayLineNumbers: boolean;
  hlEntities?: EntityEnums.Class[];
  documentId: string;
  thisTerritoryEntityId?: string;

  forwardAnnotator?: (annotator?: Annotator) => void;

  storedAnnotatorScroll?: number;
  setStoredAnnotatorScroll?: React.Dispatch<React.SetStateAction<number>>;

  territory?: IResponseTerritory;
  dataDocument?: IDocument;
  dataDocumentIsFetching?: boolean;
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
  statementListBoxRef?: React.RefObject<HTMLDivElement | null>;
}

export const TextAnnotator = ({
  width = 400,
  annotatorWidthTooNarrow = false,
  statementListBoxRef,
  height = 500,
  displayLineNumbers = true,
  hlEntities = Object.values(EntityEnums.Class),
  documentId,
  thisTerritoryEntityId = undefined,

  storedAnnotatorScroll = 0,
  forwardAnnotator = (undefined) => {},
  setStoredAnnotatorScroll = () => {},

  territory,
  dataDocument,
  dataDocumentIsFetching,
  dataDocumentError,
  showStatementList,

  statementCreateMutation = undefined,
  userData,
  disableCreate = false,
}: TextAnnotatorProps) => {
  const queryClient = useQueryClient();
  const theme = useTheme();

  const { appendDetailId, statementId, selectedDetailId } = useSearchParams();

  const { annotator, setAnnotator } = useAnnotator();

  const [localTextContent, setLocalTextContent] = useState<string>("");

  const [territoryElvl, setTerritoryElvl] = useState<EntityEnums.Elvl>();

  useEffect(() => {
    return forwardAnnotator(undefined);
  }, []);

  const parentTerritoryId = territory?.data?.parent
    ? territory?.data?.parent?.territoryId
    : undefined;

  const { data: dataParentTerritory } = useQuery({
    queryKey: ["territory", parentTerritoryId as string],
    queryFn: async () => {
      const res = await api.entityGet(parentTerritoryId as string);
      return res.data;
    },
    enabled: !!parentTerritoryId,
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.info("Document content saved");
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const updateDocumentMutationQuiet = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const wLineNumbers = displayLineNumbers ? 50 : 0;
  const wTextArea = width - wLineNumbers - W_SCROLL;

  const [isSelectingText, setIsSelectingText] = useState<boolean>(false);

  const mainCanvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lines = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [annotatorMode, setAnnotatorMode] = useState<EditMode>(
    EditMode.HIGHLIGHT
  );

  useEffect(() => {
    if (annotator) {
      annotator.setMode(annotatorMode);
      setSearchOccurences(null);
      setSearchActiveOccurence(0);
      setSearchTerm("");
    }
  }, [annotatorMode]);

  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedAnchors, setSelectedAnchors] = useState<Tag[]>([]);
  const [selectionStartIndex, setSelectionStartIndex] = useState<number>(-1);
  const [storedEntities, setStoredEntities] = useState<
    Record<string, IEntity | false>
  >({});

  const handleCreateStatement = (
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
    }
  ) => {
    if (dataDocument && statementCreateMutation) {
      // take order from the anchors in the document
      // filter only Statements
      const statementAnchors = Array.from(
        new Map(
          collectStatementAnchors(dataDocument.anchors).map((anchor) => [
            anchor.anchor,
            anchor,
          ])
        ).values()
      );
      const territoryStatements = territory?.statements || [];

      const statementIds = new Set(territoryStatements.map((s) => s.id));
      // filter only anchors that are in the statement list
      const statementAnchorsInList = statementAnchors.filter((anchor) =>
        statementIds.has(anchor.anchor)
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
          (statement) => statement.id === lastAnchorBeforeIndex?.anchor
        ) ?? -1;
      const newOrder = getStatementOrderByIndex(
        lastIndexBeforeHighlight + 1,
        territoryStatements
      );

      if (userData && territory && statementCreateMutation) {
        if (entityCreateModalProps) {
          const { label, detail, territoryId, language } =
            entityCreateModalProps;
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
            newOrder
          );
          statementCreateMutation?.mutate(newStatement);
        } else {
          const newStatement: IStatement = CStatement(
            localStorage.getItem("userrole") as UserEnums.Role,
            userData.options,
            text,
            "",
            territory.id,
            statementId,
            newOrder
          );
          statementCreateMutation?.mutate(newStatement);
        }
      }
    }
  };

  const [territoryCreateModalType, setTerritoryCreateModalType] =
    useState<TerritoryCreateModalType>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { refs, floatingStyles } = useFloating({
    placement: "bottom",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset({
        mainAxis: annotator?.lineHeight
          ? (annotator.lineHeight / RATIO) * 1.2
          : 30,
        // crossAxis: wTextArea / 2 + 100,
        // crossAxis: 100,
      }),
      flip({
        padding: 10,
        fallbackPlacements: ["top"],
      }),
      shift({
        padding: 10,
        crossAxis: true,
      }),
    ],
  });

  useEffect(() => {
    if (annotator?.cursor?.selectStart && annotator?.cursor?.selectEnd) {
      const canvas = mainCanvas.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const startX =
          rect.left + annotator.cursor.selectStart.xLine * annotator.charWidth;
        const startY =
          rect.top +
          ((annotator.cursor.selectStart.yLine - annotator.viewport.lineStart) *
            annotator.lineHeight) /
            RATIO;
        const endX =
          rect.left + annotator.cursor.selectEnd.xLine * annotator.charWidth;
        const endY =
          rect.top +
          ((annotator.cursor.selectEnd.yLine - annotator.viewport.lineStart) *
            annotator.lineHeight) /
            RATIO;

        // Check if selection spans the entire document
        const isFullSelection =
          annotator.cursor.selectStart.yLine === 0 &&
          annotator.cursor.selectEnd.yLine >= annotator.viewport.noLines - 1;

        // Determine if selection is backwards (end to start)
        const isBackwardsSelection =
          annotator.cursor.selectEnd.yLine <
            annotator.cursor.selectStart.yLine ||
          (annotator.cursor.selectEnd.yLine ===
            annotator.cursor.selectStart.yLine &&
            annotator.cursor.selectEnd.xLine <
              annotator.cursor.selectStart.xLine);

        // Use end position for backwards selection, start position for forwards selection
        const menuX = isBackwardsSelection ? endX : startX;
        const menuY = isBackwardsSelection ? endY : startY;

        // Create a virtual element for the reference point that represents the selection
        const virtualElement = {
          getBoundingClientRect: () => ({
            x: menuX,
            y: isFullSelection ? rect.top + rect.height / 2 : menuY,
            width: Math.abs(endX - startX),
            height: isFullSelection ? 0 : Math.abs(endY - startY),
            top: isFullSelection ? rect.top + rect.height / 2 : menuY,
            right: Math.max(startX, endX),
            bottom: isFullSelection
              ? rect.top + rect.height / 2
              : Math.max(startY, endY),
            left: Math.min(startX, endX),
          }),
        };

        refs.setPositionReference(virtualElement);
      }
    }
  }, [
    annotator?.cursor?.selectStart,
    annotator?.cursor?.selectEnd,
    annotator?.lineHeight,
    annotator?.viewport?.noLines,
    annotator?.viewport?.lineStart,
  ]);

  // quiet does not trigger a toast notification
  const handleSaveNewContent = (quiet: boolean) => {
    if (annotator && documentId) {
      setIsSaving(true);

      if (quiet) {
        updateDocumentMutationQuiet.mutate({
          id: documentId,
          doc: {
            ...dataDocument,
            content: annotator.text.value,
          },
        });
      } else {
        updateDocumentMutation.mutate({
          id: documentId,
          doc: {
            ...dataDocument,
            content: annotator.text.value,
          },
        });
      }
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
      const entities = await api.entitiesGet(
        uniqueAnchors.map((anchor) => anchor.getTagName())
      );

      const data = entities.data ?? [];

      setStoredEntities(
        data.reduce((acc, entity) => {
          acc[entity.id] = entity;
          return acc;
        }, {} as Record<string, IEntity>)
      );

      return data;
    },
    enabled: api.isLoggedIn() && selectedAnchors.length > 0,
  });

  const handleAddAnchor = (entityId: string, elvl?: EntityEnums.Elvl) => {
    annotator?.addAnchor(
      entityId,
      elvl
        ? {
            elvl: elvl,
          }
        : {}
    );
    setSelectedText("");
    annotator?.clearSelection();
    handleSaveNewContent(true);
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

    // Check if the document content has actually changed
    const currentContent = annotator?.text?.value;
    const newContent = dataDocument?.content ?? "no text";

    // If content hasn't changed and we have an existing annotator, just redraw it
    if (annotator && currentContent === newContent) {
      // Update theme colors for existing annotator
      annotator.fontColor = theme.color.black;
      annotator.bgColor = "transparent";
      annotator.setSelectStyle("turquoise", 0.8, theme.color.black);

      // Update Lines component colors if it exists
      if (annotator.lines) {
        annotator.lines.fontColor = theme.color.plain;
        annotator.lines.bgColor = theme.color.white;
      }

      // Update highlight callback to use current theme
      annotator.onHighlight((entityId) => {
        if (dataDocument) {
          return annotatorHighlight(
            entityId,
            {
              thisTerritoryEntityId,
              dataDocument,
            },
            hlEntities,
            theme
          );
        }
      });

      annotator.draw();

      return;
    }

    const originalMode = annotatorMode;

    const newAnnotator = new Annotator(
      mainCanvas?.current,
      dataDocument?.content ?? "no text",
      RATIO
    );

    newAnnotator.fontColor = theme.color.black;
    newAnnotator.bgColor = "transparent";

    newAnnotator.setSelectStyle("turquoise", 0.8, theme.color.black);

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
          theme
        );
      }
    });

    newAnnotator.onTextChanged((text) => {
      setLocalTextContent(text);
    });
    newAnnotator.draw();

    setAnnotator(newAnnotator);
    forwardAnnotator(newAnnotator);

    newAnnotator.onScroll(() => {
      setStoredAnnotatorScroll(newAnnotator.viewport.lineStart);
    });

    newAnnotator.setMode(originalMode);
  };

  useEffect(() => {
    if (!dataDocumentIsFetching && !isSaving) {
      refreshAnnotator();
    }
  }, [
    theme,
    hlEntities ?? [],
    dataDocumentIsFetching ?? false,
    dataDocument,
    isSaving,
  ]);

  const isChangeMade = useMemo<boolean>(() => {
    return annotator?.text?.value !== dataDocument?.content;
  }, [annotator?.text?.value, dataDocument?.content, localTextContent]);

  const onCreateTerritory = (
    mode: TerritoryCreateModalType,
    elvl: EntityEnums.Elvl
  ) => {
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

  const onCreateStatement = (
    elvl: EntityEnums.Elvl,
    // following props are only for creation from EntitySuggester -> EntityCreateModal
    entityCreateModalProps?: {
      label: string;
      detail: string;
      territoryId: string;
      language: EntityEnums.Language;
    }
  ) => {
    if (handleCreateStatement && selectedText && selectionStartIndex !== -1) {
      const newStatementId = uuidv4();
      handleAddAnchor(newStatementId, elvl);
      // remove linebreaks from text
      const validatedText = selectedText.replace(/\n/g, " ");
      handleCreateStatement(
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
          : undefined
      );
    }
  };

  const onRemoveAnchor = (anchor: string) => {
    annotator?.removeAnchorFromSelection(anchor);
    handleSaveNewContent(true);
    setSelectedText("");
    annotator?.clearSelection();
    handleRefreshEntityAndStatement(anchor);
  };

  const onUpdateAnchor = (anchor: Tag, elvl: EntityEnums.Elvl) => {
    annotator?.updateAnchor(anchor, { elvl });
    handleSaveNewContent(true);
  };

  const isMenuDisplayed = useMemo<boolean>(() => {
    return (
      annotatorMode === EditMode.HIGHLIGHT &&
      selectedText !== "" &&
      !isSelectingText &&
      dataDocument !== undefined
    );
  }, [annotatorMode, selectedText, isSelectingText, dataDocument]);

  // Handle click outside menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuDisplayed &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !mainCanvas.current?.contains(event.target as Node) &&
        !statementListBoxRef?.current?.contains(event.target as Node)
      ) {
        setSelectedText("");
        annotator?.clearSelection();
      }
    };

    if (isMenuDisplayed) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuDisplayed, annotator, statementListBoxRef]);

  if (dataDocumentError) {
    return (
      <StyledInfoText>
        Error loading document: {dataDocumentError.message}
      </StyledInfoText>
    );
  }

  const hasParentT = territory?.data?.parent !== undefined;

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchOccurences, setSearchOccurences] = useState<
    | { segmentIndex: number; lineIndex: number; start: number; end: number }[]
    | null
  >(null);
  const [isRegexMode, setIsRegexMode] = useState<boolean>(false);
  const [searchActiveOccurence, setSearchActiveOccurence] = useState<number>(0);

  // annotate tool
  // entity to anchor
  const [entityToAnchor, setEntityToAnchor] = useState<IResponseEntity | null>(
    null
  );
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
    } else if (
      selectedAnchors.some(
        (anchor) => anchor.getTagName() === entityToAnchor?.id
      )
    ) {
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
  const searchTermRef = useRef<string>("");

  useEffect(() => {
    if (annotator && debouncedSearchTerm.length > 2) {
      const occurrences = annotator.search(debouncedSearchTerm, isRegexMode);
      setSearchOccurences(occurrences);

      // Only reset to first occurrence if this is a new search term
      if (searchTermRef.current !== debouncedSearchTerm) {
        setSearchActiveOccurence(0);
        searchTermRef.current = debouncedSearchTerm;
      }
    } else if (debouncedSearchTerm.length <= 2) {
      setSearchOccurences(null);
      setSearchActiveOccurence(0);
      searchTermRef.current = "";
      setSelectedText("");
      annotator?.clearSelection();
    }
  }, [debouncedSearchTerm, isRegexMode]);

  // Re-run search when width changes to update occurrence positions
  useEffect(() => {
    if (annotator && debouncedSearchTerm.length > 2) {
      // Force a redraw first to recalculate text layout, then search
      setTimeout(() => {
        annotator.draw();
        const occurrences = annotator.search(debouncedSearchTerm, isRegexMode);
        setSearchOccurences(occurrences);
      }, 0);
    }
  }, [width, debouncedSearchTerm, isRegexMode]);

  const isSearchAllowed = useMemo<boolean>(() => {
    return annotator !== undefined && !!dataDocument;
  }, [annotator, dataDocument]);

  return (
    <>
      {annotator && (
        <StatementListSearchLine
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
        />
      )}

      <div
        style={{ width: width, position: "relative" }}
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
                  refs.setFloating(node);
                  menuRef.current = node;
                }}
                style={floatingStyles}
              >
                {dataDocument && (
                  <TextAnnotatorMenu
                    onEscapePressed={() => {
                      setSelectedText("");
                      annotator?.clearSelection();
                    }}
                    anchors={selectedAnchors}
                    documentData={dataDocument}
                    text={selectedText}
                    entities={storedEntities}
                    onAnchorAdd={handleAddAnchor}
                    onCreateTerritory={onCreateTerritory}
                    onCreateStatement={onCreateStatement}
                    onRemoveAnchor={onRemoveAnchor}
                    onUpdateAnchor={onUpdateAnchor}
                    isTextInsideThisT={selectedAnchors.some(
                      (anchor) => anchor.getTagName() === thisTerritoryEntityId
                    )}
                    activeTerritoryId={thisTerritoryEntityId}
                    onCreateActiveTAnchor={(elvl) => {
                      handleAddAnchor(thisTerritoryEntityId ?? "", elvl);
                    }}
                    canCreateActiveTAnchor={
                      !dataDocument?.entityIds.T.includes(
                        thisTerritoryEntityId ?? ""
                      )
                    }
                    isLoadingEntities={isFetchingAnchorEntities}
                    hasParentT={hasParentT}
                    territory={territory}
                    disableCreate={disableCreate}
                  />
                )}
              </StyledAnnotatorMenu>
            </FloatingPortal>
          )}

          {displayLineNumbers && (
            <StyledLinesCanvas
              ref={lines}
              width={wLineNumbers}
              height={height}
              style={{
                outline: "none",
                backgroundColor: theme?.color.white,
                color: theme?.color.plain,
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
              height: height,
              width: wTextArea,
              backgroundColor: theme.color.white,
              color: theme.color.text,
              outline: "none",
            }}
          />
          <StyledScrollerViewport
            ref={scroller}
            style={{
              background: theme.color.grey,
            }}
          >
            <StyledScrollerCursor
              style={{
                backgroundColor: theme.color.primary,
              }}
            />
          </StyledScrollerViewport>
        </StyledCanvasWrapper>

        {annotator && (
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
                label={!annotatorWidthTooNarrow ? EditMode.HIGHLIGHT : ""}
                color="success"
                inverted={annotatorMode !== EditMode.HIGHLIGHT}
                onClick={() => {
                  annotator.setMode(EditMode.HIGHLIGHT);
                  setAnnotatorMode(EditMode.HIGHLIGHT);
                  annotator.draw();
                }}
                tooltipLabel="highlight (activate syntax highlighting mode)"
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
                label={!annotatorWidthTooNarrow ? "text edit" : ""}
                inverted={annotatorMode !== EditMode.SEMI}
                onClick={() => {
                  annotator.setMode(EditMode.SEMI);
                  setAnnotatorMode(EditMode.SEMI);
                  annotator.draw();
                }}
                tooltipLabel="text edit (activate semi mode)"
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
                label={!annotatorWidthTooNarrow ? "XML" : ""}
                inverted={annotatorMode !== EditMode.RAW}
                onClick={() => {
                  annotator.setMode(EditMode.RAW);
                  setAnnotatorMode(EditMode.RAW);
                  annotator.draw();
                }}
                tooltipLabel="XML (activate edit mode)"
                tooltipPosition="top"
              />
            </ButtonGroup>

            <ButtonGroup $marginTop style={{ marginLeft: "0.5rem" }}>
              <span style={{ display: "flex", position: "relative" }}>
                <Button
                  label="save"
                  color="primary"
                  icon={<FaRegSave />}
                  disabled={!isChangeMade || isSaving || dataDocumentIsFetching}
                  onClick={() => {
                    handleSaveNewContent(false);
                  }}
                />
                <Loader show={isSaving || dataDocumentIsFetching} size={14} />
              </span>
              <Button
                label="discard"
                color="warning"
                icon={<FaTrash />}
                disabled={!isChangeMade || isSaving || dataDocumentIsFetching}
                onClick={() => {
                  if (dataDocument?.content) {
                    annotator?.updateText(dataDocument?.content);
                  }
                }}
              />
            </ButtonGroup>
          </StyledAnnotatorButtons>
        )}
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
            territoryCreateModalType === "sibling-T"
              ? dataParentTerritory
              : territory
          }
          onMutationSuccess={(entity) => {
            handleAddAnchor(entity.id, territoryElvl);
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
