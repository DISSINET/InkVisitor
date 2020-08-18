import { Node } from "types";

export const territories: Node = {
  id: "000rootId",
  label: "root",
  children: [
    {
      id: "1",
      label: "book A",
      children: [
        { id: "3", label: "chapter 1", children: [] },
        {
          id: "5",
          label: "chapter 2",
          children: [{ id: "10", label: "page 1", children: [] }],
        },
        {
          id: "7",
          label: "chapter 3",
          children: [
            { id: "110", label: "deposition 1", children: [] },
            { id: "111", label: "deposition 2", children: [] },
            { id: "112", label: "deposition 3", children: [] },
            { id: "113", label: "deposition 4", children: [] },
            { id: "114", label: "deposition 5", children: [] },
          ],
        },
      ],
    },
    {
      id: "2",
      label: "book B",
      children: [
        { id: "B1", label: "chapter 1", children: [] },
        { id: "B2", label: "chapter 2", children: [] },
      ],
    },
    {
      id: "6",
      label: "book C",
      children: [],
    },
  ],
};
