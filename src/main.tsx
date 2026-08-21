import React from 'react'; import ReactDOM from 'react-dom/client'; import { HashRouter } from 'react-router-dom'; import App from './App'; import { AuthProvider } from '@/features/auth/auth-context'; import './index.css'
localStorage.removeItem('tlp-training-demo-v1'); sessionStorage.removeItem('tlp-demo-auth')
const root = document.getElementById('root'); if (!root) throw new Error('Root element not found')
ReactDOM.createRoot(root).render(<React.StrictMode><HashRouter><AuthProvider><App /></AuthProvider></HashRouter></React.StrictMode>)
