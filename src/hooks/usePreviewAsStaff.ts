import { useEffect, useState, useCallback } from "react";

const KEY = "wiki_preview_as_staff";
const EVENT = "wiki-preview-as-staff-change";
const URL_PARAM = "staffPreview";

/**
 * One-time bootstrap: if the URL carries `?staffPreview=1`, promote it to
 * sessionStorage and strip it from the URL. After this, sessionStorage is the
 * single source of truth for whether preview mode is active.
 */
const bootstrapFromUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get(URL_PARAM) === "1") {
    window.sessionStorage.setItem(KEY, "1");
    url.searchParams.delete(URL_PARAM);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}${url.hash}`
    );
  }
};

bootstrapFromUrl();

const read = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(KEY) === "1";
};

const write = (on: boolean) => {
  if (typeof window === "undefined") return;
  if (on) window.sessionStorage.setItem(KEY, "1");
  else window.sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
};

/**
 * Guard invoked before flipping preview ON. Return false to abort the flip.
 * Registered by editors that hold unsaved changes.
 */
type EnableGuard = () => boolean;
const enableGuards = new Set<EnableGuard>();

export const registerPreviewEnableGuard = (guard: EnableGuard) => {
  enableGuards.add(guard);
  return () => {
    enableGuards.delete(guard);
  };
};

const runEnableGuards = () => {
  for (const g of enableGuards) {
    try {
      if (!g()) return false;
    } catch {
      // ignore guard errors
    }
  }
  return true;
};

/**
 * Global session flag that lets an admin preview any wiki view exactly as a
 * non-admin staff member would see it. sessionStorage is the source of truth;
 * a `?staffPreview=1` URL param is consumed once on load.
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

  const enable = useCallback(() => {
    if (!runEnableGuards()) return;
    write(true);
  }, []);
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
