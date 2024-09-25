import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import Home from './Home';
import Users from './Users';
import './dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="content">
        <Routes>
        <Route path="/" element={<Navigate to="quotation" />} /> 
          <Route path="quotation" element={<Home />} /> {/* Matches the NavLink in Sidebar */}
          <Route path="users" element={<Users />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
