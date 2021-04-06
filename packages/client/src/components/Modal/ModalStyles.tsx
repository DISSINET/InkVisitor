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
}
export const Card = styled.div<Card>`
  width: ${({ fullwidth }) => (fullwidth ? "calc(100vw - 40px)" : "50rem")};
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  z-index: 50;
`;

export const CardHeader = styled.header`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-shrink: 0;
  padding: ${space3} ${space6} ${space1} ${space6};
  position: relative;
  background-color: ${({ theme }) => theme.colors["white"]};
  border-bottom-style: solid;
  border-bottom-width: ${({ theme }) => theme.borderWidths["default"]};
  border-bottom-color: ${({ theme }) => theme.colors["gray"][400]};
  border-top-left-radius: ${({ theme }) => theme.borderRadius["sm"]};
  border-top-right-radius: ${({ theme }) => theme.borderRadius["sm"]};
  min-height: ${({ theme }) => theme.space[12]};
`;
export const CardTitle = styled.h2`
  font-weight: ${({ theme }) => theme.fontWeights["medium"]};
  font-size: ${({ theme }) => theme.fontSizes["xl"]};
`;
export const CardBody = styled.section`
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  overflow: auto;
  padding: ${space5} ${space7};
  background-color: #ffffff;
  font-size: ${({ theme }) => theme.fontSizes["sm"]};
  -webkit-overflow-scrolling: touch;
`;
export const Footer = styled.div`
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius["sm"]};
  border-bottom-right-radius: ${({ theme }) => theme.borderRadius["sm"]};
  border-top-style: solid;
  border-top-width: ${({ theme }) => theme.borderWidths["default"]};
  border-top-color: ${({ theme }) => theme.colors["gray"][400]};
  align-items: center;
  background-color: #ffffff;
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.space[4]};
  position: relative;
`;
