import { useQuery } from "@tanstack/react-query";
import { IResponseBackup } from "@inkvisitor/shared/types";
import api from "api";
import { Button, ButtonGroup, Loader } from "components";
import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import {
  StyledBackground,
  StyledBoxWrap,
  StyledCell,
  StyledContent,
  StyledDownloadOverlay,
  StyledEmpty,
  StyledGrid,
  StyledGridHeader,
  StyledGridScrollArea,
  StyledHeaderCell,
  StyledHeading,
  StyledProgressFill,
  StyledProgressLabel,
  StyledProgressPanel,
  StyledProgressTrack,
  StyledRow,
} from "./BackupsPageStyles";

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

  const [downloadUi, setDownloadUi] = useState<{
    backupId: string;
    loaded: number;
    total: number;
    showOverlay: boolean;
  } | null>(null);

  const handleDownload = async (backup: IResponseBackup) => {
    const showDownloadOverlay = !api.supportsBackupSaveFilePicker();

    setDownloadUi({
      backupId: backup.id,
      loaded: 0,
      total: backup.sizeBytes,
      showOverlay: showDownloadOverlay,
    });

    try {
      await api.backupDownload(backup.id, {
        expectedTotal: backup.sizeBytes,
        onDownloadProgress: showDownloadOverlay
          ? ({ loaded, total }) => {
              setDownloadUi((current) =>
                current
                  ? {
                      ...current,
                      loaded,
                      total: total && total > 0 ? total : current.total,
                    }
                  : null
              );
            }
          : undefined,
      });
    } catch (err) {
      api.showErrorToast(err);
    } finally {
      setDownloadUi(null);
    }
  };

  const downloadPercent =
    downloadUi && downloadUi.total > 0
      ? Math.min(100, Math.round((downloadUi.loaded / downloadUi.total) * 100))
      : 0;

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
                  <StyledCell>
                    {new Date(backup.createdAt).toLocaleString()}
                  </StyledCell>
                  <StyledCell>{formatBytes(backup.sizeBytes)}</StyledCell>
                  <StyledCell>
                    <ButtonGroup>
                      <Button
                        icon={<FaDownload />}
                        label="Download"
                        color="primary"
                        inverted
                        disabled={!!downloadUi}
                        onClick={() => handleDownload(backup)}
                      />
                    </ButtonGroup>
                  </StyledCell>
                </StyledRow>
              ))}
            </StyledGrid>
            {!isFetching && backups.length === 0 && (
              <StyledEmpty>No backups found.</StyledEmpty>
            )}
          </StyledGridScrollArea>

          <Loader show={isFetching} size={50} />

          <StyledDownloadOverlay $show={!!downloadUi?.showOverlay}>
            <StyledProgressPanel>
              <StyledProgressTrack>
                <StyledProgressFill $percent={downloadPercent} />
              </StyledProgressTrack>
              <StyledProgressLabel>
                Downloading… {downloadPercent}%
                {downloadUi && downloadUi.total > 0 && (
                  <>
                    {" "}
                    ({formatBytes(downloadUi.loaded)} / {formatBytes(downloadUi.total)})
                  </>
                )}
              </StyledProgressLabel>
            </StyledProgressPanel>
          </StyledDownloadOverlay>
        </StyledBackground>
      </StyledBoxWrap>
    </StyledContent>
  );
};
