import React from "react";
import { IcoSourceModel, IcoSourceRecords, IcoSourceService } from "Theme/icons";
import { StyledGazetteerMark } from "./GazetteerCardStyles";
import { LLM_SOURCE } from "../../utils/context/gazetteerCatalogue";

/**
 * The mark that tells what kind of source this is, before any text is read: a
 * database for one whose records the engine holds, a cloud for one it asks
 * online, and sparks for the model's own guess, which is not a gazetteer at all.
 */
export const GazetteerMark: React.FC<{ source: string; category: "file" | "service" }> = ({
  source,
  category,
}) => {
  const Icon =
    source === LLM_SOURCE
      ? IcoSourceModel
      : category === "file"
        ? IcoSourceRecords
        : IcoSourceService;
  return (
    <StyledGazetteerMark aria-hidden>
      <Icon />
    </StyledGazetteerMark>
  );
};
