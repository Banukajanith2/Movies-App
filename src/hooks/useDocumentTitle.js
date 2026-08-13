import { useEffect } from "react";

const DEFAULT_TITLE = "EZ Movies - Watch HD Movies & TV Shows Online";

/** Sets the browser tab title for the current page, reverting to the app default on unmount. */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} • EZ Movies` : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
};
