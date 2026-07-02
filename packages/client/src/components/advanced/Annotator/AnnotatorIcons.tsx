import React from "react";

/**
 * Custom SVG glyphs for the Territory-anchor create buttons.
 */
interface TerritoryAnchorIcon {
  size?: number;
}

/** Overlapping tags — a sibling Territory anchor sharing the same parent. */
export const TerritorySiblingIcon: React.FC<TerritoryAnchorIcon> = ({ size = 14 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16">
    <path
      fill="currentColor"
      d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v1.5A1.75 1.75 0 0 1 12.25 7H5v2.5A1.5 1.5 0 0 0 6.5 11H8v-.25C8 9.784 8.784 9 9.75 9h2.5c.966 0 1.75.784 1.75 1.75v1.5A1.75 1.75 0 0 1 12.25 14h-2.5A1.75 1.75 0 0 1 8 12.25V12H6.5A2.5 2.5 0 0 1 4 9.5V7h-.25A1.75 1.75 0 0 1 2 5.25zm7 8.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75zM12.25 6a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75z"
    />
  </svg>
);

/** Branching tree — a child Territory anchor nested under the current one. */
export const TerritoryChildIcon: React.FC<TerritoryAnchorIcon> = ({ size = 14 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
    <path
      fill="currentColor"
      d="M28 12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11v4H9a2 2 0 0 0-2 2v4H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H9v-4h14v4h-3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-3v-4a2 2 0 0 0-2-2h-6v-4ZM12 28H4v-4h8Zm16 0h-8v-4h8ZM4 4h24v6H4Z"
    />
  </svg>
);
