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
  StyledDownloadOverlayPanel,
  StyledEmpty,
  StyledGrid,
  StyledGridHeader,
  StyledGridScrollArea,
  StyledHeaderCell,
  StyledHeading,
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

  const [downloadingId, setDownloadingId] = useState<string | false>(false);

  const handleDownload = async (backup: IResponseBackup) => {
    setDownloadingId(backup.id);
    try {
      await api.backupDownload(backup.id);
    } finally {
      setDownloadingId(false);
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
                        disabled={!!downloadingId}
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

          <StyledDownloadOverlay $show={!!downloadingId}>
            <StyledDownloadOverlayPanel>
              <StyledDownloadOverlayLabel>Preparing download…</StyledDownloadOverlayLabel>
              <BeatLoader size={10} color={useTheme().color["primary"]} />
            </StyledDownloadOverlayPanel>
          </StyledDownloadOverlay>
        </StyledBackground>
      </StyledBoxWrap>
    </StyledContent>
  );
};
