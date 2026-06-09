import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n'
import GlobalLoader from './components/GlobalLoader.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<GlobalLoader />}>
      <App />
    </Suspense>
  </StrictMode>,
)
