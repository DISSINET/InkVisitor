import { UserEnums } from "@shared/enums";
import LogoInkvisitor from "assets/logos/inkvisitor.svg";
import { Button, Loader } from "components";
import React, { useEffect, useRef, useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { FaBars, FaBookOpen, FaInfo, FaKey, FaUsers } from "react-icons/fa";
import { useHistory, useLocation } from "react-router";
import { toast } from "react-toastify";
import { heightHeader } from "Theme/constants";
import packageJson from "../../../../package.json";
import {
  StyledFaUserAlt,
  StyledHeader,
  StyledHeaderLogo,
  StyledHeaderTag,
  StyledMenuGroup,
  StyledMenuItem,
  StyledRightHeader,
  StyledText,
  StyledUser,
  StyledUsername,
} from "./PageHeaderStyles";

import { RouteComponentProps } from "react-router-dom";

export const LeftHeader = React.memo(({}) => {
  const env = (process.env.ROOT_URL || "").replace(/apps\/inkvisitor[-]?/, "");
  const versionText = `v. ${packageJson.version} ${
    ["production", ""].indexOf(env) === -1
      ? `| ${env} | built: ${process.env.BUILD_TIMESTAMP}`
      : ""
  }`;
  const history = useHistory();

  return (
    <StyledHeader>
      <StyledHeaderLogo
        height={heightHeader - 10}
        src={LogoInkvisitor}
        alt="Inkvisitor Logo"
        onClick={async () => {
          history.push("");
        }}
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
  id: "main" | "users" | "acl" | "about";
  label: string;
  color: "info" | "success" | "danger" | "warning";
  href: string;
  admin?: boolean;
  icon?: React.ReactElement;
}

const pages: IPage[] = [
  {
    id: "main",
    label: "Main",
    color: "info",
    href: "/",
    admin: false,
    icon: <FaBookOpen />,
  },
  {
    id: "about",
    label: "About",
    color: "info",
    href: "/about",
    icon: <FaInfo />,
  },
  // {
  //   id: "acl",
  //   label: "Acl",
  //   color: "info",
  //   href: "/acl",
  //   admin: true,
  //   icon: <FaKey />,
  // },
  {
    id: "users",
    label: "Manage Users",
    color: "info",
    href: "/users",
    admin: true,
    icon: <FaUsers />,
  },
];

export const RightHeader: React.FC<RightHeaderProps> = React.memo(
  ({ setUserCustomizationOpen, handleLogOut, userName, userRole }) => {
    const history = useHistory();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState<boolean>(false);

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
        <Button
          icon={
            <FaBars
              style={{
                transition: "transform 0.1s",
                transform: menuOpen ? "rotate(90deg)" : "",
              }}
            />
          }
          onClick={() => setMenuOpen(!menuOpen)}
          label="Menu"
        />
        {menuOpen && (
          <StyledMenuGroup>
            {pages
              .filter((p) => !p.admin || userRole === UserEnums.Role.Admin)
              .filter((p) => location.pathname !== p.href)
              .map((p, key) => (
                <StyledMenuItem
                  key={key}
                  color="primary"
                  onClick={() => {
                    if (p.id === "main") {
                      history.push({
                        pathname: "/",
                        hash: tempLocation ? tempLocation : "",
                      });
                      setTempLocation(false);
                    } else {
                      history.push({
                        pathname: p.href,
                      });
                      if (location.pathname === "/") {
                        setTempLocation(location.hash);
                      }
                    }
                  }}
                >
                  {p.icon || null}
                  {p.label}
                </StyledMenuItem>
              ))}
            <hr />
            <StyledMenuItem color="danger" onClick={() => handleLogOut()}>
              <BiLogOut />
              Log out
            </StyledMenuItem>
          </StyledMenuGroup>
        )}
      </StyledRightHeader>
    );
  }
);
