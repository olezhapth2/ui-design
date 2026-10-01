import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WarpPage from './WarpPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WarpPage />
  </StrictMode>,
)
