import React, { useEffect, useState } from "react";

import { IDocumentGithubSync, IResponseDocumentGithub, IResponseGithubDevice } from "@inkvisitor/shared/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { formatStamp, toDate } from "components/basic/Timestamp/utils";
import { IcoCheck, IcoCopy, IcoEdit, IcoExclamation, IcoExternalLink, IcoGithub } from "Theme/icons";
import { getAppEnv } from "utils/appEnv";
import {
  StyledCompareCell,
  StyledCompareGrid,
  StyledCompareHead,
  StyledCompareLabel,
  StyledDeviceCode,
  StyledGithubBody,
  StyledGithubError,
  StyledGithubField,
  StyledGithubFieldLabel,
  StyledGithubFooterActions,
  StyledGithubFooterNote,
  StyledGithubHint,
  StyledGithubLink,
  StyledGithubNotice,
  StyledGithubNoticeIcon,
  StyledGithubRow,
  StyledGithubTarget,
} from "./DocumentGithubModalStyles";
import { defaultCommitMessage, githubNotice } from "./githubNotice";

const QUIET = { ignoreErrorToast: true };

const messageOf = (err: unknown): string =>
  (err as { message?: string } | undefined)?.message || "The request failed";

// both sides go through this, so the two dates read in one format and time zone
const stamp = (value?: string | Date): string => {
  const date = value ? toDate(value) : null;
  return date ? formatStamp(date) : "-";
};

const auditLabel = (auditType?: string): string => (auditType ? auditType.replace(/[._-]+/g, " ") : "-");

interface DocumentGithubModal {
  documentId: string;
  onClose: () => void;
}

/**
 * Commits a document to its file on GitHub. Shows the saved document and the
 * GitHub file side by side first, and leads through the two steps a commit
 * needs before that: the repository URL and the GitHub sign-in.
 */
