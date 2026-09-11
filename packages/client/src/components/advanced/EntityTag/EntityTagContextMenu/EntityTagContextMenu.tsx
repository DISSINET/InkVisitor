import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IBookmarkFolder, IEntity } from "@inkvisitor/shared/types";
import { config, useSpring } from "@react-spring/web";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  IcoCaretRight,
  IcoCardText,
  IcoCheck,
  IcoClipboard,
  IcoCopy,
  IcoEdit,
  IcoListTree,
  IcoStar,
  IcoUnlink,
} from "Theme/icons";
import { useBookmarksQuery } from "hooks/react-query";
import { useSearchParams } from "hooks";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { setSecondPanelExpanded } from "redux/features/layout/mainPage/secondPanelExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { DetailBoxState } from "types";
import { getEntityLabel, getShortLabelByLetterCount } from "utils/utils";
import {
  StyledEmptyNote,
  StyledItemIcon,
  StyledItemLabel,
  StyledItemTrailing,
  StyledMenuDivider,
  StyledMenuGroup,
  StyledMenuHeader,
  StyledMenuHeaderLabel,
  StyledMenuItem,
} from "./EntityTagContextMenuStyles";

const ICON_SIZE = 13;
// tags render inside modals (500) and inside the suggester dropdown (10000),
// and the menu has to clear whichever one it was opened from
const MENU_Z_INDEX = 10002;
// the pointer needs time to cross the gap between the row and the submenu
const SUBMENU_CLOSE_DELAY = 150;

