import { useState, useEffect } from "react";
import Search from "./components/Search.jsx";


//get api key to make the request
const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};


const App = () => {

  const [searchTerm, setSearchTerm] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  //making request via async function
  const fetchMovies = async () => {
    try {

      const endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      //error handling of the API
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      const data = await response.json();
      console.log(data);
      //If API doesnt work
    } catch (error) {
     setErrorMessage('Error Fetching Movies from API : '+(error));
    }
  };

  //run fetch api after page loads
  useEffect((effect) => {
    fetchMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

        <div className="wrapper">
          <header>
            <img src="./hero.png" alt="Hero Banner" />
            <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy!</h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
          </header>

          <section className="all-movies">
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          </section>
        </div>
    </main>
  );
}

export default App;
