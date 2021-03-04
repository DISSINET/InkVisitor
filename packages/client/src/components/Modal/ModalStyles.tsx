import styled from "styled-components";
import { space3, space6, space8 } from "Theme/constants";

interface ModalWrap {
  showModal: boolean;
}
export const ModalWrap = styled.div<ModalWrap>`
  display: ${({ showModal }) => (showModal ? "flex" : "none")};
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
  width: ${({ fullwidth }) => (fullwidth ? "calc(100vw - 40px)" : "50%")};
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
  padding: ${space3};
  position: relative;
  background-color: #ffffff;
  border-bottom: 1px solid #dbdbdb;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
`;
export const CardTitle = styled.h2`
  /* display: flex; */
  /* flex-grow: 1; */
  /* flex-shrink: 0; */
  font-weight: ${({ theme }) => theme.fontWeights["medium"]};
  font-size: ${({ theme }) => theme.fontSizes["lg"]};
  line-height: 0.8;
`;
export const CardBody = styled.section`
  -webkit-overflow-scrolling: touch;
  flex-grow: 1;
  flex-shrink: 1;
  overflow: auto;
  padding: ${space6};
  background-color: #ffffff;
`;
export const Footer = styled.div`
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  border-top: 1px solid #dbdbdb;
  align-items: center;
  background-color: #ffffff;
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: ${space3};
  position: relative;
`;
