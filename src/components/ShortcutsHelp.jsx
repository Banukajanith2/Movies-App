import { createPortal } from "react-dom";

/**
 * Lists the shortcuts available on the current watch page.
 *
 * Note on scope: the video itself runs in a cross-origin <iframe>, so the page
 * cannot drive play/pause/seek — those belong to the provider's own player.
 * Everything here acts on the surrounding page instead.
 */
const ShortcutsHelp = ({ items = [], onClose }) =>
  createPortal(
    <div className="ui-modal-backdrop" onClick={onClose}>
      <div className="ui-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts">
        <h3>Keyboard shortcuts</h3>
        <p>The video player itself is controlled by the streaming provider.</p>

        <div className="shortcuts-list">
          {items.map((item) => (
            <div className="shortcuts-row" key={item.label}>
              <span className="shortcuts-desc">{item.label}</span>
              <span className="flex items-center gap-1">
                {item.keys.map((key) => (
                  <kbd className="shortcut-key" key={key}>{key}</kbd>
                ))}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button className="ui-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );

export default ShortcutsHelp;
