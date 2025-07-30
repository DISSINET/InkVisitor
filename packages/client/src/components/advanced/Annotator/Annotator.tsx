import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaPen, FaRegSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import { Annotator, EditMode } from "@inkvisitor/annotator/src/lib";
import { EntityEnums } from "@shared/enums";
import {
  IDocument,
  IEntity,
  IResponseEntity,
  IResponseTerritory,
} from "@shared/types";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import { useDebounce, useSearchParams, useTheme } from "hooks";
import { BsFileTextFill } from "react-icons/bs";
import { HiCodeBracket } from "react-icons/hi2";
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
interface TextAnnotatorProps {
  width: number;
  annotatorWidthTooSmall?: boolean;
  height: number;
  displayLineNumbers: boolean;
  hlEntities?: EntityEnums.Class[];
  documentId: string;
  handleCreateStatement?: Function;
  initialScrollEntityId?: string;
  thisTerritoryEntityId?: string;

  forwardAnnotator?: (annotator?: Annotator) => void;

  storedAnnotatorScroll?: number;
  setStoredAnnotatorScroll?: React.Dispatch<React.SetStateAction<number>>;

  territory?: IResponseTerritory;
  dataDocument?: IDocument;
  dataDocumentIsFetching?: boolean;
  dataDocumentError: Error | null;
  showStatementList?: boolean;
}

