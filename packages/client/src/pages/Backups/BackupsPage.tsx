import { useMutation, useQuery } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Loader } from "components";
import { useTheme } from "hooks";
import React, { useEffect, useRef } from "react";
import { FaDownload } from "react-icons/fa";
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
import { BeatLoader } from "react-spinners";

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

  const downloadAbortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      downloadAbortRef.current?.abort();
    },
    []
  );

  const downloadMutation = useMutation({
    mutationFn: async (backupId: string) => {
      downloadAbortRef.current?.abort();
      const controller = new AbortController();
      downloadAbortRef.current = controller;
      await api.backupDownload(backupId, { signal: controller.signal });
    },
    onError: (err) => api.showErrorToast(err),
  });

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
                        disabled={downloadMutation.isPending}
                        onClick={() => downloadMutation.mutate(backup.id)}
                      />
                    </ButtonGroup>
                  </StyledCell>
                </StyledRow>
              ))}
            </StyledGrid>
            {!isFetching && backups.length === 0 && <StyledEmpty>No backups found.</StyledEmpty>}
          </StyledGridScrollArea>

          <Loader show={isFetching} size={50} />

          <StyledDownloadOverlay $show={downloadMutation.isPending}>
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
