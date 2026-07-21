import { Annotator } from "@inkvisitor/annotator/src/lib";
import { IDocument } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { toast } from "react-toastify";

export interface UseDocumentContentSave {
  annotator: Annotator | null;
  documentId?: string;
  dataDocument?: IDocument;
  /** Runs once the save settles, whether it succeeded or failed. */
  onSettled?: () => void;
}

/**
 * Persists the annotator's current text as the document's content.
 *
 * The returned function reports whether the save was dispatched — it is skipped
 * while the document is not loaded. Only a dispatched save reaches onSettled,
 * so a caller tracking an in-flight flag must clear it itself on false.
 */
export const useDocumentContentSave = ({
  annotator,
  documentId,
  dataDocument,
  onSettled,
}: UseDocumentContentSave) => {
  const queryClient = useQueryClient();

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument>; successMessage?: string }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (variables.successMessage) {
        toast.info(variables.successMessage);
      }
    },
    onError: () => {
      toast.error("Failed to save document changes");
    },
    onSettled,
  });

  return (successMessage?: string): boolean => {
    if (!annotator || !documentId || !dataDocument) {
      return false;
    }
    updateDocumentMutation.mutate({
      id: documentId,
      doc: {
        ...dataDocument,
        content: annotator.text.value,
      },
      successMessage,
    });
    return true;
  };
};
