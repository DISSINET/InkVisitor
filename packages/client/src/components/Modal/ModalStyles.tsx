import styled from "styled-components";
import { space1, space3, space5, space6, space7 } from "Theme/constants";

interface ModalWrap {}
export const ModalWrap = styled.div<ModalWrap>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  z-index: 40;
`;
export const Background = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  background-color: rgba(0, 0, 0, 0.86);
`;

interface Card {
  fullwidth?: boolean;
  inverted: boolean;
  width: "full" | "normal" | "thin";
}
const handleWidth = (width: string) => {
  switch (width) {
    case "full":
      return "calc(100vw - 40px)";
    case "normal":
      return "50rem";
    case "thin":
      return "auto";
  }
};
export const Card = styled.div<Card>`
  width: ${({ width }) => handleWidth(width)};
  min-width: 27rem;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  z-index: 50;
  background-color: ${({ theme, inverted }) =>
    inverted ? theme.color["primary"] : theme.color["white"]};
  color: ${({ theme, inverted }) =>
    inverted ? theme.color["white"] : theme.color["black"]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
`;

export const CardHeader = styled.header`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-shrink: 0;
  padding: ${space3} ${space6} ${space1} ${space6};
  position: relative;

  border-bottom-style: solid;
  border-bottom-width: ${({ theme }) => theme.borderWidth["default"]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][400]};
  min-height: ${({ theme }) => theme.space[12]};
`;
export const CardTitle = styled.h2`
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  font-size: ${({ theme }) => theme.fontSize["xl"]};
`;
export const CardBody = styled.section`
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  overflow: auto;
  padding: ${space5} ${space7};

  font-size: ${({ theme }) => theme.fontSize["sm"]};
  -webkit-overflow-scrolling: touch;
`;
export const Footer = styled.div`
  border-top-style: solid;
  border-top-width: ${({ theme }) => theme.borderWidth["default"]};
  border-top-color: ${({ theme }) => theme.color["gray"][400]};
  align-items: center;

  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.space[4]};
  position: relative;
`;
