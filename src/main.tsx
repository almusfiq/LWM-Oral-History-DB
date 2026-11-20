import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LangProvider } from './i18n'
// Bangla font bundled with the site (not fetched from Google), so it is always the one used:
// a missing web font made browsers fall back to system fonts with hard-to-read digits.
import '@fontsource/noto-sans-bengali/bengali-300.css'
import '@fontsource/noto-sans-bengali/bengali-400.css'
import '@fontsource/noto-sans-bengali/bengali-500.css'
import '@fontsource/noto-sans-bengali/bengali-600.css'
import '@fontsource/noto-sans-bengali/bengali-700.css'
import '@fontsource/noto-sans-bengali/bengali-800.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>,
)
