import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 🔥 Aplica tema antes do React montar
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark-theme');
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// 🔥 Renderiza o App sem StrictMode (pode testar com StrictMode depois)
root.render(<App />);

reportWebVitals();
