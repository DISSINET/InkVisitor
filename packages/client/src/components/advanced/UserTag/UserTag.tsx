import { UserEnums } from "@inkvisitor/shared/enums";
import { getStoredUserId, getStoredUserRole, getStoredUsername } from "utils/userStorage";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Tag } from "components/basic/Tag/Tag";
import React, { useMemo } from "react";
import { useTheme } from "styled-components";
import { getUserIcon } from "utils/iconUtils";
import { StyledUserIcon, StyledUserLabel, StyledUserTag, StyledUserTagWrap } from "./UserTagStyles";
import { getUserLabel, getVariantColors, UserTagSize, UserTagVariant } from "./utils";

interface UserTagProps {
  userId: string;
  variant?: UserTagVariant;
  // TODO: for size to work properly, we need to control height of Tag component
  // size currently controls only the font size and icon size
  size?: UserTagSize;
  showOnly?: "tag" | "label";
  fontWeight?: "normal" | "bold";
  // only for first login to show the user tag during the activation process
  disableFetch?: boolean;
}

export const UserTag: React.FC<UserTagProps> = ({
  userId,
  variant = "filled",
  size = UserTagSize.Small,
  showOnly,
  fontWeight = "bold",
  disableFetch = false,
}) => {
  const theme = useTheme();
  const currentUserId = getStoredUserId();
  const color = currentUserId === userId ? "primary" : "info";

  const { data: dataUser } = useQuery({
    queryKey: ["user-tag", userId],
    queryFn: async () => {
      const res = await api.usersGet(userId, { ignoreErrorToast: true });
      return res.data;
    },
    enabled: Boolean(userId) && !disableFetch,
  });

  const variantColors = getVariantColors(theme, color, variant);
  const label = getUserLabel(dataUser, userId);

  const tagComponent = useMemo(() => {
    return (
      <StyledUserTag
        $backgroundColor={variantColors.avatarBackground}
        $borderColor={variantColors.border}
      >
        <StyledUserIcon $color={variantColors.iconColor}>
          {getUserIcon(dataUser?.role ?? UserEnums.Role.Viewer, size)}
        </StyledUserIcon>
      </StyledUserTag>
    );
  }, [variantColors, dataUser, size]);

  const labelComponent = useMemo(() => {
    return (
      <StyledUserLabel
        $backgroundColor={variantColors.labelBackground}
        $textColor={variantColors.labelText}
        $borderColor={variantColors.border}
        $variant={variant}
        $size={size}
        $fontWeight={fontWeight}
      >
        {label}
      </StyledUserLabel>
    );
  }, [label, variantColors, size]);

  return (
    <StyledUserTagWrap
      $borderColor={variantColors.border}
      $backgroundColor={variantColors.labelBackground}
    >
      <Tag
        dragDisabled
        showOnly={showOnly}
        tagComponent={tagComponent}
        labelComponent={labelComponent}
      />
    </StyledUserTagWrap>
  );
};
