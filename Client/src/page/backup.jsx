import React, { useEffect, useState, useRef } from 'react';
import './MaterialSelection.css';
import html2pdf from 'html2pdf.js';
import { useParams } from 'react-router-dom';
import logo from '../assets/logo.png';

import { Quotation } from './Pdf';

const MaterialSelection = () => {
    const quotationPDFRef = useRef(); 
    const { id } = useParams();
    const [components, setComponents] = useState([]);
    const [materials, setMaterials] = useState([]); // List of all available materials fetched from API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [calculationDetails, setCalculationDetails] = useState([]);

    // Fetch components and available materials when the component loads
    useEffect(() => {
        const fetchComponentData = async () => {
            if (!id) {
                setError('No ID found in URL parameters');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/components/combined/${id}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                
                // Initialize each component with at least one default material
                const initializedComponents = data.components.map(component => ({
                    ...component,
                    materials: component.materials.length > 0 ? component.materials : [{ material: '', value: '' }]
                }));
                
                setComponents(initializedComponents);
                setLoading(false);
            } catch (error) {
                setError('Error loading component summary');
                setLoading(false);
            }
        };

        const getMaterials = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/components/materials');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                const materialNames = data.data.map(material => material.name); // Assuming data.data has materials list
                setMaterials([...new Set(materialNames)]); // Avoid duplicate materials
            } catch (error) {
                setError('Error loading materials');
            }
        };

        fetchComponentData();
        getMaterials();
        
    }, [id]); // Runs when id changes

    const addMaterial = (index) => {
        const newComponents = [...components];
        newComponents[index].materials.push({ material: materials[0] || '', value: '' }); // Default to first material
        setComponents(newComponents);
    };

    const removeMaterial = (index, materialIndex) => {
        const newComponents = [...components];
        newComponents[index].materials.splice(materialIndex, 1); // Remove selected material
        setComponents(newComponents);
    };

    const calculateMaterialValue = (materialName, component) => {
        console.log(materialName, component , "12112121212");
        const { length, breadth, depth, quantity } = component;
        console.log(length, breadth, depth, quantity);
        let value = 0;
    
        // Define the calculation logic for each material type
        switch (materialName) {
            case 'OSL - 18mm':
                const cutSize = 2.9768/12; // Assuming you want to multiply these
                value = (quantity * cutSize) * 1.03;
                break;
            case 'Hardware':
                value = quantity * 4 * 5;
                console.log(value, "value");
                break;
            case 'Lipping':
                value = quantity * (length + breadth) * 2 * 1.05;
                break;
            case 'Board cutting':
                value = quantity * (length + breadth) * 2 / 60;
                break;
            case 'Machine':
                value = (quantity * (length + breadth) * 2 * 2 / 60) +
                        (quantity * 4 * 3 * 0.5 / 60) +
                        (quantity * length * 2.5 / 60);
                break;
            default:
                value = 0;
                break;
        }
    console.log(value, "value");
        return value.toFixed(4); // Return as a string with two decimal points
    };
    
    const handleMaterialChange = (index, materialIndex, field, value) => {
        const newComponents = [...components];
        const newCalculationDetails = [...calculationDetails];
    
        if (field === 'material') {
            const selectedMaterial = value;
            newComponents[index].materials[materialIndex]['material'] = selectedMaterial;
    
            const baseValue = calculateMaterialValue(selectedMaterial, newComponents[index]);
            const intermediateValue1 = (baseValue * 1.3).toFixed(4);
            const intermediateValue2 = (intermediateValue1 * 1.25).toFixed(4);
    
            // Store intermediate values and final value for display
            const calculation = {
                baseValue: baseValue,
                intermediateValue1: intermediateValue1,
                intermediateValue2: intermediateValue2,
                rate: null, // Rate will be applied in submit function
                finalValue: null
            };
    
            if (!newCalculationDetails[index]) {
                newCalculationDetails[index] = [];
            }
            newCalculationDetails[index][materialIndex] = calculation;
    
            setCalculationDetails(newCalculationDetails);
            newComponents[index].materials[materialIndex]['value'] = intermediateValue2;
        } else {
            newComponents[index].materials[materialIndex][field] = value;
        }
    
        setComponents(newComponents);
    };
    
    const submitMaterialSelection = async () => {
        if (!id) {
            setError('No ID found in URL parameters');
            return;
        }
    
        const cleanedComponents = components.map(component => ({
            ...component,
            materials: component.materials.map(material => ({
                ...material,
                material: material.material || materials[0], // Default to first material if none selected
            })).filter(material => material.material && material.value) // Filter empty materials
        })).filter(component => component.materials.length > 0);
    
        try {
            const response = await fetch(`http://localhost:5000/api/components/combined/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ components: cleanedComponents })
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const result = await response.json();
            console.log('API Response:', result);
    
            // Loop through materials and apply the rate
            const updatedCalculationDetails = [...calculationDetails];
            components.forEach((component, index) => {
                component.materials.forEach((material, materialIndex) => {
                    let materialRate = 0;
    
                    result.materials.forEach(materialType => {
                        materialType.rows.forEach(row => {
                            if (row.materialName === material.material) {
                                materialRate = row.rate;
                            }
                        });
                    });
    
                    const calculation = updatedCalculationDetails[index][materialIndex];
                    calculation.rate = materialRate;
                    calculation.finalValue = (parseFloat(calculation.intermediateValue2) * materialRate).toFixed(4);
    
                    // Update component value with final calculated value
                    material.value = calculation.finalValue;
                });
            });
    
            setCalculationDetails(updatedCalculationDetails);
            setComponents(components);
    
            alert('Material Selection Submitted and Calculated Successfully!');
        } catch (error) {
            setError(`Error submitting material selection: ${error.message}`);
        }
    };
    

    const handleExportPDF = () => {
        const element = quotationPDFRef.current;

        if (element) {
            html2pdf()
                .set({
                    margin: [30, 0, 10, 0],
                    filename: 'quotation.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, logging: true, letterRendering: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                })
                .from(element)
                .toPdf()
                .get('pdf')
                .then((pdf) => {
                    const pageCount = pdf.internal.getNumberOfPages();
                    const logoWidth = 50;
                    const logoHeight = 20;
                    const img = logo;

                    for (let i = 1; i <= pageCount; i++) {
                        pdf.setPage(i);
                        pdf.addImage(img, 'PNG', 10, 10, logoWidth, logoHeight);
                    }
                })
                .save();
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="container1">
            <div className="header">
                <img src={logo} alt="Logo" />
            </div>

            {/* <div className="table-header">
                <div className="table-header-left">
                    <div>Description</div>
                    <div>Component</div>
                    <div>Length</div>
                    <div>Breadth</div>
                    <div>Depth</div>
                    <div>Quantity</div>
                    <div>CutSize</div>
                </div>
                <div className="table-header-right">
                    <div>Select Material</div>
                </div>
            </div> */}

            <div className="component-list">
                {components.map((component, index) => (
                    <div key={index} className="component-section-m">
                        <div className="component-details">
                            <div className="description">
                                <h3>{component.unit}</h3>
                                <button className="edit-button">Edit</button>
                            </div>
                            <div className="component-info">
                                <div className='component-info-section'> 
                                <label>component</label>
                                <input type="text" value={component.componentName} />
                                </div>
                                <div className='component-info-section'> 
                                <label>Length</label>
                                <input type="text" value={component.length} />
                                </div>
                                <div className='component-info-section'> 
                                <label>Breadth</label>
                                <input type="text" value={component.breadth} />
                                </div>
                                <div className='component-info-section'> 
                                <label>Depth</label>
                                <input type="text" value={component.depth} />
                                </div>
                                <div className='component-info-section'> 
                                <label>Quantity</label>
                                <input type="text" value={component.quantity} />
                                </div>
                                <div className='component-info-section'>
                                <label>CutSize</label>
                                <input type="text" value={component.cutsize} />    
                                </div>
                            </div>
                        </div>
                      
                        <div className="material-selection">
                        <div className="description">
                                <h3> Select Material</h3>
                                <button
                                className="add-material-button"
                                onClick={() => addMaterial(index)}
                            >
                                + Add Material
                            </button>
                            </div>
                            
                            <div className="material-container">
                                {component.materials.map((material, materialIndex) => (
                                    <div className="material-row" key={materialIndex}>
                                        <select
                                            className="material-select"
                                            value={material.material}
                                            onChange={(e) => handleMaterialChange(index, materialIndex, 'material', e.target.value)}
                                        >
                                            {materials.map(mat => (
                                                <option key={mat} value={mat}>
                                                    {mat}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            className="material-input"
                                            value={material.value}
                                            onChange={(e) => handleMaterialChange(index, materialIndex, 'value', e.target.value)}
                                        />
                                        <button
                                            className="remove-material-button"
                                            onClick={() => removeMaterial(index, materialIndex)}
                                        >
                                            -
                                        </button>
                                        {calculationDetails[index] && calculationDetails[index][materialIndex] && (
                                    <div className="calculation-details">
                                        <p>Base Value: {calculationDetails[index][materialIndex].baseValue}</p>
                                        <p>Value after 1.3x: {calculationDetails[index][materialIndex].intermediateValue1}</p>
                                        <p>Value after 1.25x: {calculationDetails[index][materialIndex].intermediateValue2}</p>
                                        <p>Rate: {calculationDetails[index][materialIndex].rate || 'Not applied yet'}</p>
                                        <p>Final Value: {calculationDetails[index][materialIndex].finalValue || 'Pending'}</p>
                                    </div>
                                )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={submitMaterialSelection}>Submit</button>
            <button onClick={handleExportPDF} className="export-button">Export PDF</button>

            <div style={{ display: 'none' }}>
                <Quotation ref={quotationPDFRef} />
            </div>
        </div>
    );
};

export default MaterialSelection;


body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
   
}

.container1 {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    max-width: 100%;
    background-color: white;
}

.header {
    text-align: center;
    font-size: 24px;
    margin-bottom: 20px;
    color: #FF1B47;
}

.component-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.component-section-m {
    display: grid;
    grid-template-columns: 50% 50%;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
     background-color: #F6F9FC;
}

.component-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: #FFF;
}

.description {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ccc;
    padding: 0 10px;
}

.component-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: 0 20px;
    padding-bottom: 20px;
}
.component-info-section{
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.component-info-section label{
    font-weight: 500;
    margin-bottom: 8px;
    color: #FF1B47;
}

.component-info-section input{
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 6px;
    border: 1px solid #ccc;
    /* background-color: #f7f9fc; */
    transition: all 0.3s ease;
}

.material-selection {
    padding-left: 20px;
    display: flex;
    flex-direction: column; 
    background-color: #FFF;
}

.add-material-button {
    background-color: #333333;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    align-self: flex-end;
    margin-bottom: 10px;
}

.material-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex-direction: column;
    margin-top: 20px;
    gap: 10px;
    background-color: #FFF;
}

.material-row {
    display: flex;
    gap: 10px;
    align-items: center;
}

.material-select {
    padding: 5px;
}

.material-input {
    width: 100px;
    padding: 5px;
}

.remove-material-button {
    background-color: red;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
}

button {
    background-color: #FF1B47;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-right: 20px;
}

.export-button {
    background-color: #333333;
   
    margin-top: 20px;
}





import React, { useState } from 'react';
import './style.css';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../assets/logo.png';

const FurnitureOrderForm = () => {
  const { id } = useParams(); // Retrieving `id` from URL params.
  const [sections, setSections] = useState([
    {
      itemSelect: '',
      components: [
        {
          unit: '',
          rows: [{ componentName: '', length: '', breadth: '', depth: '', quantity: '', cutsize: '' }],
        },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  // Function to add a new section
  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        itemSelect: '',
        components: [
          {
            unit: '',
            rows: [{ componentName: '', length: '', breadth: '', depth: '', quantity: '', cutsize: '' }],
          },
        ],
      },
    ]);
  };

  const handleRemoveSection = (sectionIndex) => {
    const updatedSections = sections.filter((_, index) => index !== sectionIndex);
    setSections(updatedSections);
  };

  const handleInputChange = (sectionIndex, componentIndex, rowIndex, field, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].components[componentIndex].rows[rowIndex][field] = value;
    setSections(updatedSections);
  };

  const handleUnitChange = (sectionIndex, componentIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].components[componentIndex].unit = value;
    setSections(updatedSections);
  };

  const handleAddComponent = (sectionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].components.push({
      unit: '',
      rows: [{ componentName: '', length: '', breadth: '', depth: '', quantity: '', cutsize: '' }],
    });
    setSections(updatedSections);
  };

  const handleRemoveComponent = (sectionIndex, componentIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].components = updatedSections[sectionIndex].components.filter(
      (_, index) => index !== componentIndex
    );
    setSections(updatedSections);
  };

  const handleAddRow = (sectionIndex, componentIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].components[componentIndex].rows.push({
      componentName: '',
      length: '',
      breadth: '',
      depth: '',
      quantity: '',
      cutsize: '',
    });
    setSections(updatedSections);
  };

  const handleRemoveRow = (sectionIndex, componentIndex, rowIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].components[componentIndex].rows = updatedSections[
      sectionIndex
    ].components[componentIndex].rows.filter((_, i) => i !== rowIndex);
    setSections(updatedSections);
  };

  const handleItemSelectChange = (sectionIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].itemSelect = value;
    setSections(updatedSections);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Formatting sections and components
    const formattedSections = sections.map((section) => ({
      itemSelect: section.itemSelect,
      components: section.components.flatMap((component) =>
        component.rows.map((row) => ({
          unit: component.unit,
          componentName: row.componentName,
          length: row.length,
          breadth: row.breadth,
          depth: row.depth,
          quantity: row.quantity,
          cutsize: row.cutsize,
        }))
      ),
    }));

    try {
      const response = await fetch(`http://localhost:5000/api/components/combined/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: formattedSections, // Send all sections
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setSuccess('Form submitted successfully!');
      
      // Navigate to the material selection page
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
      <div className="button-group">
        <button className="add-section-button" type="button" onClick={handleAddSection}>
          + Add Section
        </button>
        {sections.length > 1 && (
          <button
            className="remove-section-button"
            type="button"
            onClick={() => handleRemoveSection(sections.length - 1)}
          >
            - Remove Section
          </button>
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
                <h3>Item Description & Input Furniture Component</h3>

                <div className="unit-row">
                  <div className="colitem">
                    <label htmlFor={`unitSelect-${sectionIndex}-${componentIndex}`}>
                      Description Name
                    </label>
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
                    <button
                      className="add-button"
                      type="button"
                      onClick={() => handleAddComponent(sectionIndex)}
                    >
                      + Add Component
                    </button>
                    {section.components.length > 1 && (
                      <button
                        className="remove-button"
                        type="button"
                        onClick={() => handleRemoveComponent(sectionIndex, componentIndex)}
                      >
                        - Remove Component
                      </button>
                    )}
                  </div>
                </div>

                {component.rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="component-row">
                    <div className="col">
                      <label htmlFor={`componentName-${sectionIndex}-${componentIndex}-${rowIndex}`}>
                        Component Name
                      </label>
                      <input
                        type="text"
                        className="componentName"
                        placeholder="e.g., Top and Bottom Panel"
                        value={row.componentName}
                        onChange={(e) =>
                          handleInputChange(sectionIndex, componentIndex, rowIndex, 'componentName', e.target.value)
                        }
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
                        onChange={(e) =>
                          handleInputChange(sectionIndex, componentIndex, rowIndex, 'length', e.target.value)
                        }
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`breadth-${sectionIndex}-${componentIndex}-${rowIndex}`}>Breadth (B)</label>
                      <input
                        type="number"
                        className="breadth"
                        placeholder="Enter Breadth"
                        value={row.breadth}
                        onChange={(e) =>
                          handleInputChange(sectionIndex, componentIndex, rowIndex, 'breadth', e.target.value)
                        }
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`depth-${sectionIndex}-${componentIndex}-${rowIndex}`}>Depth (D)</label>
                      <input
                        type="number"
                        className="depth"
                        placeholder="Enter Depth"
                        value={row.depth}
                        onChange={(e) =>
                          handleInputChange(sectionIndex, componentIndex, rowIndex, 'depth', e.target.value)
                        }
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`quantity-${sectionIndex}-${componentIndex}-${rowIndex}`}>Quantity (QTY)</label>
                      <input
                        type="number"
                        className="quantity"
                        placeholder="Enter Quantity"
                        value={row.quantity}
                        onChange={(e) =>
                          handleInputChange(sectionIndex, componentIndex, rowIndex, 'quantity', e.target.value)
                        }
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`cutsize-${sectionIndex}-${componentIndex}-${rowIndex}`}>Cut Size</label>
                      <input
                        type="text"
                        className="cutsize"
                        placeholder="Enter Cut Size"
                        value={row.cutsize}
                        onChange={(e) =>
                          handleInputChange(sectionIndex, componentIndex, rowIndex, 'cutsize', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      {component.rows.length > 1 && (
                        <button
                          className="remove-row-button"
                          type="button"
                          onClick={() => handleRemoveRow(sectionIndex, componentIndex, rowIndex)}
                        >
                          - Remove Row
                        </button>
                      )}
                      <button
                        className="add-row-button"
                        type="button"
                        onClick={() => handleAddRow(sectionIndex, componentIndex)}
                      >
                        + Add Row
                      </button>
                    </div>
                      
                  </div>
                ))}
 
              </div>
            ))}
            <hr />
            
          </div>
        ))}

        <div className="form-buttons">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
};

export default FurnitureOrderForm;

