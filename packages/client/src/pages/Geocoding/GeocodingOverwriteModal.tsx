import { Button, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import React from "react";
import { StyledSectionNote } from "./GeocodingSettingsModalStyles";
import { PendingOverwrite } from "./useGeocodingWriter";

/**
 * The one thing on this page that cannot be undone from it.
 *
 * A Location's coordinate was put there by someone who judged it, and the write
 * replaces it outright — the platform's audit keeps only the new state. So the
 * old coordinate is named here, where it is still readable, rather than being
 * described afterwards as "the previous value".
 */

interface GeocodingOverwriteModal {
  pending: PendingOverwrite;
  onConfirm: () => void;
  onCancel: () => void;
}

const at = (point: { lat: number; lon: number }) =>
  `${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`;

export const GeocodingOverwriteModal: React.FC<GeocodingOverwriteModal> = ({
  pending,
  onConfirm,
  onCancel,
}) => (
  <Modal showModal onClose={onCancel} width="normal">
    <ModalHeader title={`${pending.label} already has a coordinate`} onClose={onCancel} />
    <ModalContent column>
      <StyledSectionNote>
        It sits at <strong>{at(pending.from)}</strong> and this replaces it with{" "}
        <strong>{at(pending.to)}</strong>. The old coordinate is not kept anywhere it can be read
        back.
      </StyledSectionNote>
    </ModalContent>
    <ModalFooter>
      <Button label="keep the current one" color="greyer" onClick={onCancel} />
      <Button label="replace it" color="danger" onClick={onConfirm} />
    </ModalFooter>
  </Modal>
);
