import React, { useReducer, useState } from 'react';
import './style.css';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../assets/logo.png'; 

const initialState = [
  {
    itemSelect: '',
    components: [
      {
        unit: '',
        rows: [{ componentName: '', length: '', breadth: '', depth: '', quantity: '', cutsize: '' }],
        boRows: [{ materialname: '', quantity: '', cutsize: '' }],
      },
    ],
  },
];

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_SECTION':
      return [...state, initialState[0]];
    case 'REMOVE_SECTION':
      return state.filter((_, index) => index !== action.index);
    case 'UPDATE_ITEM_SELECT':
      return state.map((section, index) =>
        index === action.index ? { ...section, itemSelect: action.value } : section
      );
    case 'UPDATE_UNIT':
      return state.map((section, sectionIndex) =>
        sectionIndex === action.sectionIndex ? {
          ...section,
          components: section.components.map((component, componentIndex) =>
            componentIndex === action.componentIndex ? { ...component, unit: action.value } : component
          ),
        } : section
      );
  case 'ADD_COMPONENT':
  return state.map((section, index) =>
    index === action.index ? {
      ...section,
      components: [...section.components, { ...initialState[0].components[0], boRows: [] }],
    } : section
  );

    case 'REMOVE_COMPONENT':
  return state.map((section, sectionIndex) =>
    sectionIndex === action.sectionIndex ? {
      ...section,
      components: section.components.filter((_, index) => index !== action.componentIndex),
      // Keep B/O rows intact
      boRows: section.components[action.componentIndex]?.boRows || [],
    } : section
  );

      case 'ADD_ROW':
        return state.map((section, sectionIndex) =>
          sectionIndex === action.sectionIndex ? {
            ...section,
            components: section.components.map((component, componentIndex) =>
              componentIndex === action.componentIndex ? {
                ...component,
                rows: [...component.rows, { componentName: '', length: '', breadth: '', depth: '', quantity: '', cutsize: '' }],
              } : component
            ),
          } : section
        );
      case 'REMOVE_ROW':
        return state.map((section, sectionIndex) =>
          sectionIndex === action.sectionIndex ? {
            ...section,
            components: section.components.map((component, componentIndex) =>
              componentIndex === action.componentIndex ? {
                ...component,
                rows: component.rows.filter((_, rowIndex) => rowIndex !== action.rowIndex),
              } : component
            ),
          } : section
        );
    case 'UPDATE_ROW':
      return state.map((section, sectionIndex) =>
        sectionIndex === action.sectionIndex ? {
          ...section,
          components: section.components.map((component, componentIndex) =>
            componentIndex === action.componentIndex ? {
              ...component,
              rows: component.rows.map((row, rowIndex) =>
                rowIndex === action.rowIndex ? { ...row, [action.field]: action.value } : row
              ),
            } : component
          ),
        } : section
      );
      case 'ADD_BO_ROW':
        return state.map((section, sectionIndex) =>
          sectionIndex === action.sectionIndex ? {
            ...section,
            components: section.components.map((component, componentIndex) =>
              componentIndex === action.componentIndex ? {
                ...component,
                boRows: [...(component.boRows || []), { materialname: '', quantity: '', cutsize: '' }],
              } : component
            ),
          } : section
        );
      case 'REMOVE_BO_ROW':
        return state.map((section, sectionIndex) =>
          sectionIndex === action.sectionIndex ? {
            ...section,
            components: section.components.map((component, componentIndex) =>
              componentIndex === action.componentIndex ? {
                ...component,
                boRows: component.boRows.filter((_, boRowIndex) => boRowIndex !== action.boRowIndex),
              } : component
            ),
          } : section
        );
      case 'UPDATE_BO_ROW':
        return state.map((section, sectionIndex) =>
          sectionIndex === action.sectionIndex ? {
            ...section,
            components: section.components.map((component, componentIndex) =>
              componentIndex === action.componentIndex ? {
                ...component,
                boRows: component.boRows.map((boRow, boRowIndex) =>
                boRowIndex === action.boRowIndex ? { ...boRow, [action.field]: action.value } : boRow
              ),
            } : component
            ),
          } : section
        );
      
    default:
      return state;
  }
};

