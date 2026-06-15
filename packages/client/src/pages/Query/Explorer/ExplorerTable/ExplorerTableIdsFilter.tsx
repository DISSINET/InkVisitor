import { Explore } from "@inkvisitor/shared/types/query";
import {
  applyPasteToDraft,
  entityIdsEqual,
  isViableUuidPrefix,
  mergeTokensIntoIds,
  unparsedRemainder,
} from "pages/Query/utils";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { MdClose } from "react-icons/md";
import { ExploreAction, ExploreActionType } from "../state";
import {
  StyledChipInputBox,
  StyledChipTextInput,
  StyledClearAllButton,
  StyledIdsCountBadge,
  StyledIdsFilterHint,
  StyledIdsFloatingRoot,
  StyledIdsPanel,
  StyledIdsPanelFooter,
  StyledIdsPanelHeader,
  StyledIdsPanelTitle,
  StyledIdsToggleButton,
  StyledIdsToggleClear,
  StyledIdsToggleWrapper,
  StyledUuidChip,
  StyledUuidChipRemove,
} from "./ExplorerTableStyles";

interface ExplorerTableIdsFilterProps {
  filters: Explore.IExploreSearchFilter[];
  dispatch: React.Dispatch<ExploreAction>;
}

const getRowIdsFilter = (
  filters: Explore.IExploreSearchFilter[],
): Explore.IExploreUuidsFilter | undefined =>
  filters.find((f): f is Explore.IExploreUuidsFilter => f.type === Explore.SearchOption.UUIDs);

const shortenUuid = (id: string): string =>
  id.length > 13 ? `${id.slice(0, 8)}…${id.slice(-5)}` : id;

// space the panel keeps from the button below it and from the top edge of the
// positioned ancestor (the explorer area) so it never spills out of the page.
const PANEL_BOTTOM_GAP = 8;
const PANEL_TOP_MARGIN = 16;
const PANEL_MIN_HEIGHT = 200;

