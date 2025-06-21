import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import MoviePage from './pages/MoviePage.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route path='/' element={<App />}/>
      <Route path="/movie/:slug" element={<MoviePage />} />
      <Route path='/404-Error'/>
    </Routes>
  </HashRouter>
)

