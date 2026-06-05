import { Explore } from "@inkvisitor/shared/types/query";
import {
  applyPasteToDraft,
  entityIdsEqual,
  mergeTokensIntoIds,
  unparsedRemainder,
} from "pages/Query/utils";
import React, { useCallback, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import { ExploreAction, ExploreActionType } from "../state";
import {
  StyledChipInputBox,
  StyledChipTextInput,
  StyledClearAllButton,
  StyledIdsFilter,
  StyledIdsFilterHint,
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

const ExplorerTableIdsFilter: React.FC<ExplorerTableIdsFilterProps> = ({ filters, dispatch }) => {
  const rowIdsFilter = getRowIdsFilter(filters);
  const appliedIds = rowIdsFilter?.ids ?? [];

  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const removeId = (id: string) =>
    dispatchFilter(appliedIds.filter((x) => x.toLowerCase() !== id.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Note: Tab is intentionally not handled here — it commits via onBlur while
    // still moving focus normally (preventing it would trap keyboard focus).
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && appliedIds.length > 0) {
      e.preventDefault();
      dispatchFilter(appliedIds.slice(0, -1));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { selectionStart, selectionEnd } = e.currentTarget;
    const pasted = e.clipboardData.getData("text");
    commit(
      applyPasteToDraft(draft, selectionStart ?? draft.length, selectionEnd ?? draft.length, pasted),
    );
  };

  return (
    <StyledIdsFilter>
      <StyledChipInputBox onClick={() => inputRef.current?.focus()}>
        {appliedIds.map((id) => (
          <StyledUuidChip key={id} title={id}>
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
          placeholder={appliedIds.length === 0 ? "Add entity UUIDs (paste or type)…" : "Add UUID…"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => commit(draft)}
        />
      </StyledChipInputBox>
      {appliedIds.length > 0 && (
        <>
          <StyledIdsFilterHint>{`${appliedIds.length} UUID${
            appliedIds.length === 1 ? "" : "s"
          }`}</StyledIdsFilterHint>
          <StyledClearAllButton
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              dispatchFilter([]);
              setDraft("");
            }}
          >
            <MdClose size={13} />
            Clear all
          </StyledClearAllButton>
        </>
      )}
    </StyledIdsFilter>
  );
};

export default React.memo(ExplorerTableIdsFilter);
