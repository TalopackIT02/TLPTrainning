import React from 'react'; import ReactDOM from 'react-dom/client'; import { HashRouter } from 'react-router-dom'; import App from './App'; import { AuthProvider } from '@/features/auth/auth-context'; import { DataProvider } from '@/data/data-context'; import './index.css'
const root = document.getElementById('root'); if (!root) throw new Error('Root element not found')
ReactDOM.createRoot(root).render(<React.StrictMode><HashRouter><AuthProvider><DataProvider><App /></DataProvider></AuthProvider></HashRouter></React.StrictMode>)
