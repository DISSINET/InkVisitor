import { UserEnums } from "@shared/enums";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Tag } from "components/basic/Tag/Tag";
import React, { useMemo } from "react";
import { useTheme } from "styled-components";
import { getUserIcon } from "utils/iconUtils";
import { StyledUserIcon, StyledUserLabel, StyledUserTag, StyledUserTagWrap } from "./UserTagStyles";
import { getUserLabel, getVariantColors, UserTagVariant } from "./utils";

interface UserTagProps {
  userId: string;
  variant?: UserTagVariant;
  // TODO: rather implement 3 or 4 sizes
  // size?: keyof ThemeFontSize;
  showOnly?: "tag" | "label";
}

export const UserTag: React.FC<UserTagProps> = ({
  userId,
  variant = "filled",
  // size = "xxs",
  showOnly,
}) => {
  const theme = useTheme();
  const currentUserId = localStorage.getItem("userid");
  const color = currentUserId === userId ? "primary" : "info";
  const { data: dataUser } = useQuery({
    queryKey: ["user-tag", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId);
      return res.data;
    },
    enabled: Boolean(userId),
  });

  const variantColors = getVariantColors(theme, color, variant);
  const label = getUserLabel(dataUser, userId);

  const tagComponent = useMemo(() => {
    return (
      <StyledUserTag $backgroundColor={variantColors.background}>
        <StyledUserIcon $color={variantColors.icon}>
          {getUserIcon(dataUser?.role ?? UserEnums.Role.Viewer, 17)}
        </StyledUserIcon>
      </StyledUserTag>
    );
  }, [variantColors, dataUser]);

  const labelComponent = useMemo(() => {
    return (
      <StyledUserLabel
        $backgroundColor={variantColors.background}
        $textColor={variantColors.text}
        $variant={variant}
      >
        {label}
      </StyledUserLabel>
    );
  }, [label, variantColors]);

  return (
    <StyledUserTagWrap $borderColor={variantColors.border}>
      <Tag
        propId={userId}
        label={label}
        disableCopyLabel
        disableDoubleClick
        disableDrag
        showOnly={showOnly}
        tagComponent={tagComponent}
        labelComponent={labelComponent}
      />
    </StyledUserTagWrap>
  );
};
