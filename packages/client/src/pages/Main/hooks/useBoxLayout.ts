import { useEffect, useState } from "react";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { setEditorBoxState } from "redux/features/layout/mainPage/editorBoxStateSlice";
import { setStatementListOpened } from "redux/features/layout/mainPage/statementListOpenedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { BOX_SPLIT_OFFSET, hiddenBoxHeight } from "Theme/constants";
import { DetailBoxState, EditorBoxState } from "types";
import { floorNumberToOneDecimal } from "utils/utils";

interface UseBoxLayoutParams {
  detailIdArrayLength: number;
  statementId: string;
  editorOpened: boolean;
  setEditorOpened: (opened: boolean) => void;
}

export function useBoxLayout({
  detailIdArrayLength,
  statementId,
  editorOpened,
  setEditorOpened,
}: UseBoxLayoutParams) {
  const dispatch = useAppDispatch();

  const contentHeight = useAppSelector((state) => state.layout.contentHeight);
  const detailBoxState: DetailBoxState = useAppSelector(
    (state) => state.layout.mainPage.detailBoxState,
  );
  const editorBoxState: EditorBoxState = useAppSelector(
    (state) => state.layout.mainPage.editorBoxState,
  );
  const statementListOpened = useAppSelector((state) => state.layout.mainPage.statementListOpened);
  const secondPanelExpanded = useAppSelector((state) => state.layout.mainPage.secondPanelExpanded);
  const thirdPanelExpanded = useAppSelector((state) => state.layout.mainPage.thirdPanelExpanded);

  const [lastState, setLastState] = useState(DetailBoxState.Normal);

  const getCollapsedPanelHalfHeight = () => contentHeight / 2;

  // DETAIL HORIZONTAL SEPARATOR STATE
  const [detailSeparatorY, setDetailSeparatorY] = useState<number>(() => {
    const saved = localStorage.getItem("detailSeparatorYPercent");
    return saved ? (Number(saved) * contentHeight) / 100 : contentHeight / 2 - BOX_SPLIT_OFFSET;
  });

  // EDITOR HORIZONTAL SEPARATOR STATE
  const [editorSeparatorY, setEditorSeparatorY] = useState<number>(() => {
    const saved = localStorage.getItem("editorSeparatorYPercent");
    return saved ? (Number(saved) * contentHeight) / 100 : contentHeight / 2 - BOX_SPLIT_OFFSET;
  });

  useEffect(() => {
    const savedDetail = localStorage.getItem("detailSeparatorYPercent");
    const savedEditor = localStorage.getItem("editorSeparatorYPercent");
    setDetailSeparatorY(
      savedDetail
        ? (Number(savedDetail) * contentHeight) / 100
        : contentHeight / 2 - BOX_SPLIT_OFFSET,
    );
    setEditorSeparatorY(
      savedEditor
        ? (Number(savedEditor) * contentHeight) / 100
        : contentHeight / 2 - BOX_SPLIT_OFFSET,
    );
  }, [contentHeight]);

  const handleDetailSeparatorYChange = (yPosition: number) => {
    setDetailSeparatorY(yPosition);
    localStorage.setItem(
      "detailSeparatorYPercent",
      floorNumberToOneDecimal((yPosition / contentHeight) * 100).toString(),
    );
  };

  const handleEditorSeparatorYChange = (yPosition: number) => {
    setEditorSeparatorY(yPosition);
    localStorage.setItem(
      "editorSeparatorYPercent",
      floorNumberToOneDecimal((yPosition / contentHeight) * 100).toString(),
    );
  };

  useEffect(() => {
    if (detailIdArrayLength > 0) {
      if (detailBoxState === DetailBoxState.FullHeight) {
        if (statementListOpened) {
          dispatch(setStatementListOpened(false));
        }
      } else {
        if (!statementListOpened) {
          dispatch(setStatementListOpened(true));
        }
      }
    }
  }, [detailBoxState, statementListOpened, detailIdArrayLength]);

  const getDetailBoxHeight = () => {
    if (!secondPanelExpanded && detailIdArrayLength > 0) {
      return getCollapsedPanelHalfHeight();
    }
    switch (detailBoxState) {
      case DetailBoxState.FullHeight:
        return contentHeight - hiddenBoxHeight;
      case DetailBoxState.Normal:
        return contentHeight - detailSeparatorY;
      case DetailBoxState.Minimized:
        return hiddenBoxHeight + 22;
    }
  };

  const getStatementListBoxHeight = () => {
    if (!detailIdArrayLength) {
      return contentHeight;
    }
    if (!secondPanelExpanded) {
      return getCollapsedPanelHalfHeight();
    }
    return contentHeight - (getDetailBoxHeight() ?? 0);
  };

  const getEditorBoxHeight = () => {
    if (!editorOpened) {
      return hiddenBoxHeight;
    }
    if (!thirdPanelExpanded && statementId) {
      return getCollapsedPanelHalfHeight();
    }
    switch (editorBoxState) {
      case EditorBoxState.FullHeight:
        return contentHeight - hiddenBoxHeight;
      case EditorBoxState.Normal:
        return contentHeight - editorSeparatorY;
      case EditorBoxState.Minimized:
        return hiddenBoxHeight;
    }
  };

  const getAnnotatorBoxHeight = () => {
    if (!statementId) {
      return contentHeight;
    }
    if (!thirdPanelExpanded && editorOpened) {
      return getCollapsedPanelHalfHeight();
    }
    return contentHeight - (getEditorBoxHeight() ?? 0);
  };

  const handleMaximizeDetailBox = () => {
    if (detailBoxState === DetailBoxState.Normal) {
      dispatch(setDetailBoxState(DetailBoxState.FullHeight));
    } else {
      dispatch(setDetailBoxState(DetailBoxState.Normal));
    }
  };

  const handleMinimizeDetailBox = () => {
    if (detailBoxState === DetailBoxState.Minimized) {
      dispatch(setDetailBoxState(lastState));
    } else {
      setLastState(detailBoxState);
      dispatch(setDetailBoxState(DetailBoxState.Minimized));
    }
  };

  const handleMaximizeEditorBox = () => {
    if (!editorOpened) {
      setEditorOpened(true);
      dispatch(setEditorBoxState(EditorBoxState.Normal));
      return;
    }
    if (editorBoxState === EditorBoxState.Normal) {
      dispatch(setEditorBoxState(EditorBoxState.FullHeight));
    } else {
      dispatch(setEditorBoxState(EditorBoxState.Normal));
    }
  };

  const getMaximizeBtnTooltip = () => {
    switch (detailBoxState) {
      case DetailBoxState.FullHeight:
        return "shrink detail box";
      case DetailBoxState.Normal:
        return "maximize detail box";
      case DetailBoxState.Minimized:
        return "open detail box";
    }
  };

  const getEditorMaximizeBtnTooltip = () => {
    if (!editorOpened) {
      return "open editor box";
    }
    return editorBoxState === EditorBoxState.FullHeight
      ? "shrink editor box"
      : "maximize editor box";
  };

  return {
    detailSeparatorY,
    editorSeparatorY,
    handleDetailSeparatorYChange,
    handleEditorSeparatorYChange,
    getStatementListBoxHeight,
    getDetailBoxHeight,
    getEditorBoxHeight,
    getAnnotatorBoxHeight,
    handleMaximizeDetailBox,
    handleMinimizeDetailBox,
    handleMaximizeEditorBox,
    getMaximizeBtnTooltip,
    getEditorMaximizeBtnTooltip,
  };
}
