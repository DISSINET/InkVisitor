import { TbMailFilled } from "react-icons/tb";
import styled, { DefaultTheme } from "styled-components";

// The logo asset is white + light blue, so the band keeps the fixed dark muni
// background in both light and dark mode.
export const StyledLogoBand = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.color["muni"]};
  /* horizontal padding matches StyledContentWrap's side margin, so the logo
     spans exactly the same column as the form below it at any modal width */
  padding: ${({ theme }) => `${theme.space[7]} ${theme.space[12]}`};
  border-top-left-radius: ${({ theme }) => theme.borderRadius["sm"]};
  border-top-right-radius: ${({ theme }) => theme.borderRadius["sm"]};

  img {
    width: 100%;
  }
`;
export const StyledContentWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 2.5rem 3rem;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  width: 100%;
`;
/* Every control in an auth form sits on this one row height - fields and the
   submit button read as a single column of equal blocks. A labelled Button
   sizes itself from padding, so it needs the row height plus `fullHeight`. */
const authRowHeight = ({ theme }: { theme: DefaultTheme }) => theme.space[14];

export const StyledInputRow = styled.div`
  display: flex;
  width: 100%;
  height: ${authRowHeight};

  /* Input's inner positioning wrapper is centered, not stretched, so the
     row's height has to be passed down to it for fullHeight to take effect. */
  > div > div {
    height: 100%;
  }
`;
export const StyledErrorWrap = styled.div`
  margin-top: ${({ theme }) => theme.space["-2"]};
`;
/* the form's own gap keeps the fields as one group, so the submit and the
   secondary link each add enough on top to read as their own step */
export const StyledSubmitWrap = styled.div`
  display: flex;
  width: 100%;
  height: ${authRowHeight};
  margin-top: ${({ theme }) => theme.space[5]};
`;
export const StyledShowPasswordButton = styled.button`
  display: flex;
  align-items: center;
  border: none;
  background: none;
  padding: 0;
  margin-right: ${({ theme }) => theme.space[1]};
  cursor: pointer;
  color: ${({ theme }) => theme.color["gray"][500]};

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.color["primary"]};
  }
`;
export const StyledLinkButton = styled.button`
  align-self: center;
  margin-top: ${({ theme }) => theme.space[3]};
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.color["primary"]};
    text-decoration: underline;
  }
`;
export const StyledCenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
export const StyledMail = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2.5rem;
  margin-top: 0.2rem;
`;
export const StyledMailIcon = styled(TbMailFilled)`
  margin-right: ${({ theme }) => theme.space[2]};
`;
export const StyledDescription = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
`;
export const StyledButtonWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;
export const StyledErrorText = styled.p`
  margin-top: 0.5rem;
  text-align: center;
  color: ${({ theme }) => theme.color["danger"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledText = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
