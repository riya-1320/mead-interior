import React, { useState } from 'react';
import './style.css';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../assets/logo.png';

const FurnitureOrderForm = () => {
  const { id } = useParams(); // Retrieving `id` from URL params.
  const [clientName, setClientName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [itemSelect, setItemSelect] = useState('');
  const [components, setComponents] = useState([
    {
      unit: '',
      rows: [
        { componentName: '', length: '', breadth: '', depth: '', quantity: '',cutsize:'' },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const handleAddComponent = () => {
    setComponents([
      ...components,
      {
        unit: '',
        rows: [
          { componentName: '', length: '', breadth: '', depth: '', quantity: '',cutsize:'' },
        ],
      },
    ]);
  };

  const handleRemoveComponent = (index) => {
    const updatedComponents = components.filter((_, i) => i !== index);
    setComponents(updatedComponents);
  };

  const handleAddRow = (componentIndex) => {
    const updatedComponents = [...components];
    updatedComponents[componentIndex].rows.push({
      componentName: '',
      length: '',
      breadth: '',
      depth: '',
      quantity: '',
      cutsize:''
    });
    setComponents(updatedComponents);
  };

  const handleRemoveRow = (componentIndex, rowIndex) => {
    const updatedComponents = [...components];
    updatedComponents[componentIndex].rows = updatedComponents[
      componentIndex
    ].rows.filter((_, i) => i !== rowIndex);
    setComponents(updatedComponents);
  };

  const handleInputChange = (componentIndex, rowIndex, field, value) => {
    const updatedComponents = [...components];
    updatedComponents[componentIndex].rows[rowIndex][field] = value;
    setComponents(updatedComponents);
  };

  const handleUnitChange = (index, value) => {
    const updatedComponents = [...components];
    updatedComponents[index].unit = value;
    setComponents(updatedComponents);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Formatting components and adding materials for each row
    const formattedComponents = components.flatMap(component => 
      component.rows.map(row => ({
        unit: component.unit,
        componentName: row.componentName,
        length: row.length,
        breadth: row.breadth,
        depth: row.depth,
        quantity: row.quantity,
        cutsize: row.cutsize,
        
      }))
    );

    try {
      const response = await fetch(`http://localhost:5000/api/components/combined/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemSelect, // Include the item selected in the previous step
          components: formattedComponents, // Pass the formatted components with materials
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setSuccess('Form submitted successfully!'); 
      
      // Navigate to the /materialSelection/:id page using the returned _id
      navigate(`/materialSelection/${id}`);
    } catch (error) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <img src={logo} alt="Logo" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="section items-section">
          <h3>Enter Item</h3>
          <div className="colitem">
            <label htmlFor="itemSelect">Item</label>
            <input
              type="text"
              className="unitSelect"
              id="itemSelect"
              placeholder="Enter item name"
              value={itemSelect}
              onChange={(e) => setItemSelect(e.target.value)}
              required
            />
          </div>
        </div>

        {components.map((component, componentIndex) => (
          <div key={componentIndex} className="section components-section">
            <h3>Item Description & Input Furniture Component</h3>

            <div className="unit-row">
              <div className="colitem">
                <label htmlFor={`unitSelect-${componentIndex}`}>Description Name</label>
                <input
                  type="text"
                  className="unitSelect"
                  placeholder="Enter description name"
                  value={component.unit}
                  onChange={(e) => handleUnitChange(componentIndex, e.target.value)}
                  required
                />
              </div>
             <div>
             <button
                className="add-button"
                type="button"
                onClick={handleAddComponent}
              >
                + Add Component
              </button>
              {components.length > 1 && (
                <button
                  className="remove-button"
                  type="button"
                  onClick={() => handleRemoveComponent(componentIndex)}
                >
                  - Remove Component
                </button>
              )}
             </div>
            </div>

            {component.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="component-row">
                <div className="col">
                  <label htmlFor={`componentName-${componentIndex}-${rowIndex}`}>
                    Component Name
                  </label>
                  <input
                    type="text"
                    className="componentName"
                    placeholder="e.g., Top and Bottom Panel"
                    value={row.componentName}
                    onChange={(e) =>
                      handleInputChange(componentIndex, rowIndex, 'componentName', e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col">
                  <label htmlFor={`length-${componentIndex}-${rowIndex}`}>
                    Length (L)
                  </label>
                  <input
                    type="number"
                    className="length"
                    placeholder="Enter Length"
                    value={row.length}
                    onChange={(e) =>
                      handleInputChange(componentIndex, rowIndex, 'length', e.target.value)
                    }
                  />
                </div>
                <div className="col">
                  <label htmlFor={`breadth-${componentIndex}-${rowIndex}`}>
                    Breadth (B)
                  </label>
                  <input
                    type="number"
                    className="breadth"
                    placeholder="Enter Breadth"
                    value={row.breadth}
                    onChange={(e) =>
                      handleInputChange(componentIndex, rowIndex, 'breadth', e.target.value)
                    }
                  />
                </div>
                <div className="col">
                  <label htmlFor={`depth-${componentIndex}-${rowIndex}`}>
                    Depth (D)
                  </label>
                  <input
                    type="number"
                    className="depth"
                    placeholder="Enter Depth"
                    value={row.depth}
                    onChange={(e) =>
                      handleInputChange(componentIndex, rowIndex, 'depth', e.target.value)
                    }
                  />
                </div>
                <div className="col">
                  <label htmlFor={`quantity-${componentIndex}-${rowIndex}`}>
                    Quantity (QTY)
                  </label>
                  <input
                    type="number"
                    className="quantity"
                    placeholder="Enter Quantity"
                    value={row.quantity}
                    onChange={(e) =>
                      handleInputChange(componentIndex, rowIndex, 'quantity', e.target.value)
                    }
                  />
                </div>
                <div className="col">
                  <label htmlFor={`quantity-${componentIndex}-${rowIndex}`}>
                   Cut size
                  </label>
                  <input
                    type="number"
                    className="cutsize"
                    placeholder="Enter cut size"
                    value={row.cutsize}
                    onChange={(e) =>
                      handleInputChange(componentIndex, rowIndex, 'cutsize', e.target.value)
                    }
                  />
                </div>
                <div className="col button-group">
                  <button
                    className="add-component-button"
                    type="button"
                    onClick={() => handleAddRow(componentIndex)}
                  >
                    +
                  </button>
                  {component.rows.length > 1 && (
                    <button
                      className="remove-component-button"
                      type="button"
                      onClick={() => handleRemoveRow(componentIndex, rowIndex)}
                    >
                      -
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        <button id="nextButton" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </form>
    </div>
  );
};

export default FurnitureOrderForm;
