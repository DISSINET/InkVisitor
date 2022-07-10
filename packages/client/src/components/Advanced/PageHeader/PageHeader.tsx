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
} from "./PageHeaderStyles";
import packageJson from "../../../../package.json";
import { heightHeader } from "Theme/constants";
import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { toast } from "react-toastify";
import { useHistory } from "react-router";

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
  handleLogOut: () => void;
  userName: string;
  userRole: string;
}

interface IPage {
  label: string;
  color: "info" | "success" | "danger" | "warning";
  href: string;
  admin?: boolean;
}

const pages: IPage[] = [
  {
    label: "Main",
    color: "info",
    href: "/",
    admin: false,
  },
  {
    label: "Manage Users",
    color: "info",
    href: "/users",
    admin: true,
  },
];

export const RightHeader: React.FC<RightHeaderProps> = React.memo(
  ({ setUserCustomizationOpen, handleLogOut, userName, userRole }) => {
    const history = useHistory();

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
          {pages
            .filter((p) => !p.admin || userRole === "admin")
            .filter((p) => history.location.pathname !== p.href)
            .map((p, key) => (
              <Button
                key={key}
                label={p.label}
                color={p.color}
                onClick={() => history.push(p.href)}
              />
            ))}
          <Button
            label="Log Out"
            color="danger"
            onClick={() => handleLogOut()}
          />
        </ButtonGroup>
      </StyledUserBox>
    );
  }
);
