import { UserEnums } from "@inkvisitor/shared/enums";
import { animated, config, useSpring } from "@react-spring/web";
import { Button } from "components/basic/Button/Button";
import React, { useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { CgFileDocument } from "react-icons/cg";
import {
  FaBars,
  FaBookOpen,
  FaDatabase,
  FaInfo,
  FaRegChartBar,
  FaSearchengin,
  FaUsers,
} from "react-icons/fa";
import { RiLayoutMasonryLine } from "react-icons/ri";
import { TbSettings } from "react-icons/tb";
import { useLocation, useNavigate } from "react-router-dom";
import { IPage } from "types";
import { MenuItem } from "./MenuItem";
import { StyledMenuDivider, StyledMenuGroup, StyledMenuGroupWrapper } from "./MenuStyles";

const LAYOUT_KEYS = [
  "mainPageTreeSeparatorXPosition",
  "mainPageCenterSeparatorXPosition",
  "mainPageSearchSeparatorXPosition",
  "detailSeparatorYPercent",
  "editorSeparatorYPercent",
  "firstPanelExpanded",
  "secondPanelExpanded",
  "thirdPanelExpanded",
  "fourthPanelExpanded",
  "fourthPanelBoxesOpened",
  "detailBoxState",
  "editorBoxState",
  "statementListOpened",
];

interface Menu {
  userRole: string;
  tempLocation: string | false;
  setTempLocation: React.Dispatch<React.SetStateAction<string | false>>;
  handleLogOut: () => void;
  setUserCustomizationOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export const Menu: React.FC<Menu> = ({
  userRole,
  tempLocation,
  setTempLocation,
  handleLogOut,
  setUserCustomizationOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const navPages: IPage[] = [
    { id: "main", label: "Main", color: "info", href: "/", icon: <FaBookOpen size={16} /> },
    {
      id: "explorer",
      label: "Explorer",
      color: "info",
      href: "/explorer",
      icon: <FaSearchengin size={18} />,
    },
    {
      id: "stats",
      label: "Statistics",
      color: "info",
      href: "/stats",
      icon: <FaRegChartBar size={18} />,
    },
    {
      id: "documents",
      label: "Documents",
      color: "info",
      href: "/documents",
      icon: <CgFileDocument size={18} />,
    },
  ];

  const settingsPages: IPage[] = [
    {
      id: "customize",
      label: "Customize",
      color: "info",
      href: false,
      icon: <TbSettings size={19} />,
      onClick: () => setUserCustomizationOpen(true),
    },
    {
      id: "users",
      label: "Users",
      color: "info",
      href: "/users",
      admin: true,
      icon: <FaUsers size={18} />,
    },
    {
      id: "reset-layout",
      label: "Reset Layout",
      color: "info",
      href: false,
      mainPageOnly: true,
      icon: <RiLayoutMasonryLine size={18} />,
      onClick: () => {
        LAYOUT_KEYS.forEach((key) => localStorage.removeItem(key));
        window.location.reload();
      },
    },
    // {
    //   id: "acl",
    //   label: "Acl",
    //   color: "info",
    //   href: "/acl",
    //   admin: true,
    //   icon: <FaKey />,
    // },
  ];

  const toolsPages: IPage[] = [
    {
      id: "backups",
      label: "Backups",
      color: "info",
      href: "/backups",
      admin: true,
      owner: true,
      icon: <FaDatabase size={16} />,
    },
    { id: "about", label: "About", color: "info", href: "/about", icon: <FaInfo size={16} /> },
  ];

  const filterByRole = (pages: IPage[]) =>
    pages.filter((p) => {
      if (p.mainPageOnly && location.pathname !== "/") return false;
      if (p.owner) return userRole === UserEnums.Role.Owner;
      if (p.admin) return userRole === UserEnums.Role.Admin || userRole === UserEnums.Role.Owner;
      return true;
    });

  const handlePageClick = (page: IPage) => {
    if (page.onClick) {
      page.onClick();
    } else if (page.id === "main") {
      navigate({ pathname: "/", hash: tempLocation ? tempLocation : "" });
      setTempLocation(false);
    } else if (page.href) {
      navigate({ pathname: page.href });
      if (location.pathname === "/") {
        setTempLocation(location.hash);
      }
    }
  };

  const renderPages = (pages: IPage[]) =>
    filterByRole(pages).map((page) => (
      <MenuItem
        key={page.id}
        label={page.label}
        icon={page.icon}
        onClick={() => handlePageClick(page)}
      />
    ));

  const rotateMenuIcon = useSpring({
    transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)",
    config: config.stiff,
  });

  const filteredSettingsPages = filterByRole(settingsPages);
  const filteredToolsPages = filterByRole(toolsPages);

  return (
    <div
      id="#hover-me"
      style={{ position: "relative" }}
      onClick={() => setMenuOpen(!menuOpen)}
      onMouseLeave={() => setMenuOpen(false)}
      onMouseEnter={() => setMenuOpen(true)}
    >
      <Button
        icon={
          <animated.div
            style={{
              ...rotateMenuIcon,
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaBars size={14} />
          </animated.div>
        }
        label="Menu"
      />
      {menuOpen && (
        <StyledMenuGroupWrapper>
          <StyledMenuGroup>
            {renderPages(navPages)}

            {filteredSettingsPages.length > 0 && (
              <>
                <StyledMenuDivider />
                {renderPages(settingsPages)}
              </>
            )}

            {filteredToolsPages.length > 0 && (
              <>
                <StyledMenuDivider />
                {renderPages(toolsPages)}
              </>
            )}

            <StyledMenuDivider />
            <MenuItem
              label="Log out"
              icon={<BiLogOut size={18} />}
              color="danger"
              onClick={() => handleLogOut()}
            />
          </StyledMenuGroup>
        </StyledMenuGroupWrapper>
      )}
    </div>
  );
};
