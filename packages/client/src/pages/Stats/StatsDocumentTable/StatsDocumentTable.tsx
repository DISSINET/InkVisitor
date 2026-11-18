import { IDocument, DropdownItem } from "@inkvisitor/shared/types";
import { IAnchorUpdate, IAudit, IDocumentAuditAnchorChanges } from "@inkvisitor/shared/types/audit";
import { IResponseAudit } from "@inkvisitor/shared/types/response-audit";
import { IResponseEntity } from "@inkvisitor/shared/types/response-entity";
import { useQueries, useQuery } from "@tanstack/react-query";
import api from "api";
import { BaseDropdown, Input, Loader, Table, Timestamp, Tooltip } from "components";
import Dropdown, { EmptyEntityTag, EntityTag } from "components/advanced";
import { UserTag } from "components/advanced/UserTag/UserTag";
import { useResizeObserver } from "hooks";
import {
  useDocumentsQuery,
  useResourcesWithDocumentsQuery,
  useUsersSimplifiedQuery,
} from "hooks/react-query";
import { useMemo, useState } from "react";
import { Column } from "react-table";
import {
  StyledDocumentChangeFallback,
  StyledDocumentChangesLabel,
  StyledDocumentChangesList,
  StyledDocumentChangesRow,
  StyledDocumentChangesTags,
  StyledDocumentEmptyState,
  StyledDocumentFilters,
  StyledDocumentHeader,
  StyledDocumentInfoText,
  StyledDocumentChangesOverflow,
  StyledDocumentResourceWrap,
  StyledDocumentRow,
  StyledDocumentsLayout,
  StyledField,
  StyledFieldInput,
  StyledFieldLabel,
} from "../StatsPageStyles";
import { HIDDEN_DOCUMENT_CHANGE_SECTIONS, HIDDEN_EVENT_TYPES } from "../constants";

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
  (key) => !hiddenChangeSectionKeys.has(key),
);

// a date picker value ("YYYY-MM-DD") read as local midnight; Date parses the
// bare form as UTC
const pickerDateToLocalMs = (value: string): number | undefined => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }
  return new Date(year, month - 1, day).getTime();
};
const DAY_MS = 24 * 60 * 60 * 1000;

const getSectionLabel = (sectionKey: ChangeSectionKey): string => {
  return changeSectionConfig[sectionKey]?.label ?? sectionKey;
};

const getChangeSections = (
  changes: object,
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

/** A single edit can touch hundreds of anchors; the rest are counted, not listed. */
const MAX_VISIBLE_ANCHORS = 5;

const AnchorsOverflowCount: React.FC<{ total: number }> = ({ total }) => {
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <>
      <StyledDocumentChangesOverflow
        ref={setReferenceElement}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        {`… +${total - MAX_VISIBLE_ANCHORS}`}
      </StyledDocumentChangesOverflow>
      <Tooltip
        label={`${total} anchors changed`}
        visible={tooltipVisible}
        referenceElement={referenceElement}
      />
    </>
  );
};

const AuditChangesCell: React.FC<{ changes: object }> = ({ changes }) => {
  const sections = useMemo(() => getChangeSections(changes), [changes]);
  // only the listed anchors are fetched below, so the cap bounds the queries too
  const anchorIds = useMemo(
    () =>
      Array.from(
        new Set(sections.flatMap((section) => section.anchors.slice(0, MAX_VISIBLE_ANCHORS))),
      ),
    [sections],
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
    [anchorIds, entityQueries],
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
            {section.anchors.slice(0, MAX_VISIBLE_ANCHORS).map((anchor, index) => {
              const entity = entitiesById[anchor];
              if (entity) {
                return (
                  <EntityTag
                    key={`${section.key}-${anchor}-${index}`}
                    entity={entity}
                    disableDoubleClick
                    disableDrag
                    fullWidth
                  />
                );
              }

              return (
                <StyledDocumentChangeFallback key={`${section.key}-${anchor}-${index}`}>
                  {anchor}
                </StyledDocumentChangeFallback>
              );
            })}
          </StyledDocumentChangesTags>
          {section.anchors.length > MAX_VISIBLE_ANCHORS && (
            <AnchorsOverflowCount total={section.anchors.length} />
          )}
        </StyledDocumentChangesRow>
      ))}
    </StyledDocumentChangesList>
  );
};

type StatsDocumentTable = {
  selectedDocument: DropdownItem | null;
  setSelectedDocument: (document: DropdownItem | null) => void;
};

