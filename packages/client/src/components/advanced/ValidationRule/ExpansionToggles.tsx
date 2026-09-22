import {
  EValidationExpansionField,
  ITerritoryValidation,
  validationExpansionKind,
} from "@inkvisitor/shared/types/territory";
import { Checkbox } from "components";
import React from "react";
import {
  EQUIVALENTS_TOOLTIP,
  expansionKindLabel,
  expansionKindTooltip,
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
  const expansion = validation.expansions?.[field];

  if (!validation[field]?.length) {
    return null;
  }

  // the hosts merge rule changes one key deep, so the whole expansions object
  // travels on every toggle
  const setFlag = (
    flag: "equivalents" | "subordinates",
    checked: boolean
  ): void =>
    updateValidationRule({
      expansions: {
        ...(validation.expansions ?? {}),
        [field]: {
          ...(expansion ?? {}),
          [flag]: checked ? true : undefined,
        },
      },
    });

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