const FurnitureOrderForm = () => {
  const { id } = useParams();
  const [sections, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleAddSection = () => dispatch({ type: 'ADD_SECTION' });
  const handleRemoveSection = (index) => dispatch({ type: 'REMOVE_SECTION', index });
  const handleItemSelectChange = (index, value) => dispatch({ type: 'UPDATE_ITEM_SELECT', index, value });
  const handleUnitChange = (sectionIndex, componentIndex, value) => dispatch({ type: 'UPDATE_UNIT', sectionIndex, componentIndex, value });
  const handleAddComponent = (index) => dispatch({ type: 'ADD_COMPONENT', index });
  const handleRemoveComponent = (sectionIndex, componentIndex) => dispatch({ type: 'REMOVE_COMPONENT', sectionIndex, componentIndex });
  const handleAddRow = (sectionIndex, componentIndex) => dispatch({ type: 'ADD_ROW', sectionIndex, componentIndex });
  const handleRemoveRow = (sectionIndex, componentIndex, rowIndex) => dispatch({ type: 'REMOVE_ROW', sectionIndex, componentIndex, rowIndex });
  const handleAddBORow = (sectionIndex, componentIndex) => {
    dispatch({ type: 'ADD_BO_ROW', sectionIndex, componentIndex });
  };
  
  const handleBORowChange = (sectionIndex, componentIndex, boRowIndex, field, value) => {
    dispatch({ type: 'UPDATE_BO_ROW', sectionIndex, componentIndex, boRowIndex, field, value });
  };

  const handleRemoveBORow = (sectionIndex, componentIndex, boRowIndex) => {
    dispatch({ type: 'REMOVE_BO_ROW', sectionIndex, componentIndex, boRowIndex });
  };
  
  const handleRowChange = (sectionIndex, componentIndex, rowIndex, field, value) => {
    dispatch({ type: 'UPDATE_ROW', sectionIndex, componentIndex, rowIndex, field, value });
  };

  const token = localStorage.getItem("token");
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
  
    const formattedSections = sections.map(section => ({
      itemSelect: section.itemSelect,
      components: section.components.flatMap(component => 
        component.rows.map(row => ({
          unit: component.unit,
          componentName: row.componentName,
          length: row.length,
          breadth: row.breadth,
          depth: row.depth,
          quantity: row.quantity,
          cutsize: row.cutsize,
          materials: row.materials,
        }))
      ),
      
      bo: section.components.flatMap(component => 
        component.boRows.map(boRow => ({
          materialname: boRow.materialname,
          quantity: boRow.quantity,
          cutsize: boRow.cutsize,
        }))
      ),
    }));
    const currentYear = new Date().getFullYear();
    
    const requestBody = { items: formattedSections };
    console.log(JSON.stringify(requestBody));

    try {
      const response = await fetch(`http://localhost:5000/api/components/combined/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      setMessage({ type: 'success', text: 'Form submitted successfully!' });
      navigate(`/materialSelection&pdf/${id}`);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit form. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container">
      <div className="header">
        <img src={logo} alt="Logo" />
      </div>
      <div className="button-group">
        <button className="add-section-button" type="button" onClick={handleAddSection}>+ Add Section</button>
        {sections.length > 1 && (
          <button className="remove-section-button" type="button" onClick={() => handleRemoveSection(sections.length - 1)}>- Remove Section</button>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="section items-section">
            <h3>Enter Item for Section {sectionIndex + 1}</h3>
            <div className="colitem">
              <label htmlFor={`itemSelect-${sectionIndex}`}>Item</label>
              <input
                type="text"
                className="unitSelect"
                placeholder="Enter item name"
                value={section.itemSelect}
                onChange={(e) => handleItemSelectChange(sectionIndex, e.target.value)}
                required
              />
            </div>
  
            {section.components.map((component, componentIndex) => (
              <div key={componentIndex} className="section components-section">
                <h4 className='h4'>Item Description & Input Furniture Component</h4>
                <div className="unit-row">
                  <div className="colitem">
                    <label htmlFor={`unitSelect-${sectionIndex}-${componentIndex}`}>Description Name</label>
                    <input
                      type="text"
                      className="unitSelect"
                      placeholder="Enter description name"
                      value={component.unit}
                      onChange={(e) => handleUnitChange(sectionIndex, componentIndex, e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <button className="add-button" type="button" onClick={() => handleAddComponent(sectionIndex)}>+ Add Component</button>
                    {section.components.length > 1 && (
                      <button className="remove-button" type="button" onClick={() => handleRemoveComponent(sectionIndex, componentIndex)}>- Remove Component</button>
                    )}
                  </div>
                </div>
  
                {component.rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="component-row">
                    <div className="col">
                      <label htmlFor={`componentName-${sectionIndex}-${componentIndex}-${rowIndex}`}>Component Name</label>
                      <input
                        type="text"
                        className="componentName"
                        placeholder="e.g., Top and Bottom Panel"
                        value={row.componentName}
                        onChange={(e) => handleRowChange(sectionIndex, componentIndex, rowIndex, 'componentName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`length-${sectionIndex}-${componentIndex}-${rowIndex}`}>Length (L)</label>
                      <input
                        type="number"
                        className="length"
                        placeholder="Enter Length"
                        value={row.length}
                        onWheel={(e) => e.target.blur()}
                        onChange={(e) => handleRowChange(sectionIndex, componentIndex, rowIndex, 'length', e.target.value)}
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`breadth-${sectionIndex}-${componentIndex}-${rowIndex}`}>Breadth (B)</label>
                      <input
                        type="number"
                        className="breadth"
                        placeholder="Enter Breadth"
                        value={row.breadth}
                        onWheel={(e) => e.target.blur()}
                        onChange={(e) => handleRowChange(sectionIndex, componentIndex, rowIndex, 'breadth', e.target.value)}
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`depth-${sectionIndex}-${componentIndex}-${rowIndex}`}>Depth (D)</label>
                      <input
                        type="number"
                        className="depth"
                        placeholder="Enter Depth"
                        value={row.depth}
                        onWheel={(e) => e.target.blur()}
                        onChange={(e) => handleRowChange(sectionIndex, componentIndex, rowIndex, 'depth', e.target.value)}
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`quantity-${sectionIndex}-${componentIndex}-${rowIndex}`}>Quantity (QTY)</label>
                      <input
                        type="number"
                        className="quantity"
                        placeholder="Enter Quantity"
                        value={row.quantity}
                        onWheel={(e) => e.target.blur()}
                        onChange={(e) => handleRowChange(sectionIndex, componentIndex, rowIndex, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`cutsize-${sectionIndex}-${componentIndex}-${rowIndex}`}>Cut Size</label>
                      <input
                        type="text"
                        className="cutsize"
                        placeholder="Enter Cut Size"
                        value={row.cutsize}
                        onWheel={(e) => e.target.blur()}
                        onChange={(e) => handleRowChange(sectionIndex, componentIndex, rowIndex, 'cutsize', e.target.value)}
                      />
                    </div>
                    <div className="col button-group">
                      <button className="add-component-button" type="button" onClick={() => handleAddRow(sectionIndex, componentIndex)}>+</button>
                      {component.rows.length > 1 && (
                        <button className="remove-component-button" type="button" onClick={() => handleRemoveRow(sectionIndex, componentIndex, rowIndex)}>-</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            <hr />
            <h4 className="h4">B/O Component</h4>
            <div className="bo-component-section">
              {section.components.map((component, componentIndex) => (
                <div key={componentIndex} className="bo-component">
                  {component.boRows.map((boRow, boRowIndex) => (
                    <div key={boRowIndex} className="bo-row">
                      <div className="col">
                        <label htmlFor={`boField1-${sectionIndex}-${componentIndex}-${boRowIndex}`}>Material Name</label>
                        <input
                          type="text"
                          placeholder="Enter material name"
                          value={boRow.materialname}
                          onChange={(e) => handleBORowChange(sectionIndex, componentIndex, boRowIndex, 'materialname', e.target.value)}
                        />
                      </div>
                      <div className="col">
                        <label htmlFor={`boField2-${sectionIndex}-${componentIndex}-${boRowIndex}`}>Quantity</label>
                        <input
                          type="text"
                          placeholder="Enter quantity"
                          value={boRow.quantity }
                          onWheel={(e) => e.target.blur()}
                          onChange={(e) => handleBORowChange(sectionIndex, componentIndex, boRowIndex, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col">
                        <label htmlFor={`boField3-${sectionIndex}-${componentIndex}-${boRowIndex}`}>Cutsize</label>
                        <input
                          type="text"
                          placeholder="Enter cutsize"
                          value={boRow.cutsize}
                          onWheel={(e) => e.target.blur()}
                          onChange={(e) => handleBORowChange(sectionIndex, componentIndex, boRowIndex, 'cutsize', e.target.value)}
                        />
                      </div>
                      <div className="col button-group">
                      <button className="add-bo-row-button" type="button" onClick={() => handleAddBORow(sectionIndex, componentIndex)}>+</button>
                     {component.boRows.length > 1 && (
                       <button className="remove-bo-row-button" type="button" onClick={() => handleRemoveBORow(sectionIndex, componentIndex, boRowIndex)}>-</button>
                     )}
                      </div>
                            </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="form-buttons">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
      {message.text && <div className={message.type === 'error' ? 'error' : 'success'}>{message.text}</div>}
    </div>
  );
  
};

export default FurnitureOrderForm;
