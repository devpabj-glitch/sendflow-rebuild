import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { StoreProvider } from './store'
import { SessionProvider } from './auth'
import { I18nProvider } from './i18n'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <SessionProvider>
        <StoreProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </StoreProvider>
      </SessionProvider>
    </I18nProvider>
  </React.StrictMode>,
)

