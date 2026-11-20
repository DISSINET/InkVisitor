import { Relation } from "@inkvisitor/shared/types";
import { useMutation } from "@tanstack/react-query";
import { EntityWrites } from "hooks";

export const useRelationMutations = (writes: EntityWrites) => {
  const relationCreateMutation = useMutation({
    mutationFn: (newRelation: Relation.IRelation) => writes.createRelation(newRelation),
  });
  const relationUpdateMutation = useMutation({
    mutationFn: (relationObject: { relationId: string; changes: Partial<Relation.IRelation> }) =>
      writes.updateRelation(relationObject.relationId, relationObject.changes),
  });
  const relationDeleteMutation = useMutation({
    mutationFn: (relationId: string) => writes.deleteRelation(relationId),
  });

  return { relationCreateMutation, relationUpdateMutation, relationDeleteMutation };
};
