import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './modal.css'; // Make sure you style your modal
import 'react-toastify/dist/ReactToastify.css'; 
import { ToastContainer, toast } from 'react-toastify';
import api from './api';

const AddMaterialModal = ({ isOpen, onClose }) => {
  const [materialType, setMaterialType] = useState('');
  const [options, setOptions] = useState({});
  const [nextOptionId, setNextOptionId] = useState(1);
  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);
  const [manualEntry, setManualEntry] = useState(false); // Toggle for manual entry

  useEffect(() => {
    if (isOpen) {
      setOptions({
        1: { name: '', rate: '', uom: ''  }, // Ensure initial fields are empty
      });
      setNextOptionId(2); // Prepare for adding more options
      getMaterialTypeOptions(); // Fetch material types when the modal is open
    }
  }, [isOpen]);

  // Function to fetch material types
  const getMaterialTypeOptions = async () => {
    try {
      const response = await api.get('/rate-materials', {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'), // Fetch token from localStorage
        },
      });

      // Extract material types and remove duplicates
      const uniqueMaterialTypes = [...new Set(response.data.map(item => item.material_type))];

      // Update state with unique material types
      setMaterialTypeOptions(uniqueMaterialTypes);
      
    } catch (error) {
      console.log(error);
    }
  };

  const handleOptionChange = (id, field, value) => {
    // Ensure the value being set is a string
    setOptions((prevOptions) => ({
      ...prevOptions,
      [id]: {
        ...prevOptions[id],
        [field]: value.toString(), // Convert to string to avoid unintentional type casting
      },
    }));
  };

  const handleAddOption = () => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      [nextOptionId]: { name: '', rate: '', uom: ''  }, // Ensure initial fields are empty
    }));
    setNextOptionId((prevId) => prevId + 1);
  };

  const handleRemoveOption = (id) => {
    setOptions((prevOptions) => {
      const { [id]: _, ...remainingOptions } = prevOptions;
      return remainingOptions;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a new object with material names as keys
    const formattedOptions = {};
  
    for (const id in options) {
      const { name, rate, uom } = options[id];
      if (name) {
        if (!uom) {
          toast.error(`Please provide a UOM for ${name}.`);
          return;
        }
        formattedOptions[name] = { rate: Number(rate), uom  }; // Add qty to options
      } else {
        toast.error('Material Name is required for all options.');
        return;
      }
    }
  
    if (!materialType || Object.keys(formattedOptions).length === 0) {
      toast.error('Please fill all the required fields.');
      return;
    }
  
    try {
      const response = await api.post(
        '/rate-materials',
        {
          material_type: materialType,
          options: formattedOptions,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token'),
          }
        }
      );

      // Check for 201 status code
      if (response.status === 201) {
        toast.success('Material added successfully!');
        // Reset form after success
        setMaterialType('');
        setOptions({});
        setNextOptionId(1);
        onClose(); // Close the modal after successful submission
        window.location.reload();
      } else {
        console.log(response,"----");
        toast.error('Unexpected response from the server.');
      }
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Failed to add material. Please try again.');
    }
  };

  return (
    isOpen && (
      <div className="modal-overlay">
        <ToastContainer/>
        <div className="modal-content">
          <h2>Add New Material</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="manualEntryToggle">
                <input
                  type="checkbox"
                  id="manualEntryToggle"
                  checked={manualEntry}
                  onChange={() => setManualEntry(!manualEntry)}
                />
                Manual Entry
              </label>
              {!manualEntry ? (
                <div>
                  <label htmlFor="materialType">Material Type</label>
                  <select
                    id="materialType"
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    required
                  >
                    <option value="">Select material type</option>
                    {materialTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="materialType">Enter Material Type</label>
                  <input
                    type="text"
                    id="materialType"
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    placeholder="Enter new material type"
                    required
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="options">Detail</label>
              <div>
                {Object.keys(options).map((id) => (
                  <div key={id} className="option-group">
                    <input
                      type="text"
                      placeholder="Material Name"
                      value={options[id].name || ''}
                      onChange={(e) => handleOptionChange(id, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      value={options[id].rate}
                      onChange={(e) => handleOptionChange(id, 'rate', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="UOM"
                      value={options[id].uom}
                      onChange={(e) => handleOptionChange(id, 'uom', e.target.value)}
                    />
                    <button
                      className="rateMaterialsubmit"
                      type="button"
                      onClick={() => handleRemoveOption(id)}
                    >
                      Remove Row
                    </button>
                  </div>
                ))}
                <div className="option-addrow">
                  <button className="rateMaterialsubmit" type="button" onClick={handleAddOption}>
                    Add Row
                  </button>
                </div>
              </div>
            </div>
            <button className="rateMaterialsubmit" type="submit">
              Submit
            </button>
            <button className="rateMaterialclose" type="button" onClick={onClose}>
              Close
            </button>
          </form>
        </div>
      </div>
    )
  );
};

export default AddMaterialModal;
