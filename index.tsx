import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  // Robust fallback UI directly into body if root is missing
  document.body.innerHTML = `
    <div style="
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      font-family: sans-serif; 
      background-color: #fef2f2; 
      color: #991b1b; 
      padding: 20px; 
      text-align: center;
    ">
      <h1 style="margin-bottom: 10px;">Fatal Error</h1>
      <p>Could not find the root element to mount the application.</p>
      <p style="font-size: 0.8em; opacity: 0.8;">Please check index.html ensures &lt;div id="root"&gt;&lt;/div&gt; exists.</p>
    </div>
  `;
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);