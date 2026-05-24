import { IDocument, DropdownItem } from "@inkvisitor/shared/types";
import { IAnchorUpdate, IAudit, IDocumentAuditAnchorChanges } from "@inkvisitor/shared/types/audit";
import { IResponseAudit } from "@inkvisitor/shared/types/response-audit";
import { IResponseEntity } from "@inkvisitor/shared/types/response-entity";
import { useQueries, useQuery } from "@tanstack/react-query";
import api from "api";
import { BaseDropdown, Loader, Table, Timestamp } from "components";
import { EntityTag } from "components/advanced";
import { UserTag } from "components/advanced/UserTag/UserTag";
import { useResizeObserver } from "hooks";
import { useMemo } from "react";
import { Column } from "react-table";
import {
  StyledDocumentChangeFallback,
  StyledDocumentChangesLabel,
  StyledDocumentChangesList,
  StyledDocumentChangesRow,
  StyledDocumentChangesTags,
  StyledDocumentEmptyState,
  StyledDocumentInfoText,
  StyledDocumentRow,
  StyledDocumentsLayout,
  StyledField,
  StyledFieldLabel,
} from "../StatsPageStyles";
import {
  HIDDEN_DOCUMENT_CHANGE_SECTIONS,
  HIDDEN_EVENT_TYPES,
} from "../constants";

type ChangeSectionKey = keyof IDocumentAuditAnchorChanges;
const DEFAULT_AUDITS_PER_PAGE = 10;
const HEIGHT_TABLE_ROW = 35;
const TABLE_HEADER_HEIGHT = 60;

const changeSectionConfig: Record<ChangeSectionKey, { label: string }> = {
  additions: { label: "Added" },
  changes: { label: "Changed" },
  removals: { label: "Deleted" },
};

const hiddenChangeSectionKeys = new Set<string>(HIDDEN_DOCUMENT_CHANGE_SECTIONS);
const changeSectionKeys = (Object.keys(changeSectionConfig) as ChangeSectionKey[]).filter(
  (key) => !hiddenChangeSectionKeys.has(key)
);

const getSectionLabel = (sectionKey: ChangeSectionKey): string => {
  return changeSectionConfig[sectionKey]?.label ?? sectionKey;
};

const getChangeSections = (
  changes: object
): Array<{ key: ChangeSectionKey; label: string; anchors: string[] }> => {
  const parsed = changes as Partial<IDocumentAuditAnchorChanges>;
  return changeSectionKeys
    .map((sectionKey) => {
      const raw = parsed[sectionKey];
      const anchors = (Array.isArray(raw) ? raw : [])
        .map((item) => (item as IAnchorUpdate)?.anchor)
        .filter((anchor): anchor is string => Boolean(anchor));
      return { key: sectionKey, label: getSectionLabel(sectionKey), anchors };
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
      queryKey: ["entity", "document-table", entityId],
      queryFn: async () => {
        const res = await api.entityGet(entityId, { ignoreErrorToast: true });
        return res.data;
      },
      enabled: !!entityId && api.isLoggedIn(),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const entitiesById = useMemo(
    () =>
      anchorIds.reduce<Record<string, IResponseEntity>>((acc, entityId, index) => {
        const data = entityQueries[index]?.data;
        if (data) {
          acc[entityId] = data;
        }
        return acc;
      }, {}),
    [anchorIds, entityQueries]
  );

  if (sections.length === 0) {
    return <StyledDocumentChangeFallback>-</StyledDocumentChangeFallback>;
  }

  return (
    <StyledDocumentChangesList>
      {sections.map((section) => (
        <StyledDocumentChangesRow key={section.key}>
          <StyledDocumentChangesLabel>{section.label}</StyledDocumentChangesLabel>
          <StyledDocumentChangesTags>
            {section.anchors.map((anchor, index) => {
              const entity = entitiesById[anchor];
              if (entity) {
                return (
                  <div style={{ display: "grid" }}>
                    <EntityTag
                      key={`${section.key}-${anchor}-${index}`}
                      entity={entity}
                      disableDoubleClick
                      disableDrag
                      fullWidth
                    />
                  </div>
                );
              }

              return (
                <StyledDocumentChangeFallback key={`${section.key}-${anchor}-${index}`}>
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

type DocumentTableProps = {
  selectedDocument: DropdownItem | null;
  setSelectedDocument: (document: DropdownItem | null) => void;
};

export const DocumentTable: React.FC<DocumentTableProps> = ({
  selectedDocument,
  setSelectedDocument,
}) => {
  const { ref: tableContentRef, height: tableContentHeight = 0 } =
    useResizeObserver<HTMLDivElement>({
      debounceDelay: 50,
    });

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

  const { data: dataAudits, isLoading: isLoadingAudit } = useQuery<IResponseAudit>({
    queryKey: ["auditByDocument", selectedDocument?.value],
    queryFn: async () => {
      const res = await api.auditGetByDocument(selectedDocument!.value as string, 30);
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
        Cell: ({ value }: { value: string }) => <UserTag userId={value} />,
      },
      {
        Header: "Type",
        accessor: "type",
      },
      {
        Header: "Anchor Changes",
        accessor: "changes",
        Cell: ({ value, row }: { value: object; row: { original: IAudit } }) => (
          <AuditChangesCell changes={value} />
        ),
      },
    ],
    []
  );

  const auditTableData: IAudit[] = useMemo(() => {
    if (!dataAudits?.last) return [];
    return dataAudits.last.filter((audit) => !HIDDEN_EVENT_TYPES.includes(audit.type));
  }, [dataAudits]);
  const hasAudits = auditTableData.length > 0;

  return (
    <StyledDocumentsLayout>
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
                  <UserTag userId={dataAudits.first.user} />
                  <span>on</span>
                  <Timestamp value={dataAudits.first.date} format="stamp" />
                </StyledDocumentInfoText>
              </StyledField>
            )}
          </>
        )}
      </StyledDocumentRow>

      <div ref={tableContentRef} style={{ height: "100%", minHeight: 0 }}>
        {selectedDocument && (
          <>
            {hasAudits ? (
              <>
                <Table
                  data={auditTableData}
                  columns={auditTableColumns}
                  perPage={
                    tableContentHeight > 0
                      ? Math.floor((tableContentHeight - TABLE_HEADER_HEIGHT) / HEIGHT_TABLE_ROW)
                      : DEFAULT_AUDITS_PER_PAGE
                  }
                  entityTitle={{
                    singular: "Audit Entry",
                    plural: "Audit Entries",
                  }}
                  isLoading={isLoadingAudit}
                  // fullWidthColumn={4}
                />
              </>
            ) : (
              !isLoadingAudit && (
                <StyledDocumentEmptyState>
                  No audit entries were found for this document. Please choose another document.
                </StyledDocumentEmptyState>
              )
            )}
          </>
        )}
      </div>

      {!selectedDocument && !isLoadingDocuments && (
        <StyledDocumentEmptyState>
          Select a document to view its audit history.
        </StyledDocumentEmptyState>
      )}

      <Loader show={isLoadingDocuments || isLoadingAudit} />
    </StyledDocumentsLayout>
  );
};
