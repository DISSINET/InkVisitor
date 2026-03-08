import { useQuery } from "@tanstack/react-query";
import api from "api";

import { IDocument } from "@shared/types";
import { IAudit } from "@shared/types/audit";
import { IResponseAudit } from "@shared/types/response-audit";
import { BaseDropdown, Loader, Table } from "components";
import { useMemo, useState } from "react";
import { Column } from "react-table";
import { DropdownItem } from "types";
import {
  StyledDocumentAuditContainer,
  StyledDocumentSelector,
  StyledField,
  StyledFieldLabel,
  StyledTabContent,
} from "../StatsPageStyles";

export const DocumentTable: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<DropdownItem | null>(
    null
  );

  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.documentsGet({});
      return res.data;
    },
  });

  const documentOptions: DropdownItem[] = useMemo(() => {
    if (!documents) return [];
    return documents.map((doc: IDocument) => ({
      value: doc.id,
      label: doc.title || doc.id,
    }));
  }, [documents]);

  const { data: auditData, isLoading: isLoadingAudit } =
    useQuery<IResponseAudit>({
      queryKey: ["auditByDocument", selectedDocument?.value],
      queryFn: async () => {
        const res = await api.auditGetByDocument(
          selectedDocument!.value as string
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
        Cell: ({ value }: { value: Date }) => new Date(value).toLocaleString(),
      },
      {
        Header: "User",
        accessor: "user",
      },
      {
        Header: "Type",
        accessor: "type",
      },
      {
        Header: "Changes",
        accessor: "changes",
        Cell: ({ value }: { value: object }) => {
          const keys = Object.keys(value || {});
          if (keys.length === 0) return "-";
          return keys.join(", ");
        },
      },
    ],
    []
  );

  const auditTableData: IAudit[] = useMemo(() => {
    if (!auditData?.last) return [];
    return auditData.last;
  }, [auditData]);

  return (
    <StyledTabContent>
      <StyledDocumentSelector>
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
      </StyledDocumentSelector>

      {selectedDocument && (
        <StyledDocumentAuditContainer>
          {auditData?.first && (
            <div style={{ marginBottom: "1rem" }}>
              <StyledFieldLabel>First Audit Entry</StyledFieldLabel>
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Created by <strong>{auditData.first.user}</strong> on{" "}
                <strong>
                  {new Date(auditData.first.date).toLocaleString()}
                </strong>
              </p>
            </div>
          )}

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
        </StyledDocumentAuditContainer>
      )}

      {!selectedDocument && !isLoadingDocuments && (
        <p style={{ color: "#666", fontStyle: "italic" }}>
          Select a document to view its audit history.
        </p>
      )}

      <Loader show={isLoadingDocuments || isLoadingAudit} />
    </StyledTabContent>
  );
};
