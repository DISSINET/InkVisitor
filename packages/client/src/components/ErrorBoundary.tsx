import React, { Component, ErrorInfo, ReactNode } from "react";
import { IcoCopy, IcoRefresh } from "Theme/icons";
import {
  StyledActions,
  StyledButton,
  StyledCard,
  StyledDetails,
  StyledDiagnostics,
  StyledErrorMessage,
  StyledHeading,
  StyledLead,
  StyledPage,
  StyledQuip,
  StyledStack,
  StyledSummary,
} from "./ErrorBoundaryStyles";

const isDev = process.env.NODE_ENV === "development";

// picked by the error text rather than at random, so the same crash keeps the
// same quip across re-renders and across a reload
const quips = [
  "The component tree took this one personally.",
  "Somewhere below, a render function had opinions.",
  "React unmounted the evidence. The stack trace remains.",
  "This worked on someone's machine at some point.",
  "An undefined walked into a bar. There was no bar.",
  "The good news: the boundary caught it. The bad news: everything else.",
];

// componentStack lists frames innermost first, so its top line names the
// component whose render threw
const culpritComponent = (componentStack: string): string | undefined =>
  componentStack.match(/^\s*(?:at|in)\s+(\S+)/m)?.[1];

const pickQuip = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return quips[Math.abs(hash) % quips.length];
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  copied: boolean;
  /** Renders the client-facing variant on a dev build, to check its wording. */
  clientPreview: boolean;
  caughtAt?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, copied: false, clientPreview: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo, caughtAt: new Date().toLocaleTimeString() });
  }

  reportText(): string {
    const { error, errorInfo } = this.state;
    return [
      window.location.href,
      error?.stack ?? error?.toString() ?? "",
      errorInfo?.componentStack ?? "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, copied, clientPreview, caughtAt } = this.state;
      const devView = isDev && !clientPreview;
      const culprit = errorInfo?.componentStack
        ? culpritComponent(errorInfo.componentStack)
        : undefined;
      // ROOT_URL may be stored with or without a leading slash, so cutting it
      // out can leave a doubled separator behind
      const route =
        window.location.pathname.replace(process.env.ROOT_URL || "", "").replace(/\/{2,}/g, "/") ||
        "/";

      return (
        <StyledPage>
          <StyledCard>
            <StyledHeading>
              {devView
                ? "InkVisitor tripped over its own feet."
                : "This part of InkVisitor stopped responding."}
            </StyledHeading>

            {!devView && (
              <StyledLead>
                Anything you already saved is safe. Reloading brings you back to where you were. If
                it keeps happening, send the details below to the project owner.
              </StyledLead>
            )}

            {devView && (
              <>
                <StyledDiagnostics>
                  {[culprit && `‹${culprit}›`, route, caughtAt].filter(Boolean).join(" · ")}
                </StyledDiagnostics>
                <StyledQuip>{pickQuip(error?.stack ?? error?.message ?? "")}</StyledQuip>
              </>
            )}

            <StyledActions>
              <StyledButton $primary onClick={() => window.location.reload()}>
                <IcoRefresh />
                Reload the page
              </StyledButton>
              <StyledButton
                onClick={() =>
                  this.setState({
                    hasError: false,
                    error: undefined,
                    errorInfo: undefined,
                    copied: false,
                  })
                }
              >
                Try again
              </StyledButton>
              <StyledButton
                onClick={() => {
                  navigator.clipboard.writeText(this.reportText());
                  this.setState({ copied: true });
                }}
              >
                <IcoCopy />
                {copied ? "Copied" : "Copy report"}
              </StyledButton>
              {isDev && (
                <StyledButton
                  $pushRight
                  onClick={() => this.setState({ clientPreview: !clientPreview })}
                >
                  {clientPreview ? "Back to dev view" : "Preview client view"}
                </StyledButton>
              )}
            </StyledActions>

            <StyledDetails open={devView}>
              <StyledSummary>{devView ? "Stack trace" : "Technical details"}</StyledSummary>

              <StyledErrorMessage>{error?.toString()}</StyledErrorMessage>

              {errorInfo?.componentStack && (
                <StyledStack>{errorInfo.componentStack.trim()}</StyledStack>
              )}
            </StyledDetails>
          </StyledCard>
        </StyledPage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
