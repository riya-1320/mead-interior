import { useState } from 'react'
 
import './App.css'
import { BrowserRouter, Route, Router, Routes } from 'react-router-dom'
import MaterialSelection from './page/MaterialSelection'
import FurnitureOrderForm from './page/FurnitureOrderForm' 
import { MaterialsProvider } from './Context/furnitureAPI' 
import HomePage from './page/HomePage'
import Login from './page/Login'
import {Quotation} from './page/Pdf' 
import ParentComponent from './page/MaterialandPdf' 
import Dashboard from './Dashboard/Dashboard'
import View from './Dashboard/View' 
import ProtectedRoute from './utilities/ProtectedRoute'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
   
    <MaterialsProvider>
    <BrowserRouter>
    <Routes>   
    <Route path="/" element={<Login />} />
                <Route path="/homepage" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/materialSelection&pdf/:id" element={<ProtectedRoute><ParentComponent /></ProtectedRoute>} />
                <Route path="/furnitureOrderForm/:id" element={<ProtectedRoute><FurnitureOrderForm /></ProtectedRoute>} />
                <Route path="/materialSelection/:id" element={<ProtectedRoute><MaterialSelection /></ProtectedRoute>} />
                <Route path="/Dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/Dashboard/viewQuotation/:id" element={<ProtectedRoute><View /></ProtectedRoute>} />
            </Routes>

    </BrowserRouter>
    </MaterialsProvider>
    
    </>
  )
}

export default App