export const DocumentGithubModal: React.FC<DocumentGithubModal> = ({ documentId, onClose }) => {
  const queryClient = useQueryClient();

  const {
    data: status,
    isLoading,
    isFetching,
    error: statusError,
    refetch,
  } = useQuery({
    queryKey: ["document-github", documentId],
    queryFn: async () => (await api.documentGithubStatus(documentId, QUIET)).data,
    refetchOnWindowFocus: false,
    retry: false,
    // the comparison is read from GitHub each time the dialog opens
    gcTime: 0,
  });

  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  // undefined until the user types: the field then shows the default message
  const [typedMessage, setTypedMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const [device, setDevice] = useState<IResponseGithubDevice>();
  const [signInNote, setSignInNote] = useState<string>();
  const [committed, setCommitted] = useState<IDocumentGithubSync>();
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  const targetPath = status?.target?.path;
  const message = typedMessage ?? (targetPath ? defaultCommitMessage(targetPath, getAppEnv()) : "");

  // One request per interval, as GitHub asks; "slow-down" stretches it.
  useEffect(() => {
    if (!device) {
      return;
    }
    let cancelled = false;
    let intervalSec = device.interval;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const { data } = await api.githubDevicePoll(QUIET);
        if (cancelled) {
          return;
        }
        if (data.status === "authorized") {
          setDevice(undefined);
          setSignInNote(undefined);
          refetch();
          return;
        }
        if (data.status === "expired" || data.status === "denied") {
          setDevice(undefined);
          setSignInNote(
            data.status === "denied"
              ? "The sign-in was refused on GitHub."
              : "The code expired before it was confirmed. Start the sign-in again.",
          );
          return;
        }
        if (data.status === "slow-down") {
          intervalSec += 5;
        }
      } catch (err) {
        if (!cancelled) {
          setDevice(undefined);
          setError(messageOf(err));
        }
        return;
      }
      timer = setTimeout(poll, intervalSec * 1000);
    };

    timer = setTimeout(poll, intervalSec * 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [device, refetch]);

  const run = async (action: () => Promise<void>) => {
    setError(undefined);
    setIsBusy(true);
    try {
      await action();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveUrl = () =>
    run(async () => {
      await api.documentSetRepository(documentId, urlInput.trim(), QUIET);
      setIsEditingUrl(false);
      setCommitted(undefined);
      setTypedMessage(undefined);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      await refetch();
    });

  const handleStartSignIn = () =>
    run(async () => {
      setSignInNote(undefined);
      setIsCodeCopied(false);
      setDevice((await api.githubDeviceStart(QUIET)).data);
    });

  const handleCommit = (current: IResponseDocumentGithub) =>
    run(async () => {
      let written: IDocumentGithubSync;
      try {
        const res = await api.documentGithubCommit(
          documentId,
          {
            repositoryUrl: current.repositoryUrl ?? "",
            message: message.trim(),
            expectedRemoteSha: current.github?.blobSha ?? null,
          },
          QUIET,
        );
        written = res.data;
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      } finally {
        // after a commit, and after a refusal because GitHub moved on, the
        // dialog shows what is there now
        await refetch();
      }
      // announced together with the comparison of the committed state
      setCommitted(written);
    });

  const handleEditUrl = () => {
    setUrlInput(status?.repositoryUrl ?? "");
    setError(undefined);
    setIsEditingUrl(true);
  };

  const handleCopyCode = () => {
    if (device) {
      navigator.clipboard.writeText(device.userCode);
      setIsCodeCopied(true);
    }
  };

  const notice = status ? githubNotice(status.state) : undefined;
  const showsUrlForm = !!status && status.configured && (isEditingUrl || status.state === "not-linked");
  const showsSignIn = !!status && !showsUrlForm && status.state === "not-authorized";
  const showsComparison = !!status && !showsUrlForm && !!notice;
  const canCommit = showsComparison && !!notice?.canCommit && !!message.trim() && !isBusy && !isFetching;

  const renderUrlForm = (current: IResponseDocumentGithub) => (
    <>
      <StyledGithubField>
        <StyledGithubFieldLabel>Repository URL of the file</StyledGithubFieldLabel>
        <Input
          value={urlInput}
          onChangeFn={setUrlInput}
          changeOnType
          autoFocus
          width="full"
          placeholder="https://github.com/owner/repository/blob/main/folder/file.txt"
          onEnterPressFn={handleSaveUrl}
        />
      </StyledGithubField>
      <StyledGithubHint>
        Paste the address of the file as GitHub shows it in the browser. The file name in the repository
        comes from this address, not from the document title.
        {current.repositoryUrl ? " Save an empty field to remove the link." : ""}
      </StyledGithubHint>
    </>
  );

  const renderSignIn = () => (
    <>
      {device ? (
        <>
          <div>Enter this code on GitHub to let InkVisitor commit as you:</div>
          <StyledGithubRow>
            <StyledDeviceCode>{device.userCode}</StyledDeviceCode>
            <Button
              icon={isCodeCopied ? <IcoCheck /> : <IcoCopy />}
              color="info"
              inverted
              tooltipLabel={isCodeCopied ? "copied" : "copy the code"}
              onClick={handleCopyCode}
            />
          </StyledGithubRow>
          <StyledGithubRow>
            <StyledGithubLink href={device.verificationUri} target="_blank" rel="noopener noreferrer">
              open GitHub to enter the code <IcoExternalLink size={11} />
            </StyledGithubLink>
          </StyledGithubRow>
          <StyledGithubHint>Waiting for the confirmation on GitHub. This dialog continues by itself.</StyledGithubHint>
        </>
      ) : (
        <>
          <div>Commits are made with your own GitHub account. InkVisitor never sees your password.</div>
          {signInNote && <StyledGithubError>{signInNote}</StyledGithubError>}
          <StyledGithubRow>
            <Button
              icon={<IcoGithub />}
              label="sign in to GitHub"
              color="info"
              disabled={isBusy}
              onClick={handleStartSignIn}
            />
          </StyledGithubRow>
        </>
      )}
    </>
  );

  const renderComparison = (current: IResponseDocumentGithub) => {
    const lastCommit = current.github?.lastCommit;
    return (
      <>
        <StyledCompareGrid>
          <span />
          <StyledCompareHead>InkVisitor ({getAppEnv()})</StyledCompareHead>
          <StyledCompareHead>GitHub</StyledCompareHead>

          <StyledCompareLabel>last change</StyledCompareLabel>
          <StyledCompareCell>{stamp(current.inkvisitor.updatedAt)}</StyledCompareCell>
          <StyledCompareCell>
            {current.github ? (current.github.exists ? stamp(lastCommit?.date) : "no file") : "-"}
          </StyledCompareCell>

          <StyledCompareLabel>by</StyledCompareLabel>
          <StyledCompareCell>{current.inkvisitor.userName || "-"}</StyledCompareCell>
          <StyledCompareCell>
            {lastCommit
              ? `${lastCommit.authorName}${lastCommit.authorLogin ? ` (${lastCommit.authorLogin})` : ""}`
              : "-"}
          </StyledCompareCell>

          <StyledCompareLabel>what</StyledCompareLabel>
          <StyledCompareCell>{auditLabel(current.inkvisitor.auditType)}</StyledCompareCell>
          <StyledCompareCell>
            {lastCommit ? (
              <StyledGithubLink href={lastCommit.url} target="_blank" rel="noopener noreferrer">
                {lastCommit.message}
              </StyledGithubLink>
            ) : (
              "-"
            )}
          </StyledCompareCell>
        </StyledCompareGrid>

        <div>
          Last commit from InkVisitor:{" "}
          {current.lastSync ? (
            <>
              {stamp(current.lastSync.committedAt)}, {current.lastSync.userName} (
              <StyledGithubLink href={current.lastSync.commitUrl} target="_blank" rel="noopener noreferrer">
                view
              </StyledGithubLink>
              )
            </>
          ) : (
            "none yet"
          )}
        </div>

        {committed && (
          <StyledGithubNotice $warning={false}>
            <span>
              Committed.{" "}
              <StyledGithubLink href={committed.commitUrl} target="_blank" rel="noopener noreferrer">
                View the commit on GitHub
              </StyledGithubLink>
            </span>
          </StyledGithubNotice>
        )}

        {notice && !(committed && current.state === "identical") && (
          <StyledGithubNotice $warning={notice.warning}>
            {notice.warning && (
              <StyledGithubNoticeIcon>
                <IcoExclamation />
              </StyledGithubNoticeIcon>
            )}
            <span>{notice.text}</span>
          </StyledGithubNotice>
        )}

        {notice?.canCommit && (
          <StyledGithubField>
            <StyledGithubFieldLabel>Commit message</StyledGithubFieldLabel>
            <Input
              value={message}
              onChangeFn={setTypedMessage}
              changeOnType
              width="full"
            />
          </StyledGithubField>
        )}
      </>
    );
  };

  return (
    <Modal width={640} showModal onClose={onClose}>
      <ModalHeader title="Commit to GitHub" icon={<IcoGithub />} />
      <ModalContent column enableScroll isLoading={isLoading}>
        <StyledGithubBody>
          {statusError && <StyledGithubError>{messageOf(statusError)}</StyledGithubError>}

          {status && !status.configured && (
            <div>
              Committing to GitHub is not set up on this deployment. The server needs the client id of a
              GitHub App (GITHUB_APP_CLIENT_ID).
            </div>
          )}

          {status?.configured && status.target && !showsUrlForm && (
            <StyledGithubRow>
              <StyledGithubTarget>
                <StyledGithubLink href={status.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  {status.target.owner}/{status.target.repo} · {status.target.branch} · {status.target.path}
                </StyledGithubLink>
              </StyledGithubTarget>
              <Button
                icon={<IcoEdit />}
                color="info"
                inverted
                tooltipLabel="change the repository URL"
                onClick={handleEditUrl}
              />
            </StyledGithubRow>
          )}

          {status && showsUrlForm && renderUrlForm(status)}
          {showsSignIn && renderSignIn()}
          {status && showsComparison && renderComparison(status)}

          {error && <StyledGithubError>{error}</StyledGithubError>}
        </StyledGithubBody>
      </ModalContent>
      <ModalFooter spaceBetween>
        <StyledGithubFooterNote>
          {status?.authorized && status.githubLogin ? `signed in to GitHub as ${status.githubLogin}` : ""}
        </StyledGithubFooterNote>
        <StyledGithubFooterActions>
          <ButtonGroup>
            {showsUrlForm && isEditingUrl ? (
              <CancelButton key="back" onClick={() => setIsEditingUrl(false)} />
            ) : (
              <CancelButton key="close" onClick={onClose} />
            )}
            {showsUrlForm && (
              <Button
                key="save"
                label="save"
                color="info"
                disabled={isBusy || urlInput.trim() === (status?.repositoryUrl ?? "")}
                onClick={handleSaveUrl}
              />
            )}
            {status && showsComparison && notice?.canCommit && (
              <Button
                key="commit"
                icon={<IcoGithub />}
                label={isBusy ? "committing" : "commit"}
                color={notice.warning ? "warning" : "info"}
                disabled={!canCommit}
                onClick={() => handleCommit(status)}
              />
            )}
          </ButtonGroup>
        </StyledGithubFooterActions>
      </ModalFooter>
    </Modal>
  );
};

export default DocumentGithubModal;
