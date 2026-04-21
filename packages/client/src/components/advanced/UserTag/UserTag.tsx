import { UserEnums } from "@shared/enums";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Tag } from "components/basic/Tag/Tag";
import React from "react";
import { useTheme } from "styled-components";
import { ThemeFontSize } from "Theme/theme";
import { getUserIcon } from "utils/iconUtils";
import { StyledUserIcon, StyledUserTagWrap } from "./UserTagStyles";
import { getUserLabel, getVariantColors, UserTagVariant } from "./utils";

interface UserTagProps {
  userId: string;
  hasIcon?: boolean;
  variant?: UserTagVariant;
  size?: keyof ThemeFontSize;
}

export const UserTag: React.FC<UserTagProps> = ({
  userId,
  hasIcon = false,
  variant = "light",
  size = "xxs",
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

  return (
    <StyledUserTagWrap
      $variant={variant}
      $borderColor={variantColors.border}
      $backgroundColor={variantColors.background}
      $textColor={variantColors.text}
      $size={size}
    >
      <Tag
        tagType="user"
        propId={userId}
        label={label}
        disableCopyLabel
        disableDoubleClick
        disableDrag
        tagComponent={
          <StyledUserIcon $color={variantColors.icon} $size={size}>
            {getUserIcon(dataUser?.role ?? UserEnums.Role.Viewer)}
          </StyledUserIcon>
        }
      />
    </StyledUserTagWrap>
  );
};
