import { ExpansionGroup } from "@inkvisitor/shared/types/response-entity-expansion";
import {
  EValidationExpansionField,
  ITerritoryValidation,
  validationExpansionKind,
} from "@inkvisitor/shared/types/territory";
import { Checkbox } from "components";
import React, { useEffect, useRef } from "react";
import {
  EQUIVALENTS_TOOLTIP,
  expansionKindLabel,
  expansionKindTooltip,
  withExpansionFlag,
} from "utils/validationExpansion";
import {
  StyledExpansionLabel,
  StyledExpansionRow,
} from "./ValidationRuleStyles";

interface ExpansionToggles {
  field: EValidationExpansionField;
  validation: ITerritoryValidation;
  updateValidationRule: (changes: Partial<ITerritoryValidation>) => void;
  userCanEdit: boolean;
}

/**
 * The two boxes that let a field stand for more than the entities picked in it.
 * Rendered only once the field holds an entity, since there is nothing to widen
 * before that.
 */
export const ExpansionToggles: React.FC<ExpansionToggles> = ({
  field,
  validation,
  updateValidationRule,
  userCanEdit,
}) => {
  const kind = validationExpansionKind(field, validation.tieType);

  // The rule arrives from the server and is re-rendered only once a save has
  // come back, so a second box ticked before that would be built on the rule as
  // it was BEFORE the first tick and would drop it. Hold what was last sent
  // until the saved rule catches up.
  const sent = useRef<ITerritoryValidation["expansions"] | null>(null);
  useEffect(() => {
    sent.current = null;
  }, [validation.expansions]);

  const expansion = (sent.current ?? validation.expansions ?? {})[field];

  if (!validation[field]?.length) {
    return null;
  }

  // the hosts merge rule changes one key deep, so the whole expansions object
  // travels on every toggle
  const setFlag = (flag: ExpansionGroup, checked: boolean): void => {
    const next = withExpansionFlag(
      sent.current ?? validation.expansions,
      field,
      flag,
      checked
    );
    // an empty object, not undefined: the next tick must build on "no flags"
    // rather than fall back to the rule the server still holds
    sent.current = next ?? {};
    updateValidationRule({ expansions: next });
  };

  return (
    <StyledExpansionRow>
      <StyledExpansionLabel>also accept</StyledExpansionLabel>
      <Checkbox
        label="equivalents"
        size={13}
        value={expansion?.equivalents === true}
        disabled={!userCanEdit}
        tooltipLabel="include equivalents"
        tooltipContent={EQUIVALENTS_TOOLTIP}
        onChangeFn={(checked) => setFlag("equivalents", checked)}
      />
      {kind && (
        <Checkbox
          label={expansionKindLabel(kind)}
          size={13}
          value={expansion?.subordinates === true}
          disabled={!userCanEdit}
          tooltipLabel={`include ${expansionKindLabel(kind)}`}
          tooltipContent={expansionKindTooltip(kind)}
          onChangeFn={(checked) => setFlag("subordinates", checked)}
        />
      )}
    </StyledExpansionRow>
  );
};
