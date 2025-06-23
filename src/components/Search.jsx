const Search = ({ searchTerm, setSearchTerm, className = "", onFocus }) => {
  return (
    <div className={className}>
      <div className="flex flex-row">
        <img src="search.svg" alt="search" />
        <input
          type="text"
          placeholder="Search Movies"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={onFocus} // triggers dropdown open
        />
      </div>
    </div>
  );
};

export default Search;
