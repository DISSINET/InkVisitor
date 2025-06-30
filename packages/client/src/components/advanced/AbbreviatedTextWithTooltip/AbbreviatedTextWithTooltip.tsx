import { IDocument } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import React, { useEffect, useState } from "react";
import { Tooltip } from "../../basic/Tooltip/Tooltip";
import {
  StyledText,
  StyledTextWrapper,
} from "./AbbreviatedTextWithTooltipStyles";
import { getShortLabelByLetterCount } from "utils/utils";

interface AbbreviatedTextWithTooltip {
  text?: string;
  documentId: string;
  entityId: string;
  anchorIndex: number;
}
export const AbbreviatedTextWithTooltip: React.FC<
  AbbreviatedTextWithTooltip
> = ({ text = "", documentId, entityId, anchorIndex }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  const [allowFetch, setAllowFetch] = useState(false);

  useEffect(() => {
    if (isTooltipOpen) {
      const timer = setTimeout(() => setAllowFetch(true), 500);
      return () => {
        setAllowFetch(false);
        clearTimeout(timer);
      };
    }
  }, [isTooltipOpen]);

  const {
    data: anchorText,
    isFetching,
    isSuccess,
  } = useQuery({
    queryKey: ["anchorText", documentId, entityId, anchorIndex, allowFetch],
    queryFn: async () => {
      const res = await api.documentGetAnchorText(
        documentId,
        entityId,
        anchorIndex
      );
      return res.data.data;
    },
    enabled: api.isLoggedIn() && allowFetch,
  });

  return (
    <React.Fragment>
      <StyledTextWrapper
        ref={setReferenceElement}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
      >
        <div style={{ display: "grid" }}>
          <StyledText>{text}</StyledText>
        </div>
      </StyledTextWrapper>
      <Tooltip
        content={
          <div>
            {anchorText ? getShortLabelByLetterCount(anchorText, 4120) : text}
          </div>
        }
        visible={isTooltipOpen}
        referenceElement={referenceElement}
      />
    </React.Fragment>
  );
};
