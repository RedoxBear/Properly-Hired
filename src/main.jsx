import React from 'react'
import ReactDOM from 'react-dom/client'
import Pages from '@/pages/index.jsx'
import { AuthProvider } from '@/hooks/useAuth'
import '@/index.css'

console.log("Prague Day Main.jsx: Initializing Application...");

ReactDOM.createRoot(document.getElementById('root')).render(
    <AuthProvider>
        <Pages />
    </AuthProvider>
)
 