interface EntityTagContextMenu {
  entity: IEntity;
  /** viewport coordinates of the click that opened the menu */
  position: { x: number; y: number };
  onClose: () => void;
  onUnlink?: () => void;
  unlinkLabel?: string;
}
export const EntityTagContextMenu: React.FC<EntityTagContextMenu> = ({
  entity,
  position,
  onClose,
  onUnlink,
  unlinkLabel = "unlink entity",
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const detailBoxState: DetailBoxState = useAppSelector(
    (state) => state.layout.mainPage.detailBoxState,
  );
  const { setTerritoryId, setStatementId, detailIdArray, selectedDetailId, promoteDetailId } =
    useSearchParams();

  const entityLabel = useMemo(() => getEntityLabel(entity), [entity]);

  const [submenuOpen, setSubmenuOpen] = useState(false);
  const submenuCloseTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const menu = useFloating({
    placement: "right-start",
    middleware: [offset(2), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const submenu = useFloating({
    placement: "right-start",
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // the menu hangs off the cursor, which is a point rather than an element
  useEffect(() => {
    menu.refs.setPositionReference({
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: position.x,
        y: position.y,
        top: position.y,
        bottom: position.y,
        left: position.x,
        right: position.x,
      }),
    });
  }, [position.x, position.y, menu.refs]);

  useEffect(() => {
    const isInsideMenu = (target: Node) =>
      Boolean(menu.refs.floating.current?.contains(target)) ||
      Boolean(submenu.refs.floating.current?.contains(target));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    const handlePointerDown = (e: PointerEvent) => {
      if (!isInsideMenu(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // capture phase: a tag that stops the event still has to close the menu
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("resize", onClose);
    // boxes scroll in their own containers and those events do not bubble
    window.addEventListener("scroll", onClose, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose, menu.refs, submenu.refs]);

  useEffect(() => {
    return () => clearTimeout(submenuCloseTimeout.current);
  }, []);

  const animatedMount = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: config.stiff,
  });

  const { data: bookmarkFolders } = useBookmarksQuery();

  const changeBookmarksMutation = useMutation({
    mutationFn: async (bookmarks: IBookmarkFolder[]) => await api.usersUpdate("me", { bookmarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const bookmarkedInCount = useMemo(
    () =>
      (bookmarkFolders ?? []).filter((folder) =>
        folder.entities.some((bookmarked) => bookmarked.id === entity.id),
      ).length,
    [bookmarkFolders, entity.id],
  );

  const toggleBookmark = (folderId: string) => {
    if (!bookmarkFolders) {
      return;
    }
    // the user record stores id lists, while the query answers with whole entities
    const folders: IBookmarkFolder[] = bookmarkFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      entityIds: folder.entities.map((bookmarked) => bookmarked.id),
    }));
    const target = folders.find((folder) => folder.id === folderId);
    if (!target) {
      return;
    }

    const wasBookmarked = target.entityIds.includes(entity.id);
    target.entityIds = wasBookmarked
      ? target.entityIds.filter((id) => id !== entity.id)
      : [...target.entityIds, entity.id];

    changeBookmarksMutation.mutate(folders);
    // react-query drops mutate-scoped callbacks once the observer unmounts, and
    // closing the menu unmounts this one, so the feedback cannot wait for the write
    toast.info(wasBookmarked ? `removed from [${target.name}]` : `bookmarked in [${target.name}]`);
    onClose();
  };

  const hasDetailPanel = location.pathname === "/" || location.pathname === "/explorer";

  // the detail tabs are shared across pages, but the box holding them is part
  // of the main page layout
  const expandDetailPanel = () => {
    if (location.pathname !== "/") {
      return;
    }
    dispatch(setSecondPanelExpanded(true));
    if (detailBoxState === DetailBoxState.Minimized) {
      dispatch(setDetailBoxState(DetailBoxState.Normal));
    }
  };

  const openInDetail = () => {
    promoteDetailId(entity.id);
    expandDetailPanel();
    onClose();
  };

  const isStatement = entity.class === EntityEnums.Class.Statement;

  // a statement template carries no territory, and every other class is reached
  // through the entities it is used in rather than a place in the tree
  const targetTerritoryId: string | undefined =
    entity.class === EntityEnums.Class.Territory
      ? entity.id
      : isStatement && !entity.isTemplate
        ? entity.data?.territory?.territoryId
        : undefined;

  // the editor shows whichever statement is selected inside the opened
  // territory, so a statement needs both ids set
  const goToTerritory = () => {
    if (!targetTerritoryId) {
      return;
    }
    const statementToSelect = isStatement ? entity.id : undefined;

    if (location.pathname === "/") {
      setTerritoryId(targetTerritoryId);
      if (statementToSelect) {
        setStatementId(statementToSelect);
      }
      onClose();
      return;
    }

    // the hash carries the whole main page state, so the detail tabs open on
    // this page have to be written into it to survive the route change
    const params = new URLSearchParams();
    params.set("territory", targetTerritoryId);
    if (statementToSelect) {
      params.set("statement", statementToSelect);
    }
    if (detailIdArray.length > 0) {
      params.set("detail", detailIdArray.join(","));
    }
    if (selectedDetailId) {
      params.set("selectedDetail", selectedDetailId);
    }
    navigate({ pathname: "/", hash: params.toString() });
    onClose();
  };

  const copyToClipboard = (value: string, what: string) => {
    navigator.clipboard.writeText(value);
    toast.info(`${what} [${getShortLabelByLetterCount(value, 200)}] copied to clipboard`);
    onClose();
  };

  const openSubmenu = useCallback(() => {
    clearTimeout(submenuCloseTimeout.current);
    setSubmenuOpen(true);
  }, []);

  const scheduleSubmenuClose = useCallback(() => {
    clearTimeout(submenuCloseTimeout.current);
    submenuCloseTimeout.current = setTimeout(() => setSubmenuOpen(false), SUBMENU_CLOSE_DELAY);
  }, []);

  const renderItem = (
    key: string,
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    color?: "danger",
  ) => (
    <StyledMenuItem key={key} $color={color} onClick={onClick} onMouseEnter={scheduleSubmenuClose}>
      <StyledItemIcon>{icon}</StyledItemIcon>
      <StyledItemLabel>{label}</StyledItemLabel>
    </StyledMenuItem>
  );

  const navigationItems = [
    // only the main page and the explorer mount a detail box to open into
    hasDetailPanel &&
      renderItem("detail", "Open in detail", <IcoCardText size={ICON_SIZE} />, openInDetail),
    targetTerritoryId &&
      renderItem(
        "territory",
        isStatement ? "Open statement in editor" : "Go to territory",
        isStatement ? <IcoEdit size={ICON_SIZE} /> : <IcoListTree size={ICON_SIZE} />,
        goToTerritory,
      ),
  ].filter(Boolean);

  return (
    <>
      {/* tags are rendered inside modals too, so the menu portals to the body and
          sits above the modal layer rather than inside the clipped page content */}
      <FloatingPortal>
        <div ref={menu.refs.setFloating} style={{ ...menu.floatingStyles, zIndex: MENU_Z_INDEX }}>
          <StyledMenuGroup
            style={animatedMount}
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
          >
            <StyledMenuHeader>
              <StyledMenuHeaderLabel>{entityLabel}</StyledMenuHeaderLabel>
            </StyledMenuHeader>
            <StyledMenuDivider />

            {navigationItems.length > 0 && (
              <>
                {navigationItems}
                <StyledMenuDivider />
              </>
            )}

            {renderItem("copy-label", "Copy label", <IcoCopy size={ICON_SIZE} />, () =>
              copyToClipboard(entityLabel, "label"),
            )}
            {renderItem("copy-id", "Copy ID", <IcoClipboard size={ICON_SIZE} />, () =>
              copyToClipboard(entity.id, "id"),
            )}

            <StyledMenuDivider />

            <StyledMenuItem
              key="bookmarks"
              ref={submenu.refs.setReference}
              onMouseEnter={openSubmenu}
              onMouseLeave={scheduleSubmenuClose}
              onClick={openSubmenu}
            >
              <StyledItemIcon>
                <IcoStar size={ICON_SIZE} />
              </StyledItemIcon>
              <StyledItemLabel>Bookmarks</StyledItemLabel>
              <StyledItemTrailing>
                {bookmarkedInCount > 0 && <span>{bookmarkedInCount}</span>}
                <IcoCaretRight size={ICON_SIZE} />
              </StyledItemTrailing>
            </StyledMenuItem>

            {onUnlink && (
              <>
                <StyledMenuDivider />
                {renderItem(
                  "unlink",
                  unlinkLabel,
                  <IcoUnlink size={ICON_SIZE} />,
                  () => {
                    onUnlink();
                    onClose();
                  },
                  "danger",
                )}
              </>
            )}
          </StyledMenuGroup>
        </div>
      </FloatingPortal>

      {submenuOpen && (
        <FloatingPortal>
          <div
            ref={submenu.refs.setFloating}
            style={{ ...submenu.floatingStyles, zIndex: MENU_Z_INDEX + 1 }}
          >
            <StyledMenuGroup
              onMouseEnter={openSubmenu}
              onMouseLeave={scheduleSubmenuClose}
              onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
            >
              {bookmarkFolders && bookmarkFolders.length > 0 ? (
                bookmarkFolders.map((folder) => {
                  const isBookmarked = folder.entities.some(
                    (bookmarked) => bookmarked.id === entity.id,
                  );
                  return (
                    <StyledMenuItem key={folder.id} onClick={() => toggleBookmark(folder.id)}>
                      <StyledItemIcon>
                        {isBookmarked && <IcoCheck size={ICON_SIZE} />}
                      </StyledItemIcon>
                      <StyledItemLabel>{folder.name}</StyledItemLabel>
                    </StyledMenuItem>
                  );
                })
              ) : (
                <StyledEmptyNote>no bookmark folders yet</StyledEmptyNote>
              )}
            </StyledMenuGroup>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
