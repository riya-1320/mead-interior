import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf'; 
import 'jspdf-autotable'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS
import './style.css';
import logo from '../assets/logo.png';
import AddMaterialModal from '../utilities/AddRateMaterial';

const HomePage = () => {
  const [clientName, setClientName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [materials, setMaterials] = useState([
    {
      materialType: '',
      rows: [{ materialName: '', uom: '', rate: '', size: '' }],
    },
  ]);

  const [materialOptions, setMaterialOptions] = useState({});
  const [uomOptions, setUomOptions] = useState({});
  const [rateOptions, setRateOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fetch materials data from the API
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/components/rate-materials', {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch materials data');
        }

        const data = await response.json();

        const materialOpts = {};
        const uomOpts = {};
        const rateOpts = {};

        data.forEach((material) => {
          const materialType = material.material_type;
          materialOpts[materialType] = Object.keys(material.options);

          uomOpts[materialType] = {};
          rateOpts[materialType] = {};

          Object.entries(material.options).forEach(([option, details]) => {
            uomOpts[materialType][option] = details.uom;
            rateOpts[materialType][option] = details.rate;
          });
        });

        setMaterialOptions(materialOpts);
        setUomOptions(uomOpts);
        setRateOptions(rateOpts);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        toast.error('Error fetching materials: ' + error.message);
      }
    };

    fetchMaterials();
  }, [token]);

  const handleAddMaterial = () => {
    setMaterials([
      ...materials,
      {
        materialType: '',
        rows: [{ materialName: '', uom: '', rate: '', size: '' }],
      },
    ]);
  };

  const handleRemoveMaterial = (index) => {
    const updatedMaterials = materials.filter((_, i) => i !== index);
    setMaterials(updatedMaterials);
  };

  const handleAddRow = (materialIndex) => {
    const updatedMaterials = [...materials];
    updatedMaterials[materialIndex].rows.push({
      materialName: '',
      uom: '',
      rate: '',
      size: '',
    });
    setMaterials(updatedMaterials);
  };

  const handleRemoveRow = (materialIndex, rowIndex) => {
    const updatedMaterials = [...materials];
    updatedMaterials[materialIndex].rows = updatedMaterials[
      materialIndex
    ].rows.filter((_, i) => i !== rowIndex);
    setMaterials(updatedMaterials);
  };

  const handleMaterialTypeChange = (materialIndex, value) => {
    if (value === 'add-more') {
      setShowModal(true);
      return;
    }

    const updatedMaterials = [...materials];
    updatedMaterials[materialIndex].materialType = value;
    updatedMaterials[materialIndex].rows.forEach((row) => {
      row.materialName = '';
      row.uom = '';
      row.rate = '';
      row.size = '';
    });
    setMaterials(updatedMaterials);
  };

  const handleMaterialNameChange = (materialIndex, rowIndex, value) => {
    const updatedMaterials = [...materials];
    updatedMaterials[materialIndex].rows[rowIndex].materialName = value;

    const materialType = updatedMaterials[materialIndex].materialType;

    updatedMaterials[materialIndex].rows[rowIndex].uom =
      uomOptions[materialType]?.[value] || '';

    updatedMaterials[materialIndex].rows[rowIndex].rate =
      rateOptions[materialType]?.[value] || '';

    setMaterials(updatedMaterials);
  };

  const handleSizeChange = (materialIndex, rowIndex, value) => {
    const updatedMaterials = [...materials];
    updatedMaterials[materialIndex].rows[rowIndex].size = value;
    setMaterials(updatedMaterials);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quotationResponse = await fetch(
        'http://localhost:5000/api/components/combined/lastQuotationNumber',
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
        }
      );

      const quotationData = await quotationResponse.json();
      const newQuotationNumber = quotationData.newQuotationNumber;

      const formData = {
        quotationNumber: newQuotationNumber,
        clientName,
        clientCode,
        materials,
      };

      const response = await fetch(
        'http://localhost:5000/api/components/combined',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong!');
      }

      toast.success(result.message || 'Form submitted successfully!');
      setLoading(false);
      const { _id } = result;
      navigate(`/furnitureOrderForm/${_id}`);
    } catch (error) {
      setLoading(false);
      toast.error(error.message || 'Failed to submit form!');
    }
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Client Materials Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Client Name: ${clientName}`, 20, 30);
    doc.text(`Client Code: ${clientCode}`, 20, 40);

    let startY = 50;

    materials.forEach((material, materialIndex) => {
      if (!material.materialType) return;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Material Type: ${material.materialType}`, 20, startY);

      const headers = [['Material Name', 'UOM', 'Rate', 'Size']];
      const rows = material.rows.map((row) => [
        row.materialName || 'N/A',
        row.uom || 'N/A',
        row.rate || 'N/A',
        row.size || 'N/A',
      ]);

      doc.autoTable({
        startY: startY + 10,
        head: headers,
        body: rows,
        theme: 'grid',
        styles: { halign: 'center' },
        headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 20, right: 20 },
      });

      startY = doc.autoTable.previous.finalY + 15;
    });

    doc.save('Client_Materials_Report.pdf');
  };


  return (
    <div className="container">
      <div className="header">
        <img src={logo} alt="Logo" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="section client-detail">
          <h3>Client Details</h3>
          <div className="row">
            <div className="colitem">
              <label htmlFor="clientName">Client Name</label>
              <input
                type="text"
                id="clientName"
                className="unitSelect"
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="colitem">
              <label htmlFor="clientCode">Client Code</label>
              <input
                type="text"
                id="clientCode"
                className="unitSelect"
                placeholder="Enter client code"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {materials.map((material, materialIndex) => (
          <div key={materialIndex} className="section materials-section">
            <h3>Materials Rate</h3>

            <div className="unit-row">
              <div className="colitem">
                <label htmlFor={`materialType-${materialIndex}`}>
                  Material Type
                </label>
                <select
                  value={material.materialType}
                  onChange={(e) =>
                    handleMaterialTypeChange(materialIndex, e.target.value)
                  }
                  className="unitSelect"
                  required
                >
                  <option value="">Select material type</option>
                  {Object.keys(materialOptions).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                  <option value="add-more">+ Add more</option>
                </select>
              </div>
              <div>
                <button
                  className="add-button"
                  type="button"
                  onClick={handleAddMaterial}
                >
                  + Add Material
                </button>
                {materials.length > 1 && (
                  <button
                    className="remove-button"
                    type="button"
                    onClick={() => handleRemoveMaterial(materialIndex)}
                  >
                    - Remove Material
                  </button>
                )}
              </div>
            </div>

            {material.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="rate-component-row">
                <div className="col">
                  <label htmlFor={`materialName-${materialIndex}-${rowIndex}`}>
                    Name
                  </label>
                  <select
                    value={row.materialName}
                    onChange={(e) =>
                      handleMaterialNameChange(
                        materialIndex,
                        rowIndex,
                        e.target.value
                      )
                    }
                    className="componentName fixed-width"
                    required
                  >
                    <option value="">Select material name</option>
                    {material.materialType &&
                      materialOptions[material.materialType]?.map(
                        (nameOption) => (
                          <option key={nameOption} value={nameOption}>
                            {nameOption}
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div className="col">
                  <label htmlFor={`uom-${materialIndex}-${rowIndex}`}>
                    UOM
                  </label>
                  <input
                    type="text"
                    id={`uom-${materialIndex}-${rowIndex}`}
                    className="uom"
                    value={row.uom}
                     
                  />
                </div>

                <div className="col">
                  <label htmlFor={`rate-${materialIndex}-${rowIndex}`}>
                    Rate
                  </label>
                  <input
                    type="text"
                    id={`rate-${materialIndex}-${rowIndex}`}
                    className="rate"
                    value={row.rate}
                     
                  />
                </div>

                {( material.materialType === 'wood' ||
                  material.materialType === 'ply' || material.materialType === 'mdf') && (
                <div className="col">
                  <label htmlFor={`size-${materialIndex}-${rowIndex}`}>
                    Size
                  </label>
                  <input
                    type="text"
                    id={`size-${materialIndex}-${rowIndex}`}
                    className="size"
                    placeholder="Enter size"
                    value={row.size}
                    onChange={(e) =>
                      handleSizeChange(materialIndex, rowIndex, e.target.value)
                    }
                     
                  />
                </div>
                )}

                <div className="col rate-button-group">
                  <button
                    className="add-component-button"
                    type="button"
                    onClick={() => handleAddRow( materialIndex)}
                  >
                    +
                  </button>
                  {material.rows.length > 1 && (
                    <button
                      className="remove-component-button"
                      type="button"
                      onClick={() =>
                        handleRemoveRow( materialIndex, rowIndex)
                      }
                    >
                      -
                    </button>
                  )}
                </div>
              </div>
            ))}
 
          </div>
        ))}

        {/* {message && <p className="message">{message}</p>} */}
        {/* {error && <p className="error">{error}</p>} */}

        {/* {materialError && (
          <p className="error">Please select material type first.</p>
        )} */}

       <div className='buttongrp'>
       <button type="submit" className="submit-button">
          Submit
        </button>
       
       </div>
      </form>
     
     <button onClick={handleExportToPDF} className="export-rate-button">
        Export Rate Pdf
      </button> 
     

      {/* Modal for adding materials */}
      <AddMaterialModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
         
      />
    </div>
  );
};

export default HomePage;
