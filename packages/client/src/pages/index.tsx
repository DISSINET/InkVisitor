import { lazy } from "react";

// Dynamic imports for code splitting - makes the chunk size smaller
const AboutPage = lazy(() =>
  import("pages/About/AboutPage").then((module) => ({
    default: module.AboutPage,
  }))
);
const AclPage = lazy(() => import("pages/Acl/AclPage"));
const ActivatePage = lazy(() => import("pages/Activate/ActivatePage"));
const DocumentsPage = lazy(() =>
  import("pages/Documents/DocumentsPage").then((module) => ({
    default: module.DocumentsPage,
  }))
);
const LoginPage = lazy(() => import("pages/Login/LoginPage"));
const MainPage = lazy(() => import("pages/Main/MainPage"));
const NotFoundPage = lazy(() => import("pages/NotFound/NotFoundPage"));
const PasswordResetPage = lazy(() =>
  import("pages/PasswordReset/PasswordResetPage").then((module) => ({
    default: module.PasswordResetPage,
  }))
);
const UsersPage = lazy(() => import("pages/Users/UsersPage"));

export {
  AboutPage,
  AclPage,
  ActivatePage,
  DocumentsPage,
  LoginPage,
  MainPage,
  NotFoundPage,
  PasswordResetPage,
  UsersPage,
};
