const totalPages = 100; // or set dynamically if you get this from the API

const Pagination = ({ page, setPage }) => {
  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    // Always show 5 buttons if possible
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(start + 4, totalPages);
      } else if (end === totalPages) {
        start = Math.max(end - 4, 1);
      }
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-4">
      <button
        onClick={handlePrev}
        disabled={page === 1}
        className="transition3s px-3 py-1 rounded bg-dark-100/10 text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        Prev
      </button>

      {getPageNumbers().map((num) => (
        <button
          key={num}
          onClick={() => setPage(num)}
          className={`transition3s px-3 py-1 rounded shadow-inner shadow-light-100/10 ${
            page === num
              ? "bg-indigo-500 text-white"
              : "bg-dark-100/5 text-white hover:bg-indigo-500"
          }`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={handleNext}
        disabled={page === totalPages}
        className="transition3s px-3 py-1 rounded bg-dark-100/10 text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
