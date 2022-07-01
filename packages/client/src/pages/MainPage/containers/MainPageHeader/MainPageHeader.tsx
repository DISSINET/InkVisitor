import { Button, ButtonGroup } from "components";
import React from "react";
import {
  StyledFaUserAlt,
  StyledHeader,
  StyledHeaderLogo,
  StyledHeaderTag,
  StyledText,
  StyledUser,
  StyledUserBox,
  StyledUsername,
} from "./MainPageHeaderStyles";
import packageJson from "../../../../../package.json";
import { heightHeader } from "Theme/constants";
import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { toast } from "react-toastify";

export const LeftHeader = React.memo(({}) => {
  const env = (process.env.ROOT_URL || "").replace(/apps\/inkvisitor[-]?/, "");
  const versionText = `v. ${packageJson.version} 
  ${
    ["production", ""].indexOf(env) === -1
      ? `| ${env} | built: ${process.env.BUILD_TIMESTAMP}`
      : ""
  }`;

  return (
    <StyledHeader>
      <StyledHeaderLogo
        height={heightHeader - 10}
        src={LogoInkvisitor}
        alt="Inkvisitor Logo"
      />
      <StyledHeaderTag
        onClick={async () => {
          await navigator.clipboard.writeText(versionText);
          toast.info("Inkvisitor version copied to clipboard");
        }}
      >
        {versionText}
      </StyledHeaderTag>
    </StyledHeader>
  );
});

interface RightHeaderProps {
  setUserCustomizationOpen: (arg0: boolean) => void;
  handleUsersModalClick: () => void;
  handleLogOut: () => void;
  userName: string;
  userRole: string;
}

export const RightHeader: React.FC<RightHeaderProps> = ({
  setUserCustomizationOpen,
  handleUsersModalClick,
  handleLogOut,
  userName,
  userRole,
}) => {
  return (
    <StyledUserBox>
      <StyledUser>
        <StyledText>logged as</StyledText>
        <StyledFaUserAlt
          size={14}
          onClick={() => setUserCustomizationOpen(true)}
        />
        <StyledUsername onClick={() => setUserCustomizationOpen(true)}>
          {userName}
        </StyledUsername>
      </StyledUser>
      <ButtonGroup>
        {userRole == "admin" && (
          <Button
            label="Manage Users"
            color="info"
            onClick={() => handleUsersModalClick()}
          />
        )}
        <Button label="Log Out" color="danger" onClick={() => handleLogOut()} />
      </ButtonGroup>
    </StyledUserBox>
  );
};
