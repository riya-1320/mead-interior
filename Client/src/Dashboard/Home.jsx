import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './quotation.css';
import { useMaterials } from '../Context/furnitureAPI';

const Home = () => {
  const { quotations, loading } = useMaterials();
  const navigate = useNavigate(); // Initialize useNavigate
  const currentYear = new Date().getFullYear(); 
  const handleViewClick = (id) => {
    navigate(`/Dashboard/viewQuotation/${id}`); // Navigate to View component
  };

  return (
    <div className="qh-home-container">
      <h1 className="qh-home-title">Quotations</h1>
      {loading ? (
        <p className="qh-loading-text">Loading...</p>
      ) : (
        <div className="qh-table-container">
          {quotations.length === 0 ? (
            <p className="qh-no-quotations">No quotations available.</p>
          ) : (
            <table className="qh-quotation-table">
              <thead>
                <tr>
                  <th>Qu. No</th>
                  <th>Client Name</th>
                  <th>Client Code</th>
                  <th>Submitted At</th>
                  <th>Total Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation, index) => (
                  <tr key={quotation._id} className="qh-quotation-row">
                    <td> {`Qu-${currentYear}-${String(index + 1).padStart(3, '0')}`}</td>
                    <td>{quotation.clientName}</td>
                    <td>{quotation.clientCode}</td>
                    <td>{new Date(quotation.submittedAt).toLocaleDateString()}</td>
                    <td>
                      {quotation.items.reduce((total, item) => total + item.totalAmount, 0)}
                    </td>
                    <td>
                      <button 
                        className="qh-view-button" 
                        onClick={() => handleViewClick(quotation._id)} // Add click handler
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
