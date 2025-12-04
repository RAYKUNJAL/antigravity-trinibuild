import React from 'react';
import ReactDOM from 'react-dom/client';
// import App from './App';
// import FitnessApp from './components/FitnessApp';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';
import { HashRouter } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <HashRouter>
        <AdminDashboard />
      </HashRouter>
    </HelmetProvider>
  </React.StrictMode>
);