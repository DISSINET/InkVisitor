import { IResponseBackup } from "@inkvisitor/shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Loader } from "components";
import { useTheme } from "hooks";
import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import { BeatLoader } from "react-spinners";
import {
  StyledBackground,
  StyledBoxWrap,
  StyledCell,
  StyledContent,
  StyledDownloadOverlay,
  StyledDownloadOverlayLabel,
  StyledDownloadOverlayLink,
  StyledDownloadOverlayPanel,
  StyledEmpty,
  StyledGrid,
  StyledGridHeader,
  StyledGridScrollArea,
  StyledHeaderCell,
  StyledHeading,
  StyledRow,
} from "./BackupsPageStyles";

// How long the overlay lingers after the auto-download fires, so the user can
// actually read the link / use it as a fallback if the auto-click is blocked.
const OVERLAY_LINGER_MS = 4000;

const formatBytes = (bytes: number): string => {
  if (!bytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const BackupsPage: React.FC = () => {
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

      // Linger so the link is visible/usable as a fallback. Only clear if the
      // state still belongs to this backup (user could have started another).
      setTimeout(() => {
        setDownload((curr) => (curr?.backupId === backup.id ? null : curr));
      }, OVERLAY_LINGER_MS);
    } catch {
      setDownload(null);
    }
  };

  return (
    <StyledContent>
      <StyledBoxWrap>
        <StyledBackground>
          <StyledHeading>Backups</StyledHeading>
          <StyledGridScrollArea>
            <StyledGrid>
              <StyledGridHeader>
                <StyledHeaderCell>File</StyledHeaderCell>
                <StyledHeaderCell>Created</StyledHeaderCell>
                <StyledHeaderCell>Size</StyledHeaderCell>
                <StyledHeaderCell>Action</StyledHeaderCell>
              </StyledGridHeader>
              {backups.map((backup) => (
                <StyledRow key={backup.id}>
                  <StyledCell>{backup.id}</StyledCell>
                  <StyledCell>{new Date(backup.createdAt).toLocaleString()}</StyledCell>
                  <StyledCell>{formatBytes(backup.sizeBytes)}</StyledCell>
                  <StyledCell>
                    <ButtonGroup>
                      <Button
                        icon={<FaDownload />}
                        label="Download"
                        color="primary"
                        inverted
                        disabled={!!download}
                        onClick={() => handleDownload(backup)}
                      />
                    </ButtonGroup>
                  </StyledCell>
                </StyledRow>
              ))}
            </StyledGrid>
            {!isFetching && backups.length === 0 && <StyledEmpty>No backups found.</StyledEmpty>}
          </StyledGridScrollArea>

          <Loader show={isFetching} size={50} />

          <StyledDownloadOverlay
            $show={!!download}
            onClick={() => setDownload(null)}
          >
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
        </StyledBackground>
      </StyledBoxWrap>
    </StyledContent>
  );
};