export const StatsDocumentTable: React.FC<StatsDocumentTable> = ({
  selectedDocument,
  setSelectedDocument,
}) => {
  const { ref: tableContentRef, height: tableContentHeight = 0 } =
    useResizeObserver<HTMLDivElement>({
      debounceDelay: 50,
    });

  const { data: dataDocuments, isLoading: isLoadingDocuments } = useDocumentsQuery();

  const { data: resources, isLoading: isLoadingResources } = useResourcesWithDocumentsQuery();
  const { data: users } = useUsersSimplifiedQuery();

  const [filterUserIds, setFilterUserIds] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  const resetFilters = () => {
    setFilterUserIds([]);
    setFilterTypes([]);
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const selectedResource = useMemo(() => {
    if (!selectedDocument?.value || !resources) {
      return undefined;
    }
    return resources.find((resource) => resource.data.documentId === selectedDocument.value);
  }, [resources, selectedDocument?.value]);

  const documentOptions: DropdownItem[] = useMemo(() => {
    if (!dataDocuments) return [];
    return dataDocuments.map((doc: IDocument) => ({
      value: doc.id,
      label: doc.title || doc.id,
    }));
  }, [dataDocuments]);

  const { data: dataAudits, isLoading: isLoadingAudit } = useQuery({
    queryKey: ["auditByDocument", selectedDocument?.value],
    queryFn: async () => {
      const res = await api.auditGetByDocument(selectedDocument!.value as string, 1000);
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
    [],
  );

  const documentAudits: IAudit[] = useMemo(() => {
    if (!dataAudits?.last) return [];
    return dataAudits.last.filter((audit) => !HIDDEN_EVENT_TYPES.includes(audit.type));
  }, [dataAudits]);
  const hasAudits = documentAudits.length > 0;

  // options list only the users and types present in this document's audits
  const userOptions: DropdownItem[] = useMemo(() => {
    const userIds = Array.from(new Set(documentAudits.map((audit) => audit.user)));
    return userIds
      .map((userId) => ({
        value: userId,
        label: users?.find((user) => user.id === userId)?.name ?? userId,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [documentAudits, users]);

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(documentAudits.map((audit) => audit.type)))
        .sort()
        .map((type) => ({ value: type, label: type })),
    [documentAudits],
  );

  const auditTableData: IAudit[] = useMemo(() => {
    const fromMs = pickerDateToLocalMs(filterDateFrom);
    const toDayMs = pickerDateToLocalMs(filterDateTo);
    // the "to" day is inclusive
    const toMs = toDayMs === undefined ? undefined : toDayMs + DAY_MS;
    return documentAudits.filter((audit) => {
      if (filterUserIds.length > 0 && !filterUserIds.includes(audit.user)) {
        return false;
      }
      if (filterTypes.length > 0 && !filterTypes.includes(audit.type)) {
        return false;
      }
      const dateMs = new Date(audit.date).getTime();
      if (fromMs !== undefined && dateMs < fromMs) {
        return false;
      }
      if (toMs !== undefined && dateMs >= toMs) {
        return false;
      }
      return true;
    });
  }, [documentAudits, filterUserIds, filterTypes, filterDateFrom, filterDateTo]);

  return (
    <StyledDocumentsLayout>
      <StyledDocumentHeader>
        <StyledDocumentRow>
          <StyledField>
            <StyledFieldLabel>Select Document</StyledFieldLabel>
            <StyledFieldInput>
              <BaseDropdown
                options={documentOptions}
                value={selectedDocument}
                onChange={(selected) => {
                  setSelectedDocument(selected[0] || null);
                  resetFilters();
                }}
                placeholder="Select a document..."
                width={300}
                disabled={isLoadingDocuments}
                loading={isLoadingDocuments}
              />
              {selectedDocument && (
                <StyledDocumentResourceWrap>
                  {selectedResource ? (
                    <EntityTag entity={selectedResource} disableDoubleClick disableDrag fullWidth />
                  ) : (
                    !isLoadingResources && <EmptyEntityTag label="resource" />
                  )}
                </StyledDocumentResourceWrap>
              )}
            </StyledFieldInput>
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

        {selectedDocument && hasAudits && (
          <StyledDocumentFilters>
            <StyledField>
              <StyledFieldLabel>User</StyledFieldLabel>
              <Dropdown.Multi.User
                width={200}
                value={filterUserIds}
                onChange={setFilterUserIds}
                options={userOptions}
                placeholder="All users"
              />
            </StyledField>
            <StyledField>
              <StyledFieldLabel>From</StyledFieldLabel>
              <Input
                type="date"
                width={150}
                value={filterDateFrom}
                onChangeFn={setFilterDateFrom}
                clearable
              />
            </StyledField>
            <StyledField>
              <StyledFieldLabel>To</StyledFieldLabel>
              <Input
                type="date"
                width={150}
                value={filterDateTo}
                onChangeFn={setFilterDateTo}
                clearable
              />
            </StyledField>
            <StyledField>
              <StyledFieldLabel>Type</StyledFieldLabel>
              <Dropdown.Multi.Basic
                width={200}
                value={filterTypes}
                onChange={setFilterTypes}
                options={typeOptions}
                placeholder="All types"
              />
            </StyledField>
          </StyledDocumentFilters>
        )}
      </StyledDocumentHeader>

      <div ref={tableContentRef} style={{ height: "100%", minHeight: 0 }}>
        {selectedDocument && (
          <>
            {hasAudits && auditTableData.length === 0 && (
              <StyledDocumentEmptyState>
                No audit entries match the filters.
              </StyledDocumentEmptyState>
            )}
            {auditTableData.length > 0 ? (
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
              !hasAudits &&
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

      <Loader show={isLoadingAudit} />
    </StyledDocumentsLayout>
  );
};
