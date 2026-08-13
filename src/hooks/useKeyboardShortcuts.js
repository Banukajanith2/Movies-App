import { useEffect, useRef } from "react";

/** Don't hijack keys while the user is typing into a field. */
const isTypingTarget = (el) =>
  !!el &&
  (el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable);

/**
 * Binds single-key shortcuts on window.
 *
 * `bindings` is a plain map of key -> handler, e.g. { f: toggleFullscreen }.
 * Single characters are matched lower-cased; named keys ("Escape", " ") match
 * event.key directly. Combos with Ctrl/Cmd/Alt are ignored so browser and OS
 * shortcuts keep working.
 *
 * The map is held in a ref, so passing a fresh object literal each render does
 * not tear down and re-add the listener.
 */
export const useKeyboardShortcuts = (bindings, enabled = true) => {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const handler = bindingsRef.current?.[key];
      if (typeof handler !== "function") return;

      event.preventDefault();
      handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
};

export default useKeyboardShortcuts;
