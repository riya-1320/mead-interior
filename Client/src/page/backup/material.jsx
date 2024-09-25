import React, { useEffect, useState, useRef } from "react";
import "./MaterialSelection.css";
import html2pdf from "html2pdf.js";
import { useParams } from "react-router-dom";
import logo from "../assets/logo.png";

import { Quotation } from "./Pdf";

const MaterialSelection = () => {
  const quotationPDFRef = useRef();
  const { id } = useParams();
  const [components, setComponents] = useState([]);
  const [materials, setMaterials] = useState([]); // List of all available materials fetched from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calculationDetails, setCalculationDetails] = useState([]);
  const [editMode, setEditMode] = useState({}); // New state variable to track edit mode

  console.log(components);
  // Fetch components and available materials when the component loads
  useEffect(() => {
    const fetchComponentData = async () => {
      if (!id) {
        setError("No ID found in URL parameters");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/components/combined/${id}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        // Initialize each component with at least one default material
        // Initialize components with default materials if none exist
        const initializedComponents = data.items.flatMap((item) =>
          item.components.map((component) => ({
            ...component,
            itemName: item.itemSelect,
            materials:
              component.materials.length > 0
                ? component.materials
                : [{ material: "", value: "" }],
          }))
        );
        setComponents(initializedComponents);
        setLoading(false);
      } catch (error) {
        setError("Error loading component summary");
        setLoading(false);
      }
    };

    const getMaterials = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/components/materials"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        const materialNames = data.data.map((material) => material.name); // Assuming data.data has materials list
        setMaterials([...new Set(materialNames)]); // Avoid duplicate materials
      } catch (error) {
        setError("Error loading materials");
      }
    };

    fetchComponentData();
    getMaterials();
  }, [id]); // Runs when id changes

  const addMaterial = (index) => {
    const newComponents = [...components];
    newComponents[index].materials.push({
      material: materials[0] || "",
      value: "",
    }); // Default to first material
    setComponents(newComponents);
  };

  const removeMaterial = (index, materialIndex) => {
    const newComponents = [...components];
    newComponents[index].materials.splice(materialIndex, 1); // Remove selected material
    setComponents(newComponents);
  };

  const calculateMaterialValue = (materialName, component) => {
    console.log(materialName, component, "12112121212");
    const { length, breadth, depth, quantity, cutsize } = component;
    console.log(length, breadth, depth, quantity);
    let value = 0;

    // Define the calculation logic for each material type
    switch (materialName) {
      case "OSL - 18mm":
        value = quantity * cutsize * 1.03;
        break;
      case "OSR - 18mm":
        value = quantity * cutsize * 1.03;
        break;
      case "OSL - 8mm":
        value = quantity * cutsize * 1.03;
        break;
      case "BSL - 18mm":
        value = quantity * cutsize * 1.03;
        break;
      case "Sal wood":
        value = quantity * 0.05 * 0.05 * 1.2;
        break;
      case "Hardware":
        value = quantity * 4 * 5;
        console.log(value, "value");
        break;
      case "Lipping":
        value = quantity * (length + breadth) * 2 * 1.05;
        break;
      case "Board cutting":
        value = (quantity * (length + breadth) * 2) / 60;
        break;
      case "Machine":
        value =
          (quantity * (length + breadth) * 2 * 2) / 60 +
          (quantity * 4 * 3 * 0.5) / 60 +
          (quantity * length * 2.5) / 60;
        break;
      case "Foil":
        value =
          quantity * (length * breadth + 0.018 * (length + breadth) * 2) * 1.3;
        break;
      case "Bo":
        value = quantity * cutsize;
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

    if (field === "material") {
      const selectedMaterial = value;
      newComponents[index].materials[materialIndex]["material"] =
        selectedMaterial;

      const baseValue = calculateMaterialValue(
        selectedMaterial,
        newComponents[index]
      );
      const intermediateValue1 = (baseValue * 1.3).toFixed(4);
      const intermediateValue2 = (intermediateValue1 * 1.25).toFixed(4);

      // Store intermediate values and final value for display
      const calculation = {
        baseValue: baseValue,
        intermediateValue1: intermediateValue1,
        intermediateValue2: intermediateValue2,
        rate: null, // Rate will be applied in submit function
        finalValue: null,
      };

      if (!newCalculationDetails[index]) {
        newCalculationDetails[index] = [];
      }
      newCalculationDetails[index][materialIndex] = calculation;

      setCalculationDetails(newCalculationDetails);
      newComponents[index].materials[materialIndex]["value"] =
        intermediateValue2;
    } else {
      newComponents[index].materials[materialIndex][field] = value;
    }

    setComponents(newComponents);
  };

  const submitMaterialSelection = async () => {
    if (!id) {
      setError("No ID found in URL parameters");
      return;
    }

    const cleanedComponents = components
      .map((component) => ({
        ...component,
        materials: component.materials
          .map((material) => ({
            ...material,
            material: material.material || materials[0], // Default to first material if none selected
          }))
          .filter((material) => material.material && material.value), // Filter empty materials
      }))
      .filter((component) => component.materials.length > 0);

    try {
      const response = await fetch(
        `http://localhost:5000/api/components/combined/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ components: cleanedComponents }),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await response.json();
      console.log("API Response:", result);

      // Loop through materials and apply the rate
      const updatedCalculationDetails = [...calculationDetails];
      components.forEach((component, index) => {
        component.materials.forEach((material, materialIndex) => {
          let materialRate = 0;

          result.materials.forEach((materialType) => {
            materialType.rows.forEach((row) => {
              if (row.materialName === material.material) {
                materialRate = row.rate;
              }
            });
          });

          const calculation = updatedCalculationDetails[index][materialIndex];
          calculation.rate = materialRate;
          calculation.finalValue = (
            parseFloat(calculation.intermediateValue2) * materialRate
          ).toFixed(4);

          // Update component value with final calculated value
          material.value = calculation.finalValue;
        });
      });

      setCalculationDetails(updatedCalculationDetails);
      setComponents(components);

      alert("Material Selection Submitted and Calculated Successfully!");
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
          filename: "quotation.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, logging: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(element)
        .toPdf()
        .get("pdf")
        .then((pdf) => {
          const pageCount = pdf.internal.getNumberOfPages();
          const logoWidth = 50;
          const logoHeight = 20;
          const img = logo;

          for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.addImage(img, "PNG", 10, 10, logoWidth, logoHeight);
          }
        })
        .save();
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

 

  const handleEdit = (index) => {
    setEditMode({ ...editMode, [index]: true });
  };

  const handleSave = async (index) => {
    setEditMode({ ...editMode, [index]: false });

    // Prepare the furniture details (component to be updated) at the specified index
    const componentToUpdate = components[index];

    try {
      // Call the PUT API to update the component data at `/furniture-details/:id`
      const response = await fetch(
        `http://localhost:5000/api/components/combined-details/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemSelect: componentToUpdate.itemSelect,
            components: [
              {
                unit: componentToUpdate.unit,
                componentName: componentToUpdate.componentName,
                length: componentToUpdate.length,
                breadth: componentToUpdate.breadth,
                depth: componentToUpdate.depth,
                quantity: componentToUpdate.quantity,
                cutsize: componentToUpdate.cutsize,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update furniture details");
      }

      const updatedData = await response.json();
      console.log("Updated Component:", updatedData);
      alert("Furniture details updated successfully!");
      window.location.reload();
    } catch (error) {
      setError(`Error updating furniture details: ${error.message}`);
    }
  };

  const handleComponentChange = (index, field, value) => {
    const newComponents = [...components];
    newComponents[index][field] = value;
    setComponents(newComponents);
  };

  const groupByItemName = (components) => {
    return components.reduce((acc, component) => {
      const { itemName } = component;
      if (!acc[itemName]) {
        acc[itemName] = [];
      }
      acc[itemName].push(component);
      return acc;
    }, {});
  };
  const groupedComponents = groupByItemName(components);

  return (
    <div className="container1">
      <div className="header">
        <img src={logo} alt="Logo" />
      </div>
  
      <div className="component-list">
        {Object.keys(groupedComponents).map((itemName, sectionIndex) => (
          <div key={sectionIndex} className="component-section-m">
            <div className="item-name-section">
              <h2>{itemName}</h2>
            </div>
  
            {groupedComponents[itemName].map((component, index) => (
              <div key={index} className="component-details">
                <div>
                <div className="description">
                  <h3>{component.unit}</h3>
                  {editMode[index] ? (
                    <button
                      className="save-button"
                      onClick={() => handleSave(index)}
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(index)}
                    >
                      Edit
                    </button>
                  )}
                </div>
  
                <div className="component-info">
                  <div className="component-info-section">
                    <label>Component</label>
                    {editMode[index] ? (
                      <input
                        type="text"
                        value={component.componentName}
                        onChange={(e) =>
                          handleComponentChange(index, "componentName", e.target.value)
                        }
                      />
                    ) : (
                      <input type="text" value={component.componentName} readOnly />
                    )}
                  </div>
                  <div className="component-info-section">
                    <label>Length</label>
                    {editMode[index] ? (
                      <input
                        type="text"
                        value={component.length}
                        onChange={(e) =>
                          handleComponentChange(index, "length", e.target.value)
                        }
                      />
                    ) : (
                      <input type="text" value={component.length} readOnly />
                    )}
                  </div>
                  <div className="component-info-section">
                    <label>Breadth</label>
                    {editMode[index] ? (
                      <input
                        type="text"
                        value={component.breadth}
                        onChange={(e) =>
                          handleComponentChange(index, "breadth", e.target.value)
                        }
                      />
                    ) : (
                      <input type="text" value={component.breadth} readOnly />
                    )}
                  </div>
                  <div className="component-info-section">
                    <label>Depth</label>
                    {editMode[index] ? (
                      <input
                        type="text"
                        value={component.depth}
                        onChange={(e) =>
                          handleComponentChange(index, "depth", e.target.value)
                        }
                      />
                    ) : (
                      <input type="text" value={component.depth} readOnly />
                    )}
                  </div>
                  <div className="component-info-section">
                    <label>Quantity</label>
                    {editMode[index] ? (
                      <input
                        type="text"
                        value={component.quantity}
                        onChange={(e) =>
                          handleComponentChange(index, "quantity", e.target.value)
                        }
                      />
                    ) : (
                      <input type="text" value={component.quantity} readOnly />
                    )}
                  </div>
                  <div className="component-info-section">
                    <label>CutSize</label>
                    {editMode[index] ? (
                      <input
                        type="text"
                        value={component.cutsize}
                        onChange={(e) =>
                          handleComponentChange(index, "cutsize", e.target.value)
                        }
                      />
                    ) : (
                      <input type="text" value={component.cutsize} readOnly />
                    )}
                  </div>
                </div>
                    </div>
  
                <div className="material-selection">
                  <div className="description">
                    <h3>Select Material</h3>
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
                        <div className="material-row-info">
                          <select
                            className="material-select"
                            value={material.material}
                            onChange={(e) =>
                              handleMaterialChange(index, materialIndex, "material", e.target.value)
                            }
                          >
                            {materials.map((mat) => (
                              <option key={mat} value={mat}>
                                {mat}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className="material-input"
                            value={material.value}
                            onChange={(e) =>
                              handleMaterialChange(index, materialIndex, "value", e.target.value)
                            }
                          />
                          <button
                            className="remove-material-button"
                            onClick={() => removeMaterial(index, materialIndex)}
                          >
                            -
                          </button>
                        </div>
                        {calculationDetails[index] &&
                          calculationDetails[index][materialIndex] && (
                            <div className="calculation-details">
                              <p>
                                Base Value:{" "}
                                {calculationDetails[index][materialIndex].baseValue}
                              </p>
                              <p>
                                Value after 1.3x:{" "}
                                {calculationDetails[index][materialIndex].intermediateValue1}
                              </p>
                              <p>
                                Value after 1.25x:{" "}
                                {calculationDetails[index][materialIndex].intermediateValue2}
                              </p>
                              <p>
                                Rate:{" "}
                                {calculationDetails[index][materialIndex].rate ||
                                  "Not applied yet"}
                              </p>
                              <p>
                                Final Value:{" "}
                                {calculationDetails[index][materialIndex].finalValue || "Pending"}
                              </p>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <button onClick={submitMaterialSelection}>Submit</button>
      <button onClick={handleExportPDF} className="export-button">
        Export PDF
      </button>
  
      <div style={{ display: "none" }}>
        <Quotation ref={quotationPDFRef} />
      </div>
    </div>
  );
}

export default MaterialSelection;