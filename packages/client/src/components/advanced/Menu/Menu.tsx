import { UserEnums } from "@shared/enums";
import { Button } from "components/basic/Button/Button";
import React, { useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { FaBars, FaBookOpen, FaInfo, FaUsers } from "react-icons/fa";
import { useHistory, useLocation } from "react-router";
import {
  StyledMenuGroup,
  StyledMenuItem,
} from "../PageHeader/PageHeaderStyles";

interface IPage {
  id: "main" | "users" | "acl" | "about";
  label: string;
  color: "info" | "success" | "danger" | "warning";
  href: string;
  admin?: boolean;
  icon?: React.ReactElement;
}

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

  return (
    <>
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
    </>
  );
};