export const TextAnnotator = ({
  width = 400,
  annotatorWidthTooSmall = false,
  height = 500,
  displayLineNumbers = true,
  hlEntities = Object.values(EntityEnums.Class),
  documentId,
  handleCreateStatement = undefined,
  initialScrollEntityId = undefined,
  thisTerritoryEntityId = undefined,

  storedAnnotatorScroll = 0,
  forwardAnnotator = (undefined) => {},
  setStoredAnnotatorScroll = () => {},

  territory,
  dataDocument,
  dataDocumentIsFetching,
  dataDocumentError,
  showStatementList,
}: TextAnnotatorProps) => {
  const queryClient = useQueryClient();
  const theme = useTheme();

  const { appendDetailId, statementId, selectedDetailId } = useSearchParams();

  const { annotator, setAnnotator } = useAnnotator();

  const [localTextContent, setLocalTextContent] = useState<string>("");

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
  });

  const updateDocumentMutationQuiet = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const wLineNumbers = displayLineNumbers ? 50 : 0;
  const wTextArea = width - wLineNumbers - W_SCROLL;

  const [isSelectingText, setIsSelectingText] = useState<boolean>(false);

  const mainCanvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lines = useRef<HTMLCanvasElement>(null);

  const [annotatorMode, setAnnotatorMode] = useState<EditMode>(
    EditMode.HIGHLIGHT
  );

  useEffect(() => {
    if (annotator) {
      annotator.setMode(annotatorMode);
    }
  }, [annotatorMode]);

  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedAnchors, setSelectedAnchors] = useState<string[]>([]);
  const [storedEntities, setStoredEntities] = useState<
    Record<string, IEntity | false>
  >({});

  const [territoryCreateModalType, setTerritoryCreateModalType] =
    useState<TerritoryCreateModalType>(false);

  const [scrollAfterRefresh, setScrollAfterRefresh] = useState<
    number | undefined
  >(undefined);

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
    const scrollBeforeUpdated = annotator?.viewport?.lineStart;
    setScrollAfterRefresh(scrollBeforeUpdated);

    if (annotator && documentId) {
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
    anchors: string[];
    index: number;
  } | null>(null);

  const handleTextSelection = (
    text: string,
    anchors: string[],
    index: number
  ) => {
    if (annotatorMode === EditMode.HIGHLIGHT) {
      setPendingSelection({ text, anchors, index });
    }
  };

  useEffect(() => {
    // isSelectingText didn't work as expected without the useEffect and pendingSelection so this implementation was necessary
    if (pendingSelection && !isSelectingText) {
      const { text, anchors } = pendingSelection;
      setSelectedText(text);
      setSelectedAnchors(anchors);

      setAnchors(anchors);

      setPendingSelection(null);
    }
  }, [pendingSelection, isSelectingText]);

  const [anchors, setAnchors] = useState<string[]>([]);

  const { data: anchorEntities, isFetching: isFetchingAnchorEntities } =
    useQuery({
      queryKey: ["anchorEntities", anchors],
      queryFn: async () => {
        const uniqueAnchors = [...new Set(anchors)];
        const entities = await api.entitiesGet(uniqueAnchors);
        setStoredEntities(
          entities.data.reduce((acc, entity) => {
            acc[entity.id] = entity;
            return acc;
          }, {} as Record<string, IEntity>)
        );
        return entities.data;
      },
      enabled: api.isLoggedIn() && anchors.length > 0,
    });

  const handleAddAnchor = (entityId: string) => {
    annotator?.addAnchor(entityId);
    setSelectedText("");
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

  const refreshAnnotator = (scrollTo: { line?: number; anchor?: string }) => {
    if (!mainCanvas.current) {
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

    setTimeout(() => {
      if (scrollTo.line) {
        newAnnotator.scrollToLine(scrollTo.line);
      } else if (scrollTo.anchor) {
        newAnnotator.scrollToAnchor(scrollTo.anchor);
      }
    }, 200);

    newAnnotator.setMode(originalMode);
  };

  useEffect(() => {
    if (!dataDocumentIsFetching) {
      if (scrollAfterRefresh !== undefined) {
        refreshAnnotator({
          line: scrollAfterRefresh,
        });
        // Clear scrollAfterRefresh after it's been used to prevent it from overriding future scrolls
        setScrollAfterRefresh(undefined);
      } else {
        refreshAnnotator({
          line: storedAnnotatorScroll,
        });
      }
    }
  }, [dataDocumentIsFetching, dataDocument]);

  useEffect(() => {
    if (!dataDocumentIsFetching) {
      refreshAnnotator({
        line: storedAnnotatorScroll,
      });
    }
  }, [theme, dataDocumentIsFetching]);

  useEffect(() => {
    if (!dataDocumentIsFetching) {
      refreshAnnotator({
        line: storedAnnotatorScroll,
      });
    }
  }, [hlEntities]);

  useEffect(() => {
    if (mainCanvas.current) {
      if (storedAnnotatorScroll) {
        refreshAnnotator({
          line: storedAnnotatorScroll,
        });
      } else if (initialScrollEntityId) {
        refreshAnnotator({
          anchor: initialScrollEntityId,
        });
      }
    }
  }, [initialScrollEntityId, mainCanvas.current]);

  const isChangeMade = useMemo<boolean>(() => {
    return annotator?.text?.value !== dataDocument?.content;
  }, [annotator?.text?.value, dataDocument?.content, localTextContent]);

  const onCreateTerritory = (mode: TerritoryCreateModalType | undefined) => {
    setTerritoryCreateModalType(mode ?? false);
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

  const onCreateStatement = () => {
    if (handleCreateStatement && selectedText) {
      const newStatementId = uuidv4();
      handleAddAnchor(newStatementId);
      // remove linebreaks from text
      const validatedText = selectedText.replace(/\n/g, " ");
      handleCreateStatement(validatedText, newStatementId);
    }
  };

  const onRemoveAnchor = (anchor: string) => {
    annotator?.removeAnchorFromSelection(anchor);
    handleSaveNewContent(true);
    setSelectedText("");
    annotator?.cursor.reset();
    annotator?.draw();
    handleRefreshEntityAndStatement(anchor);
  };

  const isMenuDisplayed = useMemo<boolean>(() => {
    return (
      annotatorMode === EditMode.HIGHLIGHT &&
      selectedText !== "" &&
      !isSelectingText &&
      dataDocument !== undefined
    );
  }, [annotatorMode, selectedText, isSelectingText, dataDocument]);

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
    { segmentIndex: number; lineIndex: number; start: number; end: number }[]
  >([]);
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
      setAnchors(anchors);
    });
    // searchActiveOccurence is in dependencies to call onSelectText on occurence change
  }, [searchActiveOccurence]);

  useEffect(() => {
    if (!entityToAnchor) {
      setCurrentAnchorExist(false);
    } else if (anchors.some((anchorId) => anchorId === entityToAnchor?.id)) {
      setCurrentAnchorExist(true);
    } else {
      setCurrentAnchorExist(false);
    }
  }, [anchors, entityToAnchor]);

  // Handle search occurrence selection
  useEffect(() => {
    const newSelectedOccurence = searchOccurences[searchActiveOccurence];

    if (newSelectedOccurence) {
      annotator?.selectSearchOccurrence(newSelectedOccurence);
    }
  }, [searchActiveOccurence, searchOccurences, annotator]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (annotator && debouncedSearchTerm.length > 2) {
      const occurrences = annotator.search(debouncedSearchTerm);

      setSearchOccurences(occurrences);

      setTimeout(() => {
        setSearchActiveOccurence(0);
      }, 1000);
    }
  }, [debouncedSearchTerm]);

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
          annotatorWidthTooSmall={annotatorWidthTooSmall}
          setSearchActiveOccurence={setSearchActiveOccurence}
          annotator={annotator}
          documentId={documentId}
          dataDocument={dataDocument || undefined}
          setEntityToAnchor={setEntityToAnchor}
          entityToAnchor={entityToAnchor}
          currentAnchorExist={currentAnchorExist}
          annotatorMode={annotatorMode}
        />
      )}

      <div
        style={{ width: width, position: "relative" }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSelectedText("");
          }
        }}
      >
        <StyledCanvasWrapper>
          {isMenuDisplayed && (
            <FloatingPortal id="page">
              <StyledAnnotatorMenu
                ref={refs.setFloating}
                style={floatingStyles}
              >
                {dataDocument && (
                  <TextAnnotatorMenu
                    anchors={selectedAnchors}
                    documentData={dataDocument}
                    text={selectedText}
                    entities={storedEntities}
                    onAnchorAdd={handleAddAnchor}
                    onCreateTerritory={onCreateTerritory}
                    handleCreateStatement={onCreateStatement}
                    handleRemoveAnchor={onRemoveAnchor}
                    isTextInsideThisT={selectedAnchors.some(
                      (anchor) => anchor === thisTerritoryEntityId
                    )}
                    activeTerritoryId={thisTerritoryEntityId}
                    onCreateActiveTAnchor={() => {
                      handleAddAnchor(thisTerritoryEntityId ?? "");
                    }}
                    canCreateActiveTAnchor={
                      !dataDocument?.entityIds.T.includes(
                        thisTerritoryEntityId ?? ""
                      )
                    }
                    isLoadingEntities={isFetchingAnchorEntities}
                    hasParentT={hasParentT}
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
                    $annotatorWidthTooSmall={annotatorWidthTooSmall}
                  >
                    <FaPen size={11} />
                  </StyledDisplayModeButtonIconWrapper>
                }
                label={!annotatorWidthTooSmall ? EditMode.HIGHLIGHT : ""}
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
                    $annotatorWidthTooSmall={annotatorWidthTooSmall}
                  >
                    <BsFileTextFill size={11} />
                  </StyledDisplayModeButtonIconWrapper>
                }
                color="success"
                label={!annotatorWidthTooSmall ? "text edit" : ""}
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
                    $annotatorWidthTooSmall={annotatorWidthTooSmall}
                  >
                    <HiCodeBracket size={11} />
                  </StyledDisplayModeButtonIconWrapper>
                }
                color="success"
                label={!annotatorWidthTooSmall ? "XML" : ""}
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
              <Button
                label="save"
                color="primary"
                icon={<FaRegSave />}
                disabled={!isChangeMade}
                onClick={() => {
                  handleSaveNewContent(false);
                }}
              />
              <Button
                label="discard"
                color="warning"
                icon={<FaTrash />}
                disabled={!isChangeMade}
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
          closeModal={() => setTerritoryCreateModalType(false)}
          allowedEntityClasses={[EntityEnums.Class.Territory]}
          labelTyped={newTerritoryName}
          parentTerritory={
            territoryCreateModalType === "sibling-T"
              ? dataParentTerritory
              : territory
          }
          onMutationSuccess={(entity) => {
            handleAddAnchor(entity.id);
            setTerritoryCreateModalType(false);
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
