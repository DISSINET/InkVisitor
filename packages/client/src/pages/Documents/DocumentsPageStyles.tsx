import { animated } from "@react-spring/web";
import { FaDotCircle } from "react-icons/fa";
import styled from "styled-components";

export const StyledContent = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
`;
interface StyledBoxWrap {}
export const StyledBoxWrap = styled.div<StyledBoxWrap>`
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
export const StyledBackground = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  margin: 2rem;
  padding: 1rem;
  border: 1px dashed black;
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.3);
  position: relative;
`;
export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr repeat(3, auto);
  align-items: center;
  overflow: auto;
`;

export const StyledFaDotCircle = styled(FaDotCircle)`
  color: ${({ theme }) => theme.color["black"]};
`;
export const StyledTitleWrap = styled.div`
  min-width: 18rem;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  padding: 0 1rem 0 0.8rem;
`;
export const StyledTitle = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  max-width: 100%;
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  padding: 0.3rem 0;
`;
export const StyledReference = styled.div`
  display: grid;
  max-width: 16rem;
  position: relative;
  padding: 0.2rem 1rem;
`;
export const StyledHeading = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["lg"]};
  text-decoration: underline;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledCount = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;

export const StyledInputWrap = styled.div`
  height: 5rem;
  min-width: 40rem;
  margin-top: 1rem;
  padding: 0.3rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  background: repeating-linear-gradient(
    -45deg,
    #fff,
    #fff,
    2px,
    #ccd5f4 1px,
    #ccd5f4 12px
  );
  background: ${({ theme }) => `
    repeating-linear-gradient(
    -45deg,
    #fff,
    #fff,
    2px,
    ${theme.color["blue"][100]} 1px,
    ${theme.color["blue"][100]} 12px
  )
  `};
`;
