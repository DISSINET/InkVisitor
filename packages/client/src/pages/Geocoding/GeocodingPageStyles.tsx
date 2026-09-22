import styled from "styled-components";
import { EngineState } from "./types";

export const StyledEngineStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  margin-left: auto;
  /* the engine's address is the longest thing in this header and the panel is
     draggable to a third of its width: without this it runs out of the Map box
     and over the Suggestions title beside it */
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["greyer"]};
  white-space: nowrap;

  > * {
    flex: 0 0 auto;
  }
`;

/**
 * Names what the dot beside it is about.
 *
 * In the body face rather than the box header's own, which is a display font
 * with no lowercase: this is a status line like the one the page header keeps
 * for the server's latency, not a second title beside "MAP".
 */
export const StyledEngineLabel = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: none;
  font-family: ${({ theme }) => theme.fontFamily["body"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
`;

export const StyledEngineDot = styled.span<{ $state: EngineState }>`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ theme, $state }) => {
    switch ($state) {
      case "up":
        return theme.color["success"];
      case "down":
        return theme.color["danger"];
      case "unconfigured":
        return theme.color["warning"];
      default:
        return theme.color["greyer"];
    }
  }};
`;


