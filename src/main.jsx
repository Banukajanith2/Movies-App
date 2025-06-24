import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import MoviePage from './pages/MoviePage.jsx'
import './index.css'
import ErrorPage from './pages/404-ErrorPage.jsx'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route path='/' element={<App />}/>
      <Route path="/movie/:slug" element={<MoviePage />} />
      <Route path="*" element={<ErrorPage/>}/>
      <Route path="/404-Error" element={<ErrorPage/>}/>

    </Routes>
  </HashRouter>
)

