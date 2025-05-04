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
}
export const AbbreviatedTextWithTooltip: React.FC<
  AbbreviatedTextWithTooltip
> = ({ text = "", documentId }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  const [allowFetch, setAllowFetch] = useState(false);
  const [document, setDocument] = useState<IDocument | null>(
    null
  );

  useEffect(() => {
    if (isTooltipOpen) {
      const timer = setTimeout(() => setAllowFetch(true), 500);
      return () => {
        setAllowFetch(false);
        clearTimeout(timer);
      };
    }
  }, [isTooltipOpen]);

  const { data, isFetching, isSuccess } = useQuery({
    queryKey: ["document", documentId, allowFetch],
    queryFn: async () => {
      const res = await api.documentGet(documentId);
      setDocument(res.data);
    },
    enabled: api.isLoggedIn() && !!documentId && allowFetch,
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
            {document?.content
              ? getShortLabelByLetterCount(document?.content, 4000)
              : text}
          </div>
        }
        visible={isTooltipOpen}
        referenceElement={referenceElement}
      />
    </React.Fragment>
  );
};
