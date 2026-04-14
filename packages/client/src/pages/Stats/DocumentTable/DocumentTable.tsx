import { useQueries, useQuery } from "@tanstack/react-query";
import api from "api";

import { IDocument } from "@shared/types";
import {
  IAnchorUpdate,
  IAudit,
  IDocumentAuditAnchorChanges,
} from "@shared/types/audit";
import { IResponseAudit } from "@shared/types/response-audit";
import { IResponseEntity } from "@shared/types/response-entity";
import { BaseDropdown, Loader, Table, Timestamp } from "components";
import { EntityTag } from "components/advanced";
import { UserTag } from "components/advanced/UserTag/UserTag";
import { useMemo, useState } from "react";
import { Column } from "react-table";
import { DropdownItem } from "types";
import {
  StyledDocumentChangeFallback,
  StyledDocumentChangesLabel,
  StyledDocumentChangesList,
  StyledDocumentChangesRow,
  StyledDocumentChangesTags,
  StyledDocumentEmptyState,
  StyledDocumentInfoText,
  StyledDocumentRow,
  StyledField,
  StyledFieldLabel,
  StyledStatsContent,
} from "../StatsPageStyles";

type ChangeSectionKey = keyof IDocumentAuditAnchorChanges;

const changeSectionConfig: Array<{ key: ChangeSectionKey; label: string }> = [
  { key: "additions", label: "Added" },
  { key: "changes", label: "Changed" },
  { key: "removals", label: "Removed" },
];

const getChangeSections = (
  changes: object
): Array<{ key: ChangeSectionKey; label: string; anchors: string[] }> => {
  const parsed = changes as Partial<IDocumentAuditAnchorChanges>;
  return changeSectionConfig
    .map(({ key, label }) => {
      const raw = parsed[key];
      const anchors = (Array.isArray(raw) ? raw : [])
        .map((item) => (item as IAnchorUpdate)?.anchor)
        .filter((anchor): anchor is string => Boolean(anchor));
      return { key, label, anchors };
    })
    .filter((section) => section.anchors.length > 0);
};

const AuditChangesCell: React.FC<{ changes: object }> = ({ changes }) => {
  const sections = useMemo(() => getChangeSections(changes), [changes]);
  const anchorIds = useMemo(
    () => Array.from(new Set(sections.flatMap((section) => section.anchors))),
    [sections]
  );

  const entityQueries = useQueries({
    queries: anchorIds.map((entityId) => ({
      queryKey: ["entity", entityId],
      queryFn: async () => {
        const res = await api.entityGet(entityId);
        return res.data;
      },
      enabled: !!entityId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const entitiesById = useMemo(
    () =>
      anchorIds.reduce<Record<string, IResponseEntity>>(
        (acc, entityId, index) => {
          const data = entityQueries[index]?.data;
          if (data) {
            acc[entityId] = data;
          }
          return acc;
        },
        {}
      ),
    [anchorIds, entityQueries]
  );

  if (sections.length === 0) {
    return <StyledDocumentChangeFallback>-</StyledDocumentChangeFallback>;
  }

  return (
    <StyledDocumentChangesList>
      {sections.map((section) => (
        <StyledDocumentChangesRow key={section.key}>
          <StyledDocumentChangesLabel>
            {section.label}
          </StyledDocumentChangesLabel>
          <StyledDocumentChangesTags>
            {section.anchors.map((anchor, index) => {
              const entity = entitiesById[anchor];
              if (entity) {
                return (
                  <EntityTag
                    key={`${section.key}-${anchor}-${index}`}
                    entity={entity}
                    disableDoubleClick
                    disableDrag
                  />
                );
              }

              return (
                <StyledDocumentChangeFallback
                  key={`${section.key}-${anchor}-${index}`}
                >
                  {anchor}
                </StyledDocumentChangeFallback>
              );
            })}
          </StyledDocumentChangesTags>
        </StyledDocumentChangesRow>
      ))}
    </StyledDocumentChangesList>
  );
};

export const DocumentTable: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<DropdownItem | null>(
    null
  );

  const { data: dataDocuments, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.documentsGet({});
      return res.data;
    },
  });

  const documentOptions: DropdownItem[] = useMemo(() => {
    if (!dataDocuments) return [];
    return dataDocuments.map((doc: IDocument) => ({
      value: doc.id,
      label: doc.title || doc.id,
    }));
  }, [dataDocuments]);

  const { data: dataAudits, isLoading: isLoadingAudit } =
    useQuery<IResponseAudit>({
      queryKey: ["auditByDocument", selectedDocument?.value],
      queryFn: async () => {
        const res = await api.auditGetByDocument(
          selectedDocument!.value as string,
          30
        );
        return res.data;
      },
      enabled: !!selectedDocument?.value,
    });

  const auditTableColumns: Column<IAudit>[] = useMemo(
    () => [
      {
        Header: "Date",
        accessor: "date",
        Cell: ({ value }: { value: string | number | Date }) => (
          <Timestamp value={value} format="mixed" size="xs" />
        ),
      },
      {
        Header: "User",
        accessor: "user",
        Cell: ({ value }: { value: string }) => (
          <UserTag userId={value} variant="filled" hasIcon />
        ),
      },
      {
        Header: "Type",
        accessor: "type",
      },
      {
        Header: "Anchor Changes",
        accessor: "changes",
        Cell: ({ value }: { value: object }) => (
          <AuditChangesCell changes={value} />
        ),
      },
    ],
    []
  );

  const auditTableData: IAudit[] = useMemo(() => {
    if (!dataAudits?.last) return [];
    return dataAudits.last;
  }, [dataAudits]);
  const hasAudits = auditTableData.length > 0;

  return (
    <>
      <StyledDocumentRow>
        <StyledField>
          <StyledFieldLabel>Select Document</StyledFieldLabel>
          <BaseDropdown
            options={documentOptions}
            value={selectedDocument}
            onChange={(selected) => {
              setSelectedDocument(selected[0] || null);
            }}
            placeholder="Select a document..."
            width={300}
            disabled={isLoadingDocuments}
          />
        </StyledField>

        {selectedDocument && (
          <>
            {dataAudits?.first && hasAudits && (
              <StyledField>
                <StyledFieldLabel>First Audit Entry</StyledFieldLabel>
                <StyledDocumentInfoText>
                  <span>Created by</span>
                  <UserTag
                    userId={dataAudits.first.user}
                    variant="filled"
                    hasIcon
                  />
                  <span>on</span>
                  <Timestamp value={dataAudits.first.date} format="stamp" />
                </StyledDocumentInfoText>
              </StyledField>
            )}
          </>
        )}
      </StyledDocumentRow>

      {selectedDocument && (
        <>
          {hasAudits ? (
            <>
              <StyledFieldLabel>
                Recent Changes ({auditTableData.length} entries)
              </StyledFieldLabel>
              <Table
                data={auditTableData}
                columns={auditTableColumns}
                perPage={10}
                entityTitle={{
                  singular: "Audit Entry",
                  plural: "Audit Entries",
                }}
                isLoading={isLoadingAudit}
              />
            </>
          ) : (
            !isLoadingAudit && (
              <StyledDocumentEmptyState>
                No audit entries were found for this document. Please choose
                another document.
              </StyledDocumentEmptyState>
            )
          )}
        </>
      )}

      {!selectedDocument && !isLoadingDocuments && (
        <StyledDocumentEmptyState>
          Select a document to view its audit history.
        </StyledDocumentEmptyState>
      )}

      <Loader show={isLoadingDocuments || isLoadingAudit} />
    </>
  );
};
