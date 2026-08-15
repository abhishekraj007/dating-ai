"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type SidebarContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  isCollapsed: false,
  toggleCollapsed: () => {},
});

const LARGE_DESKTOP_QUERY = "(min-width: 1024px)";
const COLLAPSED_STORAGE_KEY = "feelai-sidebar-collapsed";

function isChatConversationPath(pathname: string | null) {
  return Boolean(pathname?.startsWith("/chat/") && pathname !== "/chat");
}

function readStoredCollapsed() {
  const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
  if (stored === "true") {
    return true;
  }
  if (stored === "false") {
    return false;
  }
  return null;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);
  const [isLargeDesktop, setIsLargeDesktop] = useState(false);

  const isChatConversation = isChatConversationPath(pathname);

  useEffect(() => {
    const media = window.matchMedia(LARGE_DESKTOP_QUERY);
    const sync = () => setIsLargeDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const stored = readStoredCollapsed();
    if (stored !== null) {
      setIsCollapsed(stored);
    } else if (isChatConversationPath(window.location.pathname)) {
      setIsCollapsed(true);
    }
    setHasLoadedPreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPreference) {
      return;
    }
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(isCollapsed));
  }, [hasLoadedPreference, isCollapsed]);

  useEffect(() => {
    if (!hasLoadedPreference || !isLargeDesktop || !isChatConversation) {
      return;
    }
    setIsCollapsed(true);
  }, [hasLoadedPreference, isChatConversation, isLargeDesktop]);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        isCollapsed,
        toggleCollapsed: () => setIsCollapsed((collapsed) => !collapsed),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
