import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
  } from "react";
  import "./MaterialSelection.css";
  import html2pdf from "html2pdf.js";
  import { useParams } from "react-router-dom";
  import logo from "../assets/logo.png";
  
  const MaterialSelection = () => {
    const quotationPDFRef = useRef();
    const { id } = useParams();
    const [components, setComponents] = useState([]);
    const [materials, setMaterials] = useState([]); // Available materials from API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [calculationDetails, setCalculationDetails] = useState({});
    const [editMode, setEditMode] = useState({});
    const [totalSum, setTotalSum] = useState(0);
    const [materialRates, setMaterialRates] = useState({});
  
    const materialOptions = useMemo(
      () =>
        materials
          .filter((material) => material.rate !== undefined) // Filter only materials with rates
          .map((material) => (
            <option key={material.materialName} value={material.materialName}>
              {material.materialName}
            </option>
          )),
      [materials]
    );
  
    useEffect(() => {
      if (!id) {
        setError("No ID found in URL parameters");
        setLoading(false);
        return;
      }
  
      const fetchData = async () => {
        try {
          const [componentResponse, materialResponse] = await Promise.all([
            fetch(`http://localhost:5000/api/components/combined/${id}`),
            fetch(`http://localhost:5000/api/components/materials`),
          ]);
  
          if (!componentResponse.ok || !materialResponse.ok) {
            throw new Error("Network response failed");
          }
  
          const componentData = await componentResponse.json();
          const materialData = await materialResponse.json();
  
          // Extract and map material rates from the fetched data
          const materialRates = {};
          componentData.materials.forEach((materialGroup) => {
            materialGroup.rows.forEach((row) => {
              materialRates[row.materialName] = row.rate;
            });
          });
  
          const availableMaterials = componentData.materials.flatMap(
            (materialGroup) =>
              materialGroup.rows.map((row) => ({
                materialName: row.materialName,
                rate: row.rate,
              }))
          );
  
          setMaterials(availableMaterials); // Set only materials with rates from the API response
          setMaterialRates(materialRates);
  
          const initializedComponents = componentData.items.flatMap((item) => [
            ...item.components.map((component) => ({
              ...component,
              itemName: item.itemSelect,
              materials:
                component.materials.length > 0
                  ? component.materials
                  : [{ material: "", value: "" }],
              isBo: false,
            })),
            ...item.bo.map((bo) => ({
              ...bo,
              itemName: item.itemSelect,
              materials: [{ material: "", value: "" }],
              isBo: true, // Set isBo flag for B/O components
            })),
          ]);
  
          setComponents(initializedComponents);
          setLoading(false);
        } catch (error) {
          setError("Error loading data");
          setLoading(false);
        }
      };
  
      fetchData();
    }, [id]);
  
    const calculateMaterialValue = useCallback(
      (materialName, { quantity, cutsize, length, breadth }) => {
        let value = 0;
  
        const materialCalculations = {
          "OSL - 18mm": () => quantity * cutsize * 1.03,
          "OSR - 18mm": () => quantity * cutsize * 1.03,
          "Sal Wood": () => quantity * 0.05 * 0.05 * 1.2,
          Hardware: () => quantity * 4 * 5,
          Lipping: () => quantity * (length + breadth) * 2 * 1.05,
          "Board cutting": () => (quantity * (length + breadth) * 2) / 60,
          Machine: () =>
            (quantity * (length + breadth) * 2 * 2) / 60 +
            (quantity * 4 * 3 * 0.5) / 60 +
            (quantity * length * 2.5) / 60,
          Foil: () =>
            quantity * (length * breadth + 0.018 * (length + breadth) * 2) * 1.3,
          default: () => quantity * cutsize,
        };
  
        value = materialCalculations[materialName]
          ? materialCalculations[materialName]()
          : 0;
        const rate = materialRates[materialName] || 0;
        const intermediateValue2 = (value * rate).toFixed(4);
  
        // Print details to console
        console.log(`Material: ${materialName}`);
        console.log(`Quantity: ${quantity}`);
        console.log(`Cutsize: ${cutsize}`);
        console.log(`Length: ${length}`);
        console.log(`Breadth: ${breadth}`);
        console.log(`Base Value: ${value}`);
        console.log(`Rate: ${rate}`);
        console.log(`Intermediate Value 2: ${intermediateValue2}`);
  
        return intermediateValue2;
      },
      [materialRates]
    );
  
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
  
    const handleMaterialChange = useCallback(
      (index, materialIndex, field, value, isBo = false) => {
        const updatedComponents = [...components];
        updatedComponents[index].materials[materialIndex][field] = value;
  
        if (field === "material") {
          const baseValue = calculateMaterialValue(
            value,
            updatedComponents[index]
          );
          const intermediateValue1 = (baseValue * 1.3).toFixed(4);
          const intermediateValue2 = (intermediateValue1 * 1.25).toFixed(4);
  
          const updatedCalculationDetails = { ...calculationDetails };
          updatedCalculationDetails[index] =
            updatedCalculationDetails[index] || {};
          updatedCalculationDetails[index][materialIndex] = {
            baseValue,
            intermediateValue1,
            intermediateValue2,
            rate: materialRates[value] || null,
            finalValue: intermediateValue2,
          };
  
          setCalculationDetails(updatedCalculationDetails);
          updatedComponents[index].materials[materialIndex].value =
            intermediateValue2;
        }
  
        setComponents(updatedComponents);
        updateTotalSum(updatedComponents);
      },
      [components, calculationDetails, calculateMaterialValue, materialRates]
    );
  
    const updateTotalSum = (components) => {
      const sum = components.reduce((acc, component) => {
        const componentSum = component.materials.reduce(
          (materialAcc, material) => {
            return materialAcc + (parseFloat(material.value) || 0);
          },
          0
        );
        return acc + componentSum;
      }, 0);
  
      setTotalSum(sum.toFixed(4));
    };
   
  
   
  
    const submitMaterialSelection = async () => {
      if (!id) return setError("No ID found");
  
      const cleanedComponents = components.map((component) => ({
        ...component,
        materials: component.materials.filter((mat) => mat.material && mat.value),
      }));
  
      try {
        const response = await fetch(
          `http://localhost:5000/api/components/combined/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ components: cleanedComponents }),
          }
        );
  
        if (!response.ok) throw new Error("Submission failed");
  
        await response.json();
        alert("Materials submitted successfully");
      } catch (error) {
        setError(`Submission error: ${error.message}`);
      }
    };
  
    const handleEditSave = async () => {
      if (!id) return setError("No ID found");
  
      // Separate items based on their type (component or bo)
      const items = components.reduce((acc, component) => {
        const itemIndex = acc.findIndex(
          (item) => item.itemSelect === component.itemName
        );
        const componentCopy = { ...component };
  
        if (component.isBo) {
          // If component is a B/O item, push to B/O array
          if (itemIndex === -1) {
            acc.push({
              itemSelect: component.itemName,
              components: [],
              bo: [componentCopy],
            });
          } else {
            acc[itemIndex].bo.push(componentCopy);
          }
        } else {
          // If regular component, push to components array
          if (itemIndex === -1) {
            acc.push({
              itemSelect: component.itemName,
              components: [componentCopy],
              bo: [],
            });
          } else {
            acc[itemIndex].components.push(componentCopy);
          }
        }
        return acc;
      }, []);
  
      try {
        const response = await fetch(
          `http://localhost:5000/api/components/combined-details/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          }
        );
  
        if (!response.ok) throw new Error("Update failed");
  
        await response.json();
        alert("Changes saved successfully");
  
        // Update state with correctly structured data
        setComponents((prevComponents) => {
          // Ensure data structure is maintained
          return prevComponents.map((comp) => ({
            ...comp,
            isBo: !!comp.isBo, // Maintain isBo flag
          }));
        });
      } catch (error) {
        setError(`Update error: ${error.message}`);
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
  
    const handleBoMaterialChange = useCallback(
      (boIndex, materialIndex, field, value, itemName) => { // Add itemName as a parameter
        const updatedComponents = [...components];
        const boComponent = updatedComponents.find(comp => comp.isBo && comp.itemName === itemName); // Use itemName correctly
    
        if (boComponent) {
          boComponent.materials[materialIndex][field] = value;
    
          if (field === "materialname") {
            const baseValue = calculateMaterialValue(value, boComponent);
            const intermediateValue1 = (baseValue * 1.3).toFixed(4);
            const intermediateValue2 = (intermediateValue1 * 1.25).toFixed(4);
    
            boComponent.materials[materialIndex].value = intermediateValue2;
    
            const updatedCalculationDetails = { ...calculationDetails };
            updatedCalculationDetails[boIndex] = updatedCalculationDetails[boIndex] || {};
            updatedCalculationDetails[boIndex][materialIndex] = {
              baseValue,
              intermediateValue1,
              intermediateValue2,
              rate: materialRates[value] || null,
              finalValue: intermediateValue2,
            };
    
            setCalculationDetails(updatedCalculationDetails);
          }
    
          setComponents(updatedComponents);
          updateTotalSum(updatedComponents);
        }
      },
      [components, calculationDetails, calculateMaterialValue, materialRates]
    );
    
    const addBoMaterial = (boIndex, itemName) => {
      const newComponents = [...components];
      const boComponent = newComponents.find(comp => comp.isBo && comp.itemName === itemName);
      
      if (boComponent) {
        boComponent.materials.push({
          materialname: materials[0] || "",
          value: "",
        });
        setComponents(newComponents);
      }
    };
    const removeBoMaterial = (boIndex, materialIndex, itemName) => {
      const newComponents = [...components];
      const boComponent = newComponents.find(comp => comp.isBo && comp.itemName === itemName);
    
      if (boComponent) {
        boComponent.materials.splice(materialIndex, 1); // Remove the selected material
        setComponents(newComponents);
      }
    };
    
    
  
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
  
    const groupedComponents = components.reduce((acc, component) => {
      const { itemName, isBo } = component;
      if (!acc[itemName]) {
        acc[itemName] = { components: [], bo: [] };
      }
      if (isBo) {
        acc[itemName].bo.push(component);
      } else {
        acc[itemName].components.push(component);
      }
      return acc;
    }, {});
  
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
  
    return (
      <div className="container1">
        <div className="header">
          <img src={logo} alt="Logo" />
        </div>
  
        <div className="component-list">
          {Object.keys(groupedComponents).map((itemName) => (
            <div key={itemName} className="component-section">
              <h2 className="item-name">{itemName}</h2>
  
              {/* Components Section */}
              <div className="components-detail">
                {groupedComponents[itemName].components.map(
                  (component, index) =>
                    !component.isBo && (
                      <div key={index} className="component-two-column">
                        <div className="component-details">
                          <div className="component-info-header">
                            <h3>{component.unit}</h3>
                            <button
                              className={
                                editMode[itemName + index]
                                  ? "save-button button-25"
                                  : "edit-button button-25"
                              }
                              onClick={() => {
                                if (editMode[itemName + index]) {
                                  handleEditSave();
                                }
                                setEditMode({
                                  ...editMode,
                                  [itemName + index]: !editMode[itemName + index],
                                });
                              }}
                            >
                              {editMode[itemName + index] ? "Save" : "Edit"}
                            </button>
                          </div>
  
                          <div className="component-info-body">
                            {[
                              "componentName",
                              "length",
                              "breadth",
                              "depth",
                              "quantity",
                              "cutsize",
                            ].map((field) => (
                              <div key={field} className="component-info-section">
                                <label>
                                  {field.charAt(0).toUpperCase() + field.slice(1)}
                                </label>
                                <input
                                  type="text"
                                  className="input"
                                  value={component[field]}
                                  readOnly={!editMode[itemName + index]}
                                  onChange={(e) =>
                                    setComponents(
                                      components.map((comp, i) =>
                                        i === index
                                          ? { ...comp, [field]: e.target.value }
                                          : comp
                                      )
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
  
                        <div className="material-selection">
                          <div className="component-info-header">
                            <h3>Select Material</h3>
                            <button
                              className="button-25"
                              onClick={() => addMaterial(index)}
                            >
                              + Add Material
                            </button>
                          </div>
  
                          {component.materials.map((material, materialIndex) => (
                            <div key={materialIndex} className="material-row">
                              <select
                                className="select"
                                value={material.material}
                                onChange={(e) =>
                                  handleMaterialChange(
                                    index,
                                    materialIndex,
                                    "material",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">Select Material</option>
                                {materialOptions}
                              </select>    
  
                              <input
                                type="text"
                                className="input"
                                value={material.value}
                                onChange={(e) =>
                                  handleMaterialChange(
                                    index,
                                    materialIndex,
                                    "value",
                                    e.target.value
                                  )
                                }
                                readOnly
                              />
                              <button
                                onClick={() =>
                                  removeMaterial(index, materialIndex)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
  
              {groupedComponents[itemName].bo.map(
                (boComponent, boIndex) =>
                  boComponent.isBo && (
                    <div key={boIndex} className="component-two-column">
                      <div className="component-details">
                        <div className="component-info-header">
                          <h3>B/O</h3>
                          <button
                            className={
                              editMode["bo" + boIndex]
                                ? "save-button button-25"
                                : "edit-button button-25"
                            }
                            onClick={() => {
                              if (editMode["bo" + boIndex]) {
                                handleEditSave(); // Call the save function
                              }
                              setEditMode({
                                ...editMode,
                                ["bo" + boIndex]: !editMode["bo" + boIndex],
                              });
                            }}
                          >
                            {editMode["bo" + boIndex] ? "Save" : "Edit"}
                          </button>
                        </div>
  
                        <div className="component-info-body">
                          {["materialname", "quantity", "cutsize"].map(
                            (field) => (
                              <div key={field} className="component-info-section">
                                <label>
                                  {field.charAt(0).toUpperCase() + field.slice(1)}
                                </label>
                                <input
                                  type="text"
                                  className="input"
                                  value={boComponent[field]}
                                  readOnly={!editMode["bo" + boIndex]}
                                  onChange={(e) => {
                                    const updatedBoComponents = [
                                      ...groupedComponents[itemName].bo,
                                    ];
                                    updatedBoComponents[boIndex][field] =
                                      e.target.value;
  
                                    // Update the components state
                                    setComponents((prevComponents) => {
                                      const newComponents = [...prevComponents];
                                      const itemIndex = newComponents.findIndex(
                                        (item) => item.itemSelect === itemName
                                      );
  
                                      if (itemIndex !== -1) {
                                        newComponents[itemIndex].bo =
                                          updatedBoComponents; // Update B/O items correctly
                                      }
  
                                      return newComponents;
                                    });
                                  }}
                                />
                              </div>
                            )
                          )}
                        </div>
                      </div>
  
                      <div className="material-selection">
                        <div className="component-info-header">
                          <h3>Select Material</h3>
                          <button
                            className="button-25"
                            onClick={() => addBoMaterial(boIndex, itemName)} 
                          >
                            + Add Material
                          </button>
                        </div>
  
                        {boComponent.materials.map((material, materialIndex) => (
                          <div key={materialIndex} className="material-row">
                            <select
                className="select"
                value={material.materialname}
                onChange={(e) =>
                  handleBoMaterialChange(
                    boIndex,
                    materialIndex,
                    "materialname",
                    e.target.value
                  )
                }
              >
                              <option value="">Select Material</option>
                              {materialOptions}
                            </select>
  
                            <input
                type="text"
                className="input"
                value={material.value}
                readOnly
              />
                            <button
                               onClick={() => removeBoMaterial(boIndex, materialIndex, itemName)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default MaterialSelection;
  