import { UserEnums } from "@shared/enums";
import { Button } from "components/basic/Button/Button";
import React, { useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { FaBars, FaBookOpen, FaInfo, FaUsers } from "react-icons/fa";
import { useHistory, useLocation } from "react-router";
import { animated, config, useSpring } from "react-spring";
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
  ];

  const history = useHistory();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const rotateMenuIcon = useSpring({
    transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)",
    config: config.stiff,
  });

  return (
    <div
      onClick={() => setMenuOpen(!menuOpen)}
      onMouseLeave={() => setMenuOpen(false)}
      onMouseEnter={() => setMenuOpen(true)}
    >
      <Button
        icon={
          <animated.div style={rotateMenuIcon}>
            <FaBars />
          </animated.div>
        }
        label="Menu"
      />
      {menuOpen && (
        <StyledMenuGroupWrapper>
          <StyledMenuGroup>
            {pages
              .filter((p) => !p.admin || userRole === UserEnums.Role.Admin)
              .filter((p) => location.pathname !== p.href)
              .map((page, key) => (
                <MenuItem
                  key={key}
                  label={page.label}
                  icon={page.icon}
                  onClick={() => {
                    if (page.id === "main") {
                      history.push({
                        pathname: "/",
                        hash: tempLocation ? tempLocation : "",
                      });
                      setTempLocation(false);
                    } else {
                      history.push({
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
