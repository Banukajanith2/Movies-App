import { useToast } from "../context/ToastContext";

/** execCommand fallback for browsers/contexts where the async Clipboard API is unavailable. */
const legacyCopy = (text) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);
  return success;
};

const ShareButton = ({
  className = "ui-icon-btn",
}) => {
  const { showToast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard!");
        return;
      } catch (error) {
        console.error("Clipboard API failed, falling back:", error);
      }
    }

    if (legacyCopy(url)) {
      showToast("Link copied to clipboard!");
    } else {
      showToast("Couldn't copy the link. Please try again.", "error");
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className}
      aria-label="Share"
      title="Share"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
    </button>
  );
};

export default ShareButton;
