import { Button, ButtonGroup, Loader } from "components";
import React, { useState, useRef, useEffect } from "react";
import {
  StyledFaUserAlt,
  StyledHeader,
  StyledHeaderLogo,
  StyledHeaderTag,
  StyledText,
  StyledUser,
  StyledRightHeader,
  StyledUsername,
  StyledMenuGroup
} from "./PageHeaderStyles";
import packageJson from "../../../../package.json";
import { heightHeader } from "Theme/constants";
import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { toast } from "react-toastify";
import { useHistory, useLocation } from "react-router";
import { UserEnums } from "@shared/enums";
import { FaBars } from "react-icons/fa";

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
  id: "main" | "users" | "acl";
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
    id: "acl",
    label: "Acl",
    color: "info",
    href: "/acl",
    admin: true,
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
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const menuRef = useRef(null);

    const menuToggleRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

    const handleClick = (e: any) => {
      console.log(menuToggleRef)
      if (menuRef.current && !(menuRef.current as any).contains(e.target) && menuToggleRef.current && !(menuToggleRef.current as any).contains(e.target)) {
        setMenuOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener('click', handleClick, true);

      return () => document.removeEventListener('click', handleClick, true);
    }, []);

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
        <Button innerRef={menuToggleRef} icon={<FaBars style={{ transition: "transform 0.1s", transform: menuOpen ? "rotate(90deg)" : "" }} />} onClick={() => setMenuOpen(!menuOpen)} label="Menu" />
        {
          menuOpen && <StyledMenuGroup><ButtonGroup ref={menuRef} column={true} noMarginRight={true}>
            {pages
              .filter((p) => !p.admin || userRole === UserEnums.Role.Admin)
              .filter((p) => location.pathname !== p.href)
              .map((p, key) => (
                <Button
                  key={key}
                  label={p.label}
                  onClick={() => {
                    history.push({
                      pathname: p.href,
                    });
                  }}
                />
              ))}
            <Button
              label="Log Out"
              color="danger"
              onClick={() => handleLogOut()}
            />
          </ButtonGroup>
          </StyledMenuGroup>
        }
      </StyledRightHeader >
    );
  }
);
