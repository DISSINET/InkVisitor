import { animated, config, useSpring } from "@react-spring/web";
import { UserEnums } from "@shared/enums";
import { Button } from "components/basic/Button/Button";
import React, { useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { CgFileDocument } from "react-icons/cg";
import {
  FaBars,
  FaBookOpen,
  FaInfo,
  FaSearchengin,
  FaUsers,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router";
import { IPage } from "types";
import { MenuItem } from "./MenuItem";
import { StyledMenuGroup, StyledMenuGroupWrapper } from "./MenuStyles";

interface Menu {
  userRole: string;
  tempLocation: string | false;
  setTempLocation: React.Dispatch<React.SetStateAction<string | false>>;
  handleLogOut: () => void;
}
export const Menu: React.FC<Menu> = ({
  userRole,
  tempLocation,
  setTempLocation,
  handleLogOut,
}) => {
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
    {
      id: "documents",
      label: "Documents",
      color: "info",
      href: "/documents",
      admin: true,
      icon: <CgFileDocument size={18} />,
    },
    {
      id: "query",
      label: "Query",
      color: "info",
      href: "/query",
      admin: true,
      icon: <FaSearchengin />,
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const rotateMenuIcon = useSpring({
    transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)",
    config: config.stiff,
  });

  return (
    <div
      id="#hover-me"
      onClick={() => setMenuOpen(!menuOpen)}
      onMouseLeave={() => setMenuOpen(false)}
      onMouseEnter={() => setMenuOpen(true)}
    >
      <Button
        icon={
          <animated.div style={rotateMenuIcon}>
            <FaBars size={14} />
          </animated.div>
        }
        label="Menu"
      />
      {menuOpen && (
        <StyledMenuGroupWrapper>
          <StyledMenuGroup>
            {pages
              .filter(
                (p) =>
                  !p.admin ||
                  userRole === UserEnums.Role.Admin ||
                  userRole === UserEnums.Role.Owner
              )
              .map((page, key) => (
                <MenuItem
                  key={key}
                  label={page.label}
                  icon={page.icon}
                  onClick={() => {
                    if (page.id === "main") {
                      navigate({
                        pathname: "/",
                        hash: tempLocation ? tempLocation : "",
                      });
                      setTempLocation(false);
                    } else {
                      navigate({
                        pathname: page.href,
                      });
                      if (location.pathname === "/") {
                        setTempLocation(location.hash);
                      }
                    }
                  }}
                />
              ))}
            <hr />
            <MenuItem
              label="Log out"
              icon={<BiLogOut />}
              color="danger"
              onClick={() => handleLogOut()}
            />
          </StyledMenuGroup>
        </StyledMenuGroupWrapper>
      )}
    </div>
  );
};
