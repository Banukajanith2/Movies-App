import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import App from './App.jsx';
import PageLoad from './components/PageLoad.jsx';
import './index.css';

const MoviePage  = lazy(() => import('./pages/MoviePage.jsx'));
const TVPage     = lazy(() => import('./pages/TVPage.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const ErrorPage  = lazy(() => import('./pages/404-ErrorPage.jsx'));

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Suspense>
      <PageLoad>
        <Routes>
          <Route path='/'           element={<App />} />
          <Route path='/movie/:slug' element={<MoviePage />} />
          <Route path='/tv/:slug'    element={<TVPage />} />
          <Route path='/search'      element={<SearchPage />} />
          <Route path='/404-Error'   element={<ErrorPage />} />
          <Route path='*'            element={<ErrorPage />} />
        </Routes>
      </PageLoad>
    </Suspense>
  </HashRouter>
);
