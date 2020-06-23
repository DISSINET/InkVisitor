import { Node } from "types";

export const territories: Node = {
  id: "000rootId",
  label: "root",
  children: [
    {
      id: "1",
      label: "raz",
      children: [
        { id: "3", label: "tri", children: [] },
        {
          id: "5",
          label: "pet",
          children: [{ id: "10", label: "deset", children: [] }],
        },
        {
          id: "7",
          label: "sedm",
          children: [
            { id: "8", label: "osm", children: [] },
            { id: "9", label: "devet", children: [] },
          ],
        },
      ],
    },
    {
      id: "2",
      label: "dva",
      children: [{ id: "4", label: "štyri", children: [] }],
    },
    {
      id: "6",
      label: "sest",
      children: [],
    },
  ],
};
