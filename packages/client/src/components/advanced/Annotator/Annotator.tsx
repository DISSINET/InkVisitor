import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaPen, FaRegSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import { Annotator, EditMode } from "@inkvisitor/annotator/src/lib";
import { EntityEnums } from "@shared/enums";
import { IDocument, IEntity, IResponseTerritory } from "@shared/types";
import { Button } from "components/basic/Button/Button";
import { ButtonGroup } from "components/basic/ButtonGroup/ButtonGroup";
import { useSearchParams } from "hooks";
import { BsFileTextFill } from "react-icons/bs";
import { HiCodeBracket } from "react-icons/hi2";
import { useAppSelector } from "redux/hooks";
import { ThemeContext } from "styled-components";
import { EntityCreateModal } from "..";
import { useAnnotator } from "./AnnotatorContext";
import TextAnnotatorMenu from "./AnnotatorMenu";
import {
  StyledAnnotatorMenu,
  StyledCanvasWrapper,
  StyledInfoText,
  StyledLinesCanvas,
  StyledMainCanvas,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./AnnotatorStyles";
import { annotatorHighlight } from "./highlight";
import { RATIO, TerritoryCreateModalType, W_SCROLL } from "./types";
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
  // dataDocument?: IDocument;
  // dataDocumentIsFetching?: boolean;
  // errorDocument: Error | null;
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
}: // dataDocument,
// dataDocumentIsFetching,
// errorDocument,
TextAnnotatorProps) => {
  const queryClient = useQueryClient();
  const theme = useContext(ThemeContext);

  const { appendDetailId, statementId, selectedDetailId } = useSearchParams();

  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

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

  // it has to be here currently to render the annotator in the documents page
  const {
    data: dataDocument,
    error: errorDocument,
    isFetching: isFetchingDocument,
  } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const res = await api.documentGet(documentId);
      return res.data;
    },
    enabled: api.isLoggedIn(),
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

      handleFetchEntities(anchors);

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

  const handleFetchEntities = async (anchors: string[]) => {
    setAnchors(anchors);
  };

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

    newAnnotator.fontColor = theme?.color.black;
    newAnnotator.bgColor = "transparent";

    newAnnotator.setSelectStyle("turquoise", 0.8);

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
    if (!isFetchingDocument) {
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
  }, [isFetchingDocument, dataDocument]);

  useEffect(() => {
    if (!isFetchingDocument) {
      refreshAnnotator({
        line: storedAnnotatorScroll,
      });
    }
  }, [theme, isFetchingDocument]);

  useEffect(() => {
    if (!isFetchingDocument) {
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

  // check if the selection is in the first half of the viewport
  const menuSelectionPosition = useMemo<"top" | "bottom" | "both">(() => {
    const vStart = annotator?.viewport?.lineStart ?? 0;
    const yEnd = (annotator?.cursor?.selectEnd?.yLine ?? 0) - vStart;
    const yStart = (annotator?.cursor?.selectStart?.yLine ?? 0) - vStart;

    const allLines = annotator?.viewport.noLines ?? 0;

    const yCenter = yStart && yEnd ? (yStart + yEnd) / 2 : 0;
    const viewportMiddle = allLines / 2;

    // if the selection is spanning through both halves of the viewport
    if (
      (yStart < viewportMiddle && yEnd > viewportMiddle) ||
      (yEnd < viewportMiddle && yStart > viewportMiddle)
    ) {
      return "both";
    }

    return yCenter < viewportMiddle ? "top" : "bottom";
  }, [
    annotator?.cursor?.selectEnd?.yLine,
    annotator?.cursor?.selectStart?.yLine,
    annotator?.viewport.noLines,
  ]);

  const isSelectionTopDown = useMemo<boolean>(() => {
    const vStart = annotator?.viewport?.lineStart ?? 0;
    const yEnd = (annotator?.cursor?.selectEnd?.yLine ?? 0) - vStart;
    const yStart = (annotator?.cursor?.selectStart?.yLine ?? 0) - vStart;

    return yEnd >= yStart;
  }, [
    annotator?.cursor?.selectEnd?.yLine,
    annotator?.cursor?.selectStart?.yLine,
  ]);

  const translateMenu = useMemo<string>(() => {
    if (menuSelectionPosition === "top") {
      return "0%";
    } else if (menuSelectionPosition === "bottom") {
      return "-100%";
    } else {
      if (isSelectionTopDown) {
        return "-100%";
      } else {
        return "0%";
      }
    }
  }, [menuSelectionPosition, isSelectionTopDown]);

  const menuPositionY = useMemo<number>(() => {
    const vStart = annotator?.viewport?.lineStart ?? 0;

    const yStart = (annotator?.cursor?.selectStart?.yLine ?? 0) - vStart;
    const yEnd = (annotator?.cursor?.selectEnd?.yLine ?? 0) - vStart;

    const lineHeight = (annotator?.lineHeight ?? 0) / RATIO;

    let menuYD = 0;
    if (menuSelectionPosition === "top") {
      menuYD = 2 * lineHeight;
    } else if (menuSelectionPosition === "bottom") {
      menuYD = -lineHeight;
    } else {
      if (isSelectionTopDown) {
        menuYD = -lineHeight;
      } else {
        menuYD = 4 * lineHeight;
      }
    }
    // large
    // if the selection is top-down or bottom-up

    // if end is before start + menuSelectionPosition is true, then the menu should be above the cursor...
    // top-down + large => menu below end
    // top-down + top => menu below end
    // top-down + bottom => menu above start
    // bottom-up + top => menu below start
    // bottom-up + bottom => menu above end

    if (isSelectionTopDown) {
      if (menuSelectionPosition === "top") {
        return yEnd * lineHeight + menuYD;
      } else if (menuSelectionPosition === "bottom") {
        return yStart * lineHeight + menuYD;
      } else {
        return yEnd * lineHeight;
      }
    } else {
      if (menuSelectionPosition === "top") {
        return yStart * lineHeight + menuYD;
      } else if (menuSelectionPosition === "bottom") {
        return yEnd * lineHeight + menuYD;
      } else {
        return yEnd * lineHeight + menuYD;
      }
    }
  }, [annotator?.cursor?.yLine, annotator?.lineHeight, menuSelectionPosition]);

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

  if (errorDocument) {
    return (
      <StyledInfoText>
        Error loading document: {errorDocument.message}
      </StyledInfoText>
    );
  }

  const hasParentT = territory?.data?.parent !== undefined;

  return (
    <>
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
            <StyledAnnotatorMenu
              $top={
                menuPositionY + 300 > contentHeight
                  ? contentHeight / 2
                  : menuPositionY
              }
              $left={100}
              // $translateY={"100%"}
              $translateY={translateMenu}
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
              backgroundColor: theme?.color.white,
              color: theme?.color.text,
              outline: "none",
            }}
          />
          <StyledScrollerViewport
            ref={scroller}
            style={{
              background: theme?.color.grey,
            }}
          >
            <StyledScrollerCursor
              style={{
                backgroundColor: theme?.color.primary,
              }}
            />
          </StyledScrollerViewport>
        </StyledCanvasWrapper>

        {annotator && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <ButtonGroup $marginTop>
              <Button
                key={EditMode.HIGHLIGHT}
                icon={<FaPen size={11} />}
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
                icon={<BsFileTextFill size={11} />}
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
                icon={<HiCodeBracket size={11} />}
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
          </div>
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