const ExplorerTableIdsFilter: React.FC<ExplorerTableIdsFilterProps> = ({ filters, dispatch }) => {
  const rowIdsFilter = getRowIdsFilter(filters);
  const appliedIds = rowIdsFilter?.ids ?? [];

  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [allSelected, setAllSelected] = useState(false);
  const [maxPanelHeight, setMaxPanelHeight] = useState<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipBoxRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const scrollToBottomPendingRef = useRef(false);

  const showSelected = allSelected && appliedIds.length > 0;

  const requestScrollToBottom = () => {
    scrollToBottomPendingRef.current = true;
  };

  const dispatchFilter = useCallback(
    (ids: string[]) => {
      dispatch({
        type: ExploreActionType.setUuidsFilter,
        payload: { ids },
      });
    },
    [dispatch],
  );

  // Extract complete UUIDs from `text` into chips, keeping any half-typed / non-UUID
  // remainder in the draft so a blur or stray separator never wipes what you typed.
  const commit = useCallback(
    (text: string) => {
      const next = mergeTokensIntoIds(appliedIds, text);
      if (!entityIdsEqual(next, appliedIds)) {
        dispatchFilter(next);
      }
      setDraft(unparsedRemainder(text));
    },
    [appliedIds, dispatchFilter],
  );

  // Replace the entire UUID set with whatever is in `text` (used when the chips
  // are "select-all"ed and the user pastes/types a fresh batch).
  const replaceWith = useCallback(
    (text: string) => {
      const next = mergeTokensIntoIds([], text);
      if (!entityIdsEqual(next, appliedIds)) {
        dispatchFilter(next);
      }
      setDraft(unparsedRemainder(text));
    },
    [appliedIds, dispatchFilter],
  );

  const clearAllIds = () => {
    setAllSelected(false);
    dispatchFilter([]);
    setDraft("");
  };

  const removeId = (id: string) => {
    setAllSelected(false);
    dispatchFilter(appliedIds.filter((x) => x.toLowerCase() !== id.toLowerCase()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Cmd/Ctrl+A selects all existing UUIDs so the next paste/type replaces them.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a" && appliedIds.length > 0) {
      e.preventDefault();
      setAllSelected(true);
      return;
    }

    if (showSelected) {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        dispatchFilter([]);
        setDraft("");
        setAllSelected(false);
        return;
      }
      // a printable key replaces the whole set: clear now, let the char land in
      // the (now empty) input via onChange below.
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        dispatchFilter([]);
        setAllSelected(false);
      } else if (e.key !== "Shift" && e.key !== "Meta" && e.key !== "Control") {
        setAllSelected(false);
      }
    }

    // Note: Tab is intentionally not handled here — it commits via onBlur while
    // still moving focus normally (preventing it would trap keyboard focus).
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && appliedIds.length > 0) {
      e.preventDefault();
      dispatchFilter(appliedIds.slice(0, -1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");

    // With everything selected, paste swaps the whole set for the new UUIDs.
    if (showSelected) {
      replaceWith(pasted);
      setAllSelected(false);
      requestScrollToBottom();
      return;
    }

    const { selectionStart, selectionEnd } = e.currentTarget;
    commit(
      applyPasteToDraft(
        draft,
        selectionStart ?? draft.length,
        selectionEnd ?? draft.length,
        pasted,
      ),
    );
    requestScrollToBottom();
  };

  // The draft is flagged invalid only once it can no longer become a valid UUID,
  // so a half-typed UUID stays neutral while junk (e.g. "foo bar") is emphasized.
  const draftInvalid = draft.trim() !== "" && !isViableUuidPrefix(draft.trim());

  // Focus the input as soon as the panel opens.
  useEffect(() => {
    if (!isOpen) {
      setAllSelected(false);
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  // After paste, chips render on the next frame — scroll the box to the bottom then.
  useLayoutEffect(() => {
    if (!isOpen || !scrollToBottomPendingRef.current) {
      return;
    }
    scrollToBottomPendingRef.current = false;
    const el = chipBoxRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [appliedIds, draft, isOpen]);

  // Bound the panel height to the floating container's positioned ancestor (the
  // explorer area), so a long list of UUIDs scrolls inside the page instead of
  // overflowing past the top of the page content.
  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    const measure = () => {
      const button = buttonRef.current;
      const parent = (rootRef.current?.offsetParent as HTMLElement | null) ?? null;
      if (!button) {
        return;
      }
      const buttonRect = button.getBoundingClientRect();
      const parentTop = parent ? parent.getBoundingClientRect().top : 0;
      const available = buttonRect.top - parentTop - PANEL_BOTTOM_GAP - PANEL_TOP_MARGIN;
      setMaxPanelHeight(Math.max(PANEL_MIN_HEIGHT, available));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isOpen]);

  // Close (committing any pending draft) when clicking outside the panel.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        commit(draft);
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [isOpen, commit, draft]);

  return (
    <StyledIdsFloatingRoot ref={rootRef}>
      {isOpen && (
        <StyledIdsPanel style={maxPanelHeight ? { maxHeight: maxPanelHeight } : undefined}>
          <StyledIdsPanelHeader>
            <StyledIdsPanelTitle>Entity UUIDs</StyledIdsPanelTitle>
            <StyledUuidChipRemove
              type="button"
              aria-label="Close UUID filter"
              onClick={() => setIsOpen(false)}
            >
              <MdClose size={16} />
            </StyledUuidChipRemove>
          </StyledIdsPanelHeader>

          <StyledChipInputBox ref={chipBoxRef} onClick={() => inputRef.current?.focus()}>
            {appliedIds.map((id) => (
              <StyledUuidChip key={id} title={id} $selected={showSelected}>
                {shortenUuid(id)}
                <StyledUuidChipRemove
                  type="button"
                  aria-label={`Remove ${id}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeId(id);
                  }}
                >
                  <MdClose size={12} />
                </StyledUuidChipRemove>
              </StyledUuidChip>
            ))}
            <StyledChipTextInput
              ref={inputRef}
              value={draft}
              $invalid={draftInvalid}
              title={
                draftInvalid ? "Not a valid UUID — only complete UUIDs are allowed" : undefined
              }
              placeholder={
                appliedIds.length === 0 ? "Add entity UUIDs (paste or type)" : "Add UUID…"
              }
              onChange={(e) => {
                if (allSelected) {
                  setAllSelected(false);
                }
                setDraft(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => commit(draft)}
            />
          </StyledChipInputBox>

          {appliedIds.length > 0 && (
            <StyledIdsPanelFooter>
              <StyledIdsFilterHint>{`${appliedIds.length} UUID${
                appliedIds.length === 1 ? "" : "s"
              }`}</StyledIdsFilterHint>
              <StyledClearAllButton
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearAllIds}
              >
                <MdClose size={13} />
                Clear all
              </StyledClearAllButton>
            </StyledIdsPanelFooter>
          )}
        </StyledIdsPanel>
      )}

      <StyledIdsToggleWrapper ref={buttonRef}>
        <StyledIdsToggleButton
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {appliedIds.length > 0 ? <BiSearch size={18} /> : "+ "}
          UUIDs
          {appliedIds.length > 0 && <StyledIdsCountBadge>{appliedIds.length}</StyledIdsCountBadge>}
        </StyledIdsToggleButton>
        {appliedIds.length > 0 && (
          <StyledIdsToggleClear
            type="button"
            aria-label="Clear all UUIDs"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearAllIds}
          >
            <MdClose size={16} />
          </StyledIdsToggleClear>
        )}
      </StyledIdsToggleWrapper>
    </StyledIdsFloatingRoot>
  );
};

export default React.memo(ExplorerTableIdsFilter);
