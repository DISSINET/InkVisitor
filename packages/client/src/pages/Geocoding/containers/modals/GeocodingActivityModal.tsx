import { Button, ButtonGroup, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import React from "react";
import { readRequestLog } from "../../utils/engine/requestLog";
import { readGeocodingWriteHistory } from "../../hooks/useGeocodingWriter";
import { StyledSourceLine, StyledSourceReport } from "../suggestions/GeocodingSuggestionsStyles";
import { StyledSectionNote } from "./GeocodingSettingsModalStyles";

/**
 * What this browser has asked of the engine lately, and what it wrote.
 *
 * Both halves are kept in this browser and never leave it. The engine's own
 * request list needs an admin token, which a browser does not hold.
 */

const when = (ms: number) => new Date(ms).toLocaleTimeString();

interface GeocodingActivityModal {
  onClose: () => void;
}

export const GeocodingActivityModal: React.FC<GeocodingActivityModal> = ({ onClose }) => {
  // read once on open: this is a log to look back at, not a live view
  const [writes] = React.useState(() => readGeocodingWriteHistory());
  const [requests] = React.useState(() => readRequestLog());

  return (
    <Modal showModal onClose={onClose} width="fat">
      <ModalHeader title="Geocoding activity" onClose={onClose} />
      <ModalContent column>
        <StyledSectionNote>
          <strong>Engine requests.</strong> What this browser has asked the geocoding engine, the
          latest fifty. Requests from other browsers are not shown, and nothing here leaves this
          browser.
        </StyledSectionNote>
        <StyledSourceReport>
          {requests.length ? null : "Nothing asked for yet."}
          {requests.map((entry) => (
            <StyledSourceLine
              key={`${entry.id ?? "none"}-${entry.startedAt}`}
              $status={entry.status === "finished" ? "ran" : "failed"}
            >
              {when(entry.startedAt)} · {entry.name} · {entry.status}
              {` · ${(entry.durationMs / 1000).toFixed(1)}s`}
              {entry.suggestions !== undefined ? ` · ${entry.suggestions} suggestions` : ""}
              {entry.error ? ` · ${entry.error}` : ""}
            </StyledSourceLine>
          ))}
        </StyledSourceReport>

        <StyledSectionNote>
          Coordinates written from this browser, and what each one replaced. The platform&apos;s
          audit records the new state and not the old one, so this is the only place a replaced
          coordinate is kept — and it is kept here, not on the server.
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
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="Close" color="primary" onClick={onClose} />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
