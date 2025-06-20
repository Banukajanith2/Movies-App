import React from "react";

const Search = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="search">
      <div className="flex">
        <img src="search.svg" alt="search" />
        <input
          type="text"
          placeholder="Search For Any Movie"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}/>
      </div>
    </div>
  );
};

export default Search;
