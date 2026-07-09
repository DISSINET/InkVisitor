import { getAppEnv } from "utils/appEnv";

const instanceId = () => getAppEnv();

const storageKey = (name: string) => `${instanceId()}-${name}`;

export const getStoredUserId = () => localStorage.getItem(storageKey("userid"));

export const getStoredUsername = () => localStorage.getItem(storageKey("username"));

export const getStoredUserRole = () => localStorage.getItem(storageKey("userrole"));

export const saveStoredUser = (name: string, id: string, role: string) => {
  localStorage.setItem(storageKey("username"), name);
  localStorage.setItem(storageKey("userid"), id);
  localStorage.setItem(storageKey("userrole"), role);
};

export const clearStoredUser = () => {
  localStorage.removeItem(storageKey("username"));
  localStorage.removeItem(storageKey("userid"));
  localStorage.removeItem(storageKey("userrole"));
};
