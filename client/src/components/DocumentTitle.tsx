import { useEffect } from "react";

const APP_NAME = "Voxly";

/** Sets document.title for the current view */
export function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} — AI Customer Support`;
    return () => {
      document.title = `${APP_NAME} — AI Customer Support`;
    };
  }, [title]);

  return null;
}
