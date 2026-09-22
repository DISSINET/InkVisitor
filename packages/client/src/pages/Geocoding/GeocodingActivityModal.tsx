import { useQuery } from "@tanstack/react-query";
import { Button, ButtonGroup, Loader, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import React from "react";
import { engineRecentRequests } from "./engine";
import { readGeocodingWriteHistory } from "./useGeocodingWriter";
import {
  StyledSourceLine,
  StyledSourceReport,
} from "./GeocodingSuggestionsStyles";
import { StyledSectionNote } from "./GeocodingSettingsModalStyles";

/**
 * What has been asked of the engine lately, and what this browser wrote.
 *
 * The two halves have different scopes and the copy says so. Engine requests
 * are every InkVisitor request the engine served, because `clientId` names the
 * application rather than the browser; the write history is local to this
 * browser and never leaves it.
 *
 * Read on demand rather than streamed: the live stream exists to report on a
 * request in flight, and this is for looking back afterwards.
 */

const when = (ms: number) => new Date(ms).toLocaleTimeString();

interface GeocodingActivityModal {
  onClose: () => void;
}

export const GeocodingActivityModal: React.FC<GeocodingActivityModal> = ({ onClose }) => {
  // read once on open: this is a log to look back at, not a live view
  const [writes] = React.useState(() => readGeocodingWriteHistory());
  const { data, isFetching, error } = useQuery({
    queryKey: ["geocoding-activity"],
    queryFn: ({ signal }) => engineRecentRequests(signal),
    retry: false,
  });

  return (
    <Modal showModal onClose={onClose} width="fat">
      <ModalHeader title="Geocoding activity" onClose={onClose} />
      <ModalContent column>
        <StyledSectionNote>
          <strong>Engine requests.</strong> Every geocoding request the engine has served for
          InkVisitor, not only this browser&apos;s. The engine&apos;s log is process-global, so
          nothing here should be treated as private.
        </StyledSectionNote>
        <StyledSourceReport>
          {error ? "The engine did not answer." : null}
          {!error && !isFetching && !(data || []).length ? "Nothing asked for yet." : null}
          {(data || []).map((entry) => (
            <StyledSourceLine
              key={entry.id}
              $status={entry.status === "finished" ? "ran" : entry.status}
            >
              {when(entry.startedAt)} · {entry.name} · {entry.status}
              {entry.durationMs ? ` · ${(entry.durationMs / 1000).toFixed(1)}s` : ""}
              {entry.error ? ` · ${entry.error}` : ""}
              {entry.lastLog ? ` · ${entry.lastLog}` : ""}
            </StyledSourceLine>
          ))}
        </StyledSourceReport>

        <StyledSectionNote>
          Coordinates written from this browser, and what each one replaced. The
          platform&apos;s audit records the new state and not the old one, so this is the only
          place a replaced coordinate is kept — and it is kept here, not on the server.
        </StyledSectionNote>
        <StyledSourceReport>
          {writes.length ? null : "Nothing written from this browser yet."}
          {writes.map((record) => (
            <StyledSourceLine key={`${record.locationId}-${record.at}`} $status="ran">
              {new Date(record.at).toLocaleString()} · {record.locationLabel} ·{" "}
              {record.previous.props.length
                ? `replaced ${record.previous.props.length} prop(s)`
                : "first coordinate"}
              {record.deletedValueIds.length
                ? ` · ${record.deletedValueIds.length} value(s) removed`
                : ""}
            </StyledSourceLine>
          ))}
        </StyledSourceReport>

        <Loader show={isFetching} />
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="Close" color="primary" onClick={onClose} />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
