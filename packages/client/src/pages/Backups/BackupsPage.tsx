import { IResponseBackup } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Box, Loader, Panel } from "components";
import { useTheme } from "hooks";
import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import { BeatLoader } from "react-spinners";
import { useAppSelector } from "redux/hooks";
import {
  StyledBackupFileName,
  StyledBackupId,
  StyledBackupsColumn,
  StyledBackupsContent,
  StyledCell,
  StyledDownloadLink,
  StyledDownloadOverlay,
  StyledDownloadOverlayLabel,
  StyledDownloadOverlayLink,
  StyledDownloadOverlayPanel,
  StyledEmpty,
  StyledGrid,
  StyledGridHeader,
  StyledGridScrollArea,
  StyledHeaderCell,
  StyledRow,
} from "./BackupsPageStyles";

// How long the overlay lingers after the auto-download fires, so the user can
// actually read the link / use it as a fallback if the auto-click is blocked.
const OVERLAY_LINGER_MS = 4000;

/**
 * A backup id is `<date folder>/<file name>`, and every folder holds the same
 * file name - the folder is what tells two backups apart.
 */
const splitBackupId = (id: string): [string, string] => {
  const separator = id.indexOf("/");
  return separator === -1 ? [id, ""] : [id.slice(0, separator), id.slice(separator + 1)];
};

// seconds carry no meaning for a backup taken once a day
const formatCreatedAt = (createdAt: string | Date): string =>
  new Date(createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatBytes = (bytes: number): string => {
  if (!bytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const BackupsPage: React.FC = () => {
  const layoutWidth: number = useAppSelector((state) => state.layout.layoutWidth);
  const contentHeight: number = useAppSelector((state) => state.layout.contentHeight);

  const { data: backups = [], isFetching } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const res = await api.backupsGet();
      return res.data ?? [];
    },
    enabled: api.isLoggedIn(),
  });

  const [download, setDownload] = useState<{
    backupId: string;
    filename: string;
    url?: string;
  } | null>(null);

  const handleDownload = async (backup: IResponseBackup) => {
    const filename = backup.id.replace(/\//g, "_");
    setDownload({ backupId: backup.id, filename });
    try {
      const url = await api.backupDownloadUrl(backup.id);
      setDownload({ backupId: backup.id, filename, url });

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Only clear if the state still belongs to this backup (user could have
      // started another).
      const clearOverlay = () =>
        setDownload((curr) => (curr?.backupId === backup.id ? null : curr));

      // A save dialog takes the focus away from the page; getting it back means
      // the user has answered it, so the overlay has nothing left to report.
      // Browsers that download without asking never blur, hence the timeout:
      // it lingers long enough for the link to be read and used as a fallback.
      const linger = window.setTimeout(clearOverlay, OVERLAY_LINGER_MS);
      window.addEventListener(
        "focus",
        () => {
          window.clearTimeout(linger);
          clearOverlay();
        },
        { once: true },
      );
    } catch {
      setDownload(null);
    }
  };

  return (
    <Panel width={layoutWidth}>
      <Box label="Backups" height={contentHeight} noFrame disableScroll>
        <StyledBackupsContent>
          <StyledBackupsColumn>
            <StyledGridScrollArea>
              <StyledGrid>
                <StyledGridHeader>
                  <StyledHeaderCell>File</StyledHeaderCell>
                  <StyledHeaderCell>Created</StyledHeaderCell>
                  <StyledHeaderCell $alignRight>Size</StyledHeaderCell>
                </StyledGridHeader>
                {backups.map((backup) => {
                  const [backupId, fileName] = splitBackupId(backup.id);
                  return (
                    <StyledRow key={backup.id}>
                      <StyledDownloadLink
                        type="button"
                        $disabled={!!download}
                        aria-disabled={!!download}
                        title={
                          download ? "another download is in progress" : "download this backup"
                        }
                        onClick={() => !download && handleDownload(backup)}
                      >
                        <FaDownload />
                        <StyledBackupId>{backupId}</StyledBackupId>
                        <StyledBackupFileName>{fileName}</StyledBackupFileName>
                      </StyledDownloadLink>
                      <StyledCell>{formatCreatedAt(backup.createdAt)}</StyledCell>
                      <StyledCell $alignRight>{formatBytes(backup.sizeBytes)}</StyledCell>
                    </StyledRow>
                  );
                })}
              </StyledGrid>
              {!isFetching && backups.length === 0 && <StyledEmpty>No backups found.</StyledEmpty>}
            </StyledGridScrollArea>

            <Loader show={isFetching} size={50} />

            <StyledDownloadOverlay $show={!!download} onClick={() => setDownload(null)}>
              <StyledDownloadOverlayPanel>
                <StyledDownloadOverlayLabel>
                  {download?.url ? "Download starting…" : "Preparing download…"}
                </StyledDownloadOverlayLabel>
                {download?.url && (
                  <StyledDownloadOverlayLink
                    href={download.url}
                    download={download.filename}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {download.filename}
                  </StyledDownloadOverlayLink>
                )}
                <BeatLoader size={10} color={useTheme().color["primary"]} />
              </StyledDownloadOverlayPanel>
            </StyledDownloadOverlay>
          </StyledBackupsColumn>
        </StyledBackupsContent>
      </Box>
    </Panel>
  );
};
