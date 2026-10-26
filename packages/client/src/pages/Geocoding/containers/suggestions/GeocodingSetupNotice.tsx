import { Button } from "components";
import React from "react";
import { IcoWarning } from "Theme/icons";
import {
  StyledSetupNotice,
  StyledSetupNoticeIcon,
  StyledSetupNoticeText,
} from "./GeocodingSetupNoticeStyles";

/** "a geometry Concept and an accuracy Concept", each role with its own article. */
export const listMissingRoles = (missingRoles: string[]): string =>
  missingRoles.map((role) => `${/^[aeiou]/i.test(role) ? "an" : "a"} ${role}`).join(" and ");

interface GeocodingSetupNotice {
  /** Role names still unassigned, e.g. "geometry Concept". */
  missingRoles: string[];
  /** Opens the global settings; absent for a user who may not change them. */
  onOpenSettings?: () => void;
}

/**
 * Why engine geocoding is off on a project whose roles are not assigned yet.
 *
 * The engine dot carries the same state, but only on hover, and every control
 * it switches off is merely greyed out; this is the one place that says so
 * without being asked.
 */
export const GeocodingSetupNotice: React.FC<GeocodingSetupNotice> = ({
  missingRoles,
  onOpenSettings,
}) => (
  <StyledSetupNotice role="status">
    <StyledSetupNoticeIcon>
      <IcoWarning size={18} />
    </StyledSetupNoticeIcon>
    <StyledSetupNoticeText>
      {`Geocoding with the engine is off until the project assigns ${listMissingRoles(
        missingRoles
      )}.`}
      {onOpenSettings ? null : " A project owner sets them in Global geocoding."}
    </StyledSetupNoticeText>
    {onOpenSettings ? (
      <Button label="open Global geocoding" color="warning" onClick={onOpenSettings} />
    ) : null}
  </StyledSetupNotice>
);
