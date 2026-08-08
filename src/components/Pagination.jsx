const Pagination = ({ page, setPage, totalPages }) => {
  const capped = Math.min(totalPages, 500); // TMDB caps at page 500

  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end   = Math.min(capped, page + 2);
    if (end - start < 4) {
      if (start === 1) end   = Math.min(start + 4, capped);
      else             start = Math.max(end - 4, 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 flex-wrap">
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="transition3s px-3 py-1 rounded bg-brand-text/5 text-brand-text hover:bg-accent hover:text-white disabled:opacity-40 text-sm cursor-pointer"
      >
        Prev
      </button>

      {getPageNumbers().map(num => (
        <button
          key={num}
          onClick={() => setPage(num)}
          className={`transition3s px-3 py-1 rounded text-sm shadow-inner transition-colors duration-200 cursor-pointer ${
            page === num
              ? "bg-accent text-white"
              : "bg-brand-text/5 text-brand-text hover:bg-accent hover:text-white"
          }`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={() => setPage(p => Math.min(capped, p + 1))}
        disabled={page === capped}
        className="transition3s px-3 py-1 rounded bg-brand-text/5 text-brand-text hover:bg-accent hover:text-white disabled:opacity-40 text-sm cursor-pointer"
      >
        Next
      </button>

      <span className="text-muted text-xs ml-2">
        Page {page} of {capped.toLocaleString()}
      </span>
    </div>
  );
};

export default Pagination;
