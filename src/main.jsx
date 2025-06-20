import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PageLoad from './components/PageLoad.jsx'
import MoviePage from './components/MoviePage.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<PageLoad/>}/>
      <Route path="/movies" element={<MoviePage />} />
    </Routes>
  </BrowserRouter>
)

