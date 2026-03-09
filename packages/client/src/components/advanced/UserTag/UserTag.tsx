import { useQuery } from "@tanstack/react-query";
import api from "api";
import { ThemeFontSize } from "Theme/theme";
import { Tag } from "components/basic/Tag/Tag";
import React from "react";
import { FaUser } from "react-icons/fa";
import { useTheme } from "styled-components";
import { StyledUserIcon, StyledUserTagWrap } from "./UserTagStyles";
import { getUserLabel, getVariantColors, UserTagColor, UserTagVariant } from "./utils";

interface UserTagProps {
  userId: string;
  hasIcon?: boolean;
  color?: UserTagColor;
  variant?: UserTagVariant;
  size?: keyof ThemeFontSize;
}

export const UserTag: React.FC<UserTagProps> = ({
  userId,
  hasIcon = false,
  color = "primary",
  variant = "light",
  size = "xxs",
}) => {
  const theme = useTheme();
  const { data: user } = useQuery({
    queryKey: ["user-tag", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId);
      return res.data;
    },
    enabled: Boolean(userId),
  });

  const variantColors = getVariantColors(theme, color, variant);
  const label = getUserLabel(user, userId);

  return (
    <StyledUserTagWrap
      $variant={variant}
      $borderColor={variantColors.border}
      $backgroundColor={variantColors.background}
      $textColor={variantColors.text}
      $size={size}
    >
      <Tag
        propId={userId}
        label={label}
        showOnly="label"
        disableCopyLabel
        disableDoubleClick
        disableDrag
        button={
          hasIcon ? (
            <StyledUserIcon $color={variantColors.icon} $size={size}>
              <FaUser size="1em" />
            </StyledUserIcon>
          ) : undefined
        }
      />
    </StyledUserTagWrap>
  );
};
