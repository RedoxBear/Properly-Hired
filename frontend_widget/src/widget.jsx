import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class AIJobWidget extends HTMLElement {
  connectedCallback() {
    const mountPoint = document.createElement('div');
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint);

    // Inject styles into Shadow DOM so they don't leak or get affected by Wix
    const style = document.createElement('style');
    // In production, we would inject the actual CSS string here
    style.textContent = `
      :host { display: block; width: 100%; }
      /* Minimal reset for shadow DOM */
      * { box-sizing: border-box; }
    `;
    this.shadowRoot.appendChild(style);

    const root = ReactDOM.createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

// Register the custom element
customElements.define('ai-job-widget', AIJobWidget);
