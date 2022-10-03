import { Button, ButtonGroup, Loader } from "components";
import React, { useState } from "react";
import {
  StyledFaUserAlt,
  StyledHeader,
  StyledHeaderLogo,
  StyledHeaderTag,
  StyledText,
  StyledUser,
  StyledRightHeader,
  StyledUsername,
} from "./PageHeaderStyles";
import packageJson from "../../../../package.json";
import { heightHeader } from "Theme/constants";
import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { toast } from "react-toastify";
import { useHistory, useLocation } from "react-router";
import { UserEnums } from "@shared/enums";

export const LeftHeader = React.memo(({ }) => {
  const env = (process.env.ROOT_URL || "").replace(/apps\/inkvisitor[-]?/, "");
  const versionText = `v. ${packageJson.version} 
  ${["production", ""].indexOf(env) === -1
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
  id: "main" | "users";
  label: string;
  color: "info" | "success" | "danger" | "warning";
  href: string;
  admin?: boolean;
}

const pages: IPage[] = [
  {
    id: "main",
    label: "Main",
    color: "info",
    href: "/",
    admin: false,
  },
  {
    id: "users",
    label: "Manage Users",
    color: "info",
    href: "/users",
    admin: true,
  },
];

export const RightHeader: React.FC<RightHeaderProps> = React.memo(
  ({ setUserCustomizationOpen, handleLogOut, userName, userRole }) => {
    const history = useHistory();
    const location = useLocation();
    const [tempLocation, setTempLocation] = useState<string | false>(false);

    return (
      <StyledRightHeader>
        {userName.length > 0 ? (
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
        ) : (
          <div
            style={{
              height: "1rem",
              width: "1rem",
              position: "relative",
              marginRight: "2rem",
            }}
          >
            <Loader size={10} show />
          </div>
        )}
        <ButtonGroup>
          {pages
            .filter((p) => !p.admin || userRole === UserEnums.Role.Admin)
            .filter((p) => location.pathname !== p.href)
            .map((p, key) => (
              <Button
                key={key}
                label={p.label}
                color={p.color}
                onClick={() => {
                  if (p.id === "users") {
                    setTempLocation(location.hash);
                    history.push(p.href);
                  } else if (p.id === "main") {
                    setTempLocation(false);
                    history.push({
                      pathname: "/",
                      hash: tempLocation ? tempLocation : "",
                    });
                  }
                }}
              />
            ))}
          <Button
            label="Log Out"
            color="danger"
            onClick={() => handleLogOut()}
          />
        </ButtonGroup>
      </StyledRightHeader>
    );
  }
);
