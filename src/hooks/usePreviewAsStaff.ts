import { useEffect, useState, useCallback } from "react";

const KEY = "wiki_preview_as_staff";
const EVENT = "wiki-preview-as-staff-change";
const URL_PARAM = "staffPreview";

const readUrlFlag = () => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(URL_PARAM) === "1";
};

const read = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(KEY) === "1" || readUrlFlag();
};

const write = (on: boolean) => {
  if (typeof window === "undefined") return;
  if (on) window.sessionStorage.setItem(KEY, "1");
  else window.sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
};

/**
 * Global session flag that lets an admin preview any wiki view exactly as a
 * non-admin staff member would see it. Persists across navigation via
 * sessionStorage so drilling into pages keeps the preview active.
 */
export const usePreviewAsStaff = () => {
  const [enabled, setEnabled] = useState<boolean>(read);

  useEffect(() => {
    const sync = () => setEnabled(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const enable = useCallback(() => write(true), []);
  const disable = useCallback(() => write(false), []);

  return { enabled, enable, disable };
};

export const isPreviewAsStaffActive = read;

export const withPreviewAsStaffParam = (to: string) => {
  if (!read()) return to;
  const [path, hash = ""] = to.split("#");
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set(URL_PARAM, "1");
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};
