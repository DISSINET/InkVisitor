import {
  GeoJsonGeometry,
  geometryAnchor,
  geometryVertexCount,
} from "@inkvisitor/shared/types/geometry";
import { Button, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import React from "react";
import { StyledSectionNote } from "./GeocodingSettingsModalStyles";
import { PendingOverwrite } from "./useGeocodingWriter";

/**
 * The one thing on this page that cannot be undone from it.
 *
 * A Location's geometry was put there by someone who judged it, and the write
 * replaces it outright — the platform's audit keeps only the new state. So the
 * old geometry is named here, where it is still readable, rather than being
 * described afterwards as "the previous value".
 */

interface GeocodingOverwriteModal {
  pending: PendingOverwrite;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A Point as its coordinates, any other shape as its type, size and centre. */
export const describeGeometry = (geometry: GeoJsonGeometry): string => {
  const { lat, lon } = geometryAnchor(geometry);
  const centre = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  return geometry.type === "Point"
    ? centre
    : `${geometry.type} (${geometryVertexCount(geometry)} points) around ${centre}`;
};

export const GeocodingOverwriteModal: React.FC<GeocodingOverwriteModal> = ({
  pending,
  onConfirm,
  onCancel,
}) => (
  <Modal showModal onClose={onCancel} width="normal">
    <ModalHeader title={`${pending.label} already has a geometry`} onClose={onCancel} />
    <ModalContent column>
      <StyledSectionNote>
        It sits at <strong>{describeGeometry(pending.from)}</strong> and this replaces it with{" "}
        <strong>{describeGeometry(pending.to)}</strong>. The old geometry is not kept anywhere it can be read
        back.
      </StyledSectionNote>
    </ModalContent>
    <ModalFooter>
      <Button label="keep the current one" color="greyer" onClick={onCancel} />
      <Button label="replace it" color="danger" onClick={onConfirm} />
    </ModalFooter>
  </Modal>
);
