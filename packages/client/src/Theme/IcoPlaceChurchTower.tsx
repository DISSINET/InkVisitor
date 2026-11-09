import React from "react";

/**
 * A church with a bell tower, drawn on the same 24px grid and 2px round stroke as
 * the Tabler marks beside it (`TbBuildingChurch` is the church with no tower), so
 * it reads at the same size and weight in a list of location types.
 */
export const IcoPlaceChurchTower: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 21h18" />
    <path d="M5 21v-9l3 -4l3 4v9" />
    <path d="M8 8v-5m-1.5 1.5h3" />
    <path d="M11 21v-8l4 -3l4 3v8" />
    <path d="M14 21v-3a1 1 0 0 1 2 0v3" />
  </svg>
);
