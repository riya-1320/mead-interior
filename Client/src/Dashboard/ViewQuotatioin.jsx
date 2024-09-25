import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
  } from "react";
  import "../page/MaterialSelection.css";
  import html2pdf from "html2pdf.js";
  import { useParams } from "react-router-dom";
  import logo from "../assets/logo.png";
  
  const ViesMaterialSelection = ({onExportPDF}) => {
    const quotationPDFRef = useRef();
    const { id } = useParams();
    const [materials, setMaterials] = useState([]);
    const [materialRates, setMaterialRates] = useState({});
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [totalSum, setTotalSum] = useState(0);
    const [editMode, setEditMode] = useState({});
    const [editableItems, setEditableItems] = useState({}); // To track editable state
    const [editableBOItems, setEditableBOItems] = useState({});
    const [itemWiseTotals, setItemWiseTotals] = useState({});
    const [manualMaterialValues, setManualMaterialValues] = useState({});
    const [manualBOMaterialValues, setManualBOMaterialValues] = useState({});
  
    const materialOptions = useMemo(
      () =>
        materials.map((material) => (
          <option key={material.materialName} value={material.materialName}>
            {material.materialName}
          </option>
        )),
      [materials]
    );
  
    const token = localStorage.getItem("token");
    useEffect(() => {
      if (!id) {
        setError("No ID found in URL parameters");
        setLoading(false);
        return;
      }
  
      const fetchData = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/components/combined/${id}`,
            {
              headers: {
                "Content-Type": "application/json",
                "x-auth-token": token,
              },
            }
          );
          if (!response.ok) throw new Error("Network response failed");
  
          const data = await response.json();
  
          // Process materials
          const availableMaterials = [];
          const rates = {};
  
          data.materials.forEach((materialGroup) => {
            materialGroup.rows.forEach((row) => {
              availableMaterials.push({
                materialName: row.materialName,
                rate: row.rate,
              });
              rates[row.materialName] = row.rate; // Store rates in a dictionary
            });
          });
  
          setMaterials(availableMaterials);
          setMaterialRates(rates);
  
          // Process items and ensure at least one material per component and BO
          const structuredItems = data.items.map((item) => ({
            ...item,
            components: item.components.map((component) => ({
              ...component,
              materials:
                component.materials.length > 0
                  ? component.materials
                  : [{ material: "", value: "" }],
            })),
            bo: item.bo.map((boItem) => ({
              ...boItem,
              materials:
                boItem.materials.length > 0
                  ? boItem.materials
                  : [{ material: "", value: "" }],
            })),
          }));
  
          setItems(structuredItems);
        } catch (error) {
          setError("Error loading data");
        } finally {
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
          "OSL - 8mm": () => quantity * cutsize * 1.03,
          "OSR - 8mm": () => quantity * cutsize * 1.03,
          "OSL - 6mm": () => quantity * cutsize * 1.03,
          "BSL - 18mm" : ()=> quantity * cutsize * 1.03,
          "Foil" : () => quantity*(length*breadth+0.018*(length+breadth)*2)*1.3,
          "Wood cutting" :() => quantity * length/60,
          "Board cutting" :() => quantity * (length + breadth)* 2/60,
          "Bo": () => quantity*cutsize, 
          "Sal Wood": () => quantity * 0.05 * 0.05 * 1.2,
          "Installation" : () => 1,
          "OSR - 25mm": () => quantity * cutsize * 1.03,
          "OSL - 25mm": () => quantity * cutsize * 1.03,
          // "OSR - 8mm": () => quantity * cutsize * 1.03,
          "BSR - 18mm": () =>quantity*((length*breadth*2*1.2)+(breadth*2+length)*0.05 * 1.2),
          "Joinery" : () => 1,
          "BO" : () => quantity*cutsize,
          Hardware: () => quantity * 4 * 5,
          Lipping: () => quantity * (length + breadth) * 2 * 1.05,
          Machine: () =>
            (quantity * (length + breadth) * 2 * 2) / 60 +
            (quantity * 4 * 3 * 0.5) / 60 +
            (quantity * length * 2.5) / 60,
          
          default: () => quantity * cutsize,
        };
  
        value = materialCalculations[materialName]
          ? materialCalculations[materialName]()
          : 0;
        const rate = materialRates[materialName] || 0;
        if(materialName === "BO"){
          return (value * rate*1.15*1).toFixed(4);
        }else{
          return (value * rate*1.3*1.25).toFixed(4);
        }
        
      },
      [materialRates]
    );
  
    const addMaterial = (itemIndex, componentIndex, isBo = false) => {
      const updatedItems = [...items];
      const newMaterial = {
        material: "",
        value: "",
      };
      if (isBo) {
        updatedItems[itemIndex].bo[componentIndex].materials.push(newMaterial);
      } else {
        updatedItems[itemIndex].components[componentIndex].materials.push(
          newMaterial
        );
      }
      setItems(updatedItems);
    };
  
    const removeMaterial = (
      itemIndex,
      componentIndex,
      materialIndex,
      isBo = false
    ) => {
      const updatedItems = [...items];
      let removedValue = 0;
  
      if (isBo) {
        removedValue =
          parseFloat(
            updatedItems[itemIndex].bo[componentIndex].materials[materialIndex]
              .value
          ) || 0;
        updatedItems[itemIndex].bo[componentIndex].materials.splice(
          materialIndex,
          1
        );
      } else {
        removedValue =
          parseFloat(
            updatedItems[itemIndex].components[componentIndex].materials[
              materialIndex
            ].value
          ) || 0;
        updatedItems[itemIndex].components[componentIndex].materials.splice(
          materialIndex,
          1
        );
      }
  
      setItems(updatedItems);
  
      // Update the total sum by subtracting the removed material value
      updateTotalSum(updatedItems, removedValue);
    };
    const handleMaterialChange = useCallback(
      (itemIndex, componentIndex, materialIndex, field, value, isBo = false) => {
        const updatedItems = [...items];
        const target = isBo
          ? updatedItems[itemIndex].bo[componentIndex]
          : updatedItems[itemIndex].components[componentIndex];
  
        if (field === "material") {
          target.materials[materialIndex].material = value;
          const baseValue = calculateMaterialValue(value, target);
          target.materials[materialIndex].value = baseValue;
  
          // Clear manual entry if material selected
          if (isBo) {
            setManualBOMaterialValues((prev) => {
              const newManualBOMaterialValues = { ...prev };
              delete newManualBOMaterialValues[
                `${itemIndex}-${componentIndex}-${materialIndex}`
              ];
              return newManualBOMaterialValues;
            });
          } else {
            setManualMaterialValues((prev) => {
              const newManualMaterialValues = { ...prev };
              delete newManualMaterialValues[
                `${itemIndex}-${componentIndex}-${materialIndex}`
              ];
              return newManualMaterialValues;
            });
          }
        } else if (field === "value") {
          // Manual value entry
          target.materials[materialIndex].value = value;
          if (isBo) {
            setManualBOMaterialValues((prev) => ({
              ...prev,
              [`${itemIndex}-${componentIndex}-${materialIndex}`]: value,
            }));
          } else {
            setManualMaterialValues((prev) => ({
              ...prev,
              [`${itemIndex}-${componentIndex}-${materialIndex}`]: value,
            }));
          }
        } else if (field === "cutsize") {
          // Update cutsize value and recalculate material value
          target.cutsize = value;
          const materialValue = calculateMaterialValue(
            target.materials[materialIndex].material,
            target
          );
          target.materials[materialIndex].value = materialValue;
        }
  
        setItems(updatedItems);
        updateTotalSum(updatedItems); // Update the total sum here
      },
      [items, calculateMaterialValue]
    );
  
    const updateTotalSum = (itemsData) => {
      let sum = 0; // Initialize sum as a number
  
      itemsData.forEach((item, itemIndex) => {
        let componentSum = 0;
  
        // Summing components
        item.components.forEach((component, componentIndex) => {
          let materialSum = 0;
  
          component.materials.forEach((material, materialIndex) => {
            // Unique key to track manual values
            const key = `${itemIndex}-${componentIndex}-${materialIndex}`;
            const manualValue = manualMaterialValues[key];
  
            // Use manual value if defined, otherwise use material.value
            let materialValue =
              manualValue !== undefined
                ? parseFloat(manualValue)
                : parseFloat(material.value) || 0;
            console.log(
              `Key: ${key}, Manual Value: ${manualValue}, Material Value: ${material.value}, Material Used: ${materialValue}`
            );
  
            // Ensure the material value is a number
            if (isNaN(materialValue)) {
              materialValue = 0; // Handle invalid numbers
            }
  
            materialSum += materialValue;
          });
  
          componentSum += materialSum;
        });
  
        // Summing B/O items
        let boSum = 0;
        item.bo.forEach((boItem, boIndex) => {
          let materialSum = 0;
  
          boItem.materials.forEach((material, materialIndex) => {
            // Unique key to track manual values for B/O
            const key = `${itemIndex}-${boIndex}-${materialIndex}`;
            const manualValue = manualMaterialValues[key];
  
            // Use manual value if defined, otherwise use material.value
            let materialValue =
              manualValue !== undefined
                ? parseFloat(manualValue)
                : parseFloat(material.value) || 0;
  
            // Ensure the material value is a number
            if (isNaN(materialValue)) {
              materialValue = 0; // Handle invalid numbers
            }
  
            materialSum += materialValue;
          });
  
          boSum += materialSum;
        });
  
        // Adding the sums of components and B/O for the current item
        sum += componentSum + boSum;
      });
  
      console.log("Total Sum (Before toFixed):", sum);
  
      // Ensure sum is a valid number before using toFixed
      if (typeof sum !== "number" || isNaN(sum)) {
        sum = 0; // Handle unexpected cases
      }
  
      setTotalSum(sum.toFixed(4)); // Ensure the total sum is formatted correctly
    };
  
    const calculateItemWiseTotals = useCallback(() => {
      const totals = {};
  
      items.forEach((item) => {
        let itemTotal = 0;
  
        item.components.forEach((component) => {
          const componentCost = component.materials.reduce((acc, material) => {
            const materialValue = parseFloat(material.value) || 0;
            return acc + materialValue; // Ensure this uses the same value as global total
          }, 0);
          itemTotal += componentCost;
        });
  
        item.bo.forEach((boItem) => {
          const boCost = boItem.materials.reduce((acc, material) => {
            const materialValue = parseFloat(material.value) || 0;
            return acc + materialValue; // Ensure consistency here
          }, 0);
          itemTotal += boCost;
        });
  
        totals[item.itemSelect] = itemTotal.toFixed(4);
      });
  
      setItemWiseTotals(totals);
    }, [items]);
  
    useEffect(() => {
      updateTotalSum(items);
      calculateItemWiseTotals();
    }, [items, calculateItemWiseTotals]);
  
    const submitMaterialSelection = async () => {
      if (!id) return setError("No ID found");
  
      const cleanedItems = items.map((item) => {
        // Calculate total amount for the item
        const totalAmount =
          item.components.reduce((total, component) => {
            const componentCost = component.materials.reduce((acc, material) => {
              return acc + (parseFloat(material.value) || 0);
            }, 0);
            return total + componentCost;
          }, 0) +
          item.bo.reduce((total, boItem) => {
            const boCost = boItem.materials.reduce((acc, material) => {
              return acc + (parseFloat(material.value) || 0);
            }, 0);
            return total + boCost;
          }, 0);
  
        return {
          ...item,
          totalAmount, // Add total amount to item
          components: item.components.map((component) => ({
            ...component,
            materials: component.materials.filter(
              (mat) => mat.material && mat.value
            ),
          })),
          bo: item.bo.map((boItem) => ({
            ...boItem,
            materials: boItem.materials.filter(
              (mat) => mat.material && mat.value
            ),
          })),
        };
      });
  
      try {
          console.log("here",cleanedItems);
        const response = await fetch(
          `http://localhost:5000/api/components/combined/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json",
            'x-auth-token': token},
            body: JSON.stringify({ items: cleanedItems }),
          }
        );
  
        if (!response.ok) throw new Error("Submission failed");
  
        await response.json();
        alert("Materials submitted successfully");
        window.location.reload();
      } catch (error) {
        setError(`Submission error: ${error.message}`);
      }
    };
  
    const toggleEditMode = (itemIndex, componentIndex) => {
      setEditableItems((prev) => ({
        ...prev,
        [`${itemIndex}-${componentIndex}`]:
          !prev[`${itemIndex}-${componentIndex}`],
      }));
    };
  
    const saveChanges = async (itemIndex, componentIndex) => {
      const updatedComponent = items[itemIndex].components[componentIndex];
      const updatedItems = [...items];
  
      // Here you might want to include validation before sending
      try {
        const response = await fetch(
          `http://localhost:5000/api/components/combined-details/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" ,
            'x-auth-token': token},
            body: JSON.stringify({ items: updatedItems }), // Use updatedItems as needed
          }
        );
  
        if (!response.ok) throw new Error("Submission failed");
        await response.json();
        alert("Changes saved successfully");
  
        // Reset selected material field and recalculate total sum
        updatedItems[itemIndex].components[componentIndex].materials.forEach(
          (material) => {
            material.material = "";
            material.value = "";
          }
        );
        setItems(updatedItems);
        updateTotalSum(updatedItems);
  
        toggleEditMode(itemIndex, componentIndex); // Exit edit mode after saving
      } catch (error) {
        setError(`Error saving changes: ${error.message}`);
      }
    };
  
    const saveBOChanges = async (itemIndex, boIndex) => {
      const updatedBOItem = items[itemIndex].bo[boIndex];
      const updatedItems = [...items];
  
      console.log(updatedBOItem);
      try {
        const response = await fetch(
          `http://localhost:5000/api/components/combined-details/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json",
            'x-auth-token': token},
            body: JSON.stringify({ items: updatedItems }), // Use updatedItems as needed
          }
        );
  
        if (!response.ok) throw new Error("Submission failed");
        await response.json();
        alert("B/O changes saved successfully");
  
        // Reset selected material field and recalculate total sum
        updatedItems[itemIndex].bo[boIndex].materials.forEach((material) => {
          material.material = "";
          material.value = "";
        });
        setItems(updatedItems);
        updateTotalSum(updatedItems);
  
        toggleBOEditMode(itemIndex, boIndex); // Exit edit mode after saving
      } catch (error) {
        setError(`Error saving B/O changes: ${error.message}`);
      }
    };
    const toggleBOEditMode = (itemIndex, boIndex) => {
      setEditableBOItems((prev) => ({
        ...prev,
        [`${itemIndex}-${boIndex}`]: !prev[`${itemIndex}-${boIndex}`],
      }));
    };
  
    // Save changes for B/O items
    const handlePDFDownload = () => {
      const element = quotationPDFRef.current;
      const opt = {
        margin: 1,
        filename: "MaterialSelection.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      };
      html2pdf().set(opt).from(element).save();
    };
  
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
  
    return (
      <div className="container1">
        <div className="header">
          <img src={logo} alt="Logo" />
        </div>
  
        <div className="item-list">
          {items.map((item, itemIndex) => (
            <div key={itemIndex} className="item-section">
              <h2>{item.itemSelect}</h2>
  
              {/* Render Components */}
              {item.components.map((component, componentIndex) => (
                <div key={componentIndex} className="co-component-section">
                  <div className="component-item">
                    <div className="co-unit-header">
                      <h3>{component.unit}</h3>
                      <button
                        // onClick={() => toggleEditMode(itemIndex, componentIndex)}
                        disabled={
                          items[itemIndex].components[componentIndex].materials.some(
                            (material) => material.material && material.value
                          )
                        }
                      >
                        {editableItems[`${itemIndex}-${componentIndex}`]
                          ? "Cancel"
                          : "Edit"}
                      </button>
                      {editableItems[`${itemIndex}-${componentIndex}`] && (
                        <button
                          onClick={() => saveChanges(itemIndex, componentIndex)}
                        >
                          Save
                        </button>
                      )}
                    </div>
                    <div className="co-component-body">
                      <div className="co-component-item">
                        <label>Component Name: </label>
                        <input
                          className="input"
                          type="text"
                          value={component.componentName}
                          onChange={(e) => {
                            if (editableItems[`${itemIndex}-${componentIndex}`]) {
                              const updatedItems = [...items];
                              updatedItems[itemIndex].components[
                                componentIndex
                              ].componentName = e.target.value;
                              setItems(updatedItems);
                            }
                          }}
                          readOnly={
                            !editableItems[`${itemIndex}-${componentIndex}`]
                          }
                        />
                      </div>
                      <div className="co-component-item">
                        <label>Length: </label>
                        <input
                          className="input"
                          type="text"
                          value={component.length}
                          onChange={(e) => {
                            if (editableItems[`${itemIndex}-${componentIndex}`]) {
                              const updatedItems = [...items];
                              updatedItems[itemIndex].components[
                                componentIndex
                              ].length = e.target.value;
                              setItems(updatedItems);
                            }
                          }}
                        />
                      </div>
                      <div className="co-component-item">
                        <label>Breadth: </label>
                        <input
                          className="input"
                          type="text"
                          value={component.breadth}
                          onChange={(e) => {
                            if (editableItems[`${itemIndex}-${componentIndex}`]) {
                              const updatedItems = [...items];
                              updatedItems[itemIndex].components[
                                componentIndex
                              ].breadth = e.target.value;
                              setItems(updatedItems);
                            }
                          }}
                        />
                      </div>
                      <div className="co-component-item">
                        <label>Depth: </label>
                        <input
                          className="input"
                          type="text"
                          value={component.depth}
                          onChange={(e) => {
                            if (editableItems[`${itemIndex}-${componentIndex}`]) {
                              const updatedItems = [...items];
                              updatedItems[itemIndex].components[
                                componentIndex
                              ].depth = e.target.value;
                              setItems(updatedItems);
                            }
                          }}
                        />
                      </div>
                      <div className="co-component-item">
                        <label>Quantity: </label>
                        <input
                          className="input"
                          type="text"
                          value={component.quantity}
                          onChange={(e) => {
                            if (editableItems[`${itemIndex}-${componentIndex}`]) {
                              const updatedItems = [...items];
                              updatedItems[itemIndex].components[
                                componentIndex
                              ].quantity = e.target.value;
                              setItems(updatedItems);
                            }
                          }}
                        />
                      </div>
                      <div className="co-component-item">
                        <label>Cutsize: </label>
                        <input
                          className="input"
                          type="text"
                          value={component.cutsize}
                          onChange={(e) => {
                            if (editableItems[`${itemIndex}-${componentIndex}`]) {
                              const updatedItems = [...items];
                              updatedItems[itemIndex].components[
                                componentIndex
                              ].cutsize = e.target.value;
                              setItems(updatedItems);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
  
                  {/* Render Materials for each Component */}
                  <div className="co-material-section">
                    <div className="co-unit-header">
                      <h3>Materials</h3>
                      <button
                        // onClick={() => addMaterial(itemIndex, componentIndex)}
                      >
                        Add Material
                      </button>
                    </div>
                    <div className="material-container">
                      {component.materials.map((material, materialIndex) => (
                        <div key={materialIndex} className="material-item">
                          <select
                            className="select"
                            value={material.material || ""} // Ensure this starts as an empty string if no material is selected
                            onChange={(e) =>
                              handleMaterialChange(
                                itemIndex,
                                componentIndex,
                                materialIndex,
                                "material",
                                e.target.value
                              )
                            }
                            disabled={!editableItems[`${itemIndex}-${componentIndex}`]}
                          >
                            {/* 1. Default placeholder option */}
                            <option value="">Select Material</option>
  
                            {/* 2. Material options from useMemo */}
                            {materialOptions}
                          </select>
                          <input
                            className="input"
                            type="text"
                            value={
                              manualMaterialValues[
                                `${itemIndex}-${componentIndex}-${materialIndex}`
                              ] || material.value
                              
                            }
                            onChange={(e) =>
                              handleMaterialChange(
                                itemIndex,
                                componentIndex,
                                materialIndex,
                                "value",
                                e.target.value
                              )
                            }
                            disabled={!editableItems[`${itemIndex}-${componentIndex}`]}
                          />
                          {component.materials.length > 1 && (
                            <button
                              className="remove-mr"
                            //   onClick={() =>
                            //     removeMaterial(
                            //       itemIndex,
                            //       componentIndex,
                            //       materialIndex
                            //     )
                            //   }
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
  
              {/* Render B/O Items under each Component */}
              <div className="bo-section">
                <div className="bo-header">
                  <h3>B/O Items</h3>
                </div>
                {item.bo.map((boItem, boIndex) => (
                  <div key={boIndex} className="co-component-section">
                    <div className="component-item">
                      <div className="bo-unit-header">
                        <h4>{boItem.materialname}</h4>
                        <button
                        //   onClick={() => toggleBOEditMode(itemIndex, boIndex)}
                          disabled={
                              items[itemIndex].bo[boIndex].materials.some(
                                (material) => material.material && material.value
                              )
                            }
                        >
                          {editableBOItems[`${itemIndex}-${boIndex}`]
                            ? "Cancel"
                            : "Edit"}
                        </button>
                        {editableBOItems[`${itemIndex}-${boIndex}`] && (
                          <button
                            onClick={() => saveBOChanges(itemIndex, boIndex)}
                          >
                            Save
                          </button>
                        )}
                      </div>
                      <div className="co-component-body">
                        <div className="co-component-item">
                          <label>Quantity: </label>
                          <input
                            className="input"
                            type="text"
                            value={boItem.quantity}
                            onChange={(e) => {
                              if (editableBOItems[`${itemIndex}-${boIndex}`]) {
                                const updatedItems = [...items];
                                updatedItems[itemIndex].bo[boIndex].quantity =
                                  e.target.value;
                                setItems(updatedItems);
                              }
                            }}
                            readOnly={!editableBOItems[`${itemIndex}-${boIndex}`]}
                          />
                        </div>
                        <div className="co-component-item">
                          <label>Cutsize: </label>
                          <input
                            className="input"
                            type="text"
                            value={boItem.cutsize}
                            onChange={(e) => {
                              if (editableBOItems[`${itemIndex}-${boIndex}`]) {
                                const updatedItems = [...items];
                                updatedItems[itemIndex].bo[boIndex].cutsize =
                                  e.target.value;
                                setItems(updatedItems);
                              }
                            }}
                            readOnly={!editableBOItems[`${itemIndex}-${boIndex}`]}
                          />
                        </div>
                      </div>
                    </div>
  
                    <div className="co-material-section">
                      <div className="co-unit-header">
                        <h4>Select Material</h4>
                        <button
                        //   onClick={() => addMaterial(itemIndex, boIndex, true)}
                        >
                          Add Material
                        </button>
                      </div>
                      {boItem.materials.map((material, materialIndex) => (
                        <div key={materialIndex} className="material-item">
                          <select
                            value={material.material}
                            onChange={(e) =>
                              handleMaterialChange(
                                itemIndex,
                                boIndex,
                                materialIndex,
                                "material",
                                e.target.value,
                                true
                              )
                            }
                            disabled={!editableBOItems[`${itemIndex}-${boIndex}`]}
                          >
                            <option value="">Select Material</option>
                            {materialOptions}
                          </select>
                          <input
                            className="input"
                            type="text"
                            value={
                              manualBOMaterialValues[
                                `${itemIndex}-${boIndex}-${materialIndex}`
                              ] || material.value
                            }
                            onChange={(e) =>
                              handleMaterialChange(
                                itemIndex,
                                boIndex,
                                materialIndex,
                                "value",
                                e.target.value,
                                true
                              )
                            }
                            disabled={!editableBOItems[`${itemIndex}-${boIndex}`]}
                          />
                          {boItem.materials.length > 1 && (
                            <button
                              className="remove-mr"
                            //   onClick={() =>
                            //     removeMaterial(
                            //       itemIndex,
                            //       boIndex,
                            //       materialIndex,
                            //       true
                            //     )
                            //   }
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <hr className="hr" />
            </div>
          ))}
        </div>
  
        <div className="footer">
          <button onClick={submitMaterialSelection}>Submit</button>
          <button onClick={onExportPDF}>Export PDF</button>
          {/* <div className="item-wise-totals">
            {Object.entries(itemWiseTotals).map(([itemName, total]) => (
              <div key={itemName}>
                <strong>{itemName}: </strong>
                <span>{total}</span>
              </div>
            ))}
          </div> */}
          {/* <div>Total Sum: {totalSum}</div> */}
        </div>
  
        <div ref={quotationPDFRef} style={{ display: "none" }}>
          <h1>Quotation Details</h1>
          {/* Additional details for PDF can be included here */}
        </div>
      </div>
    );
  };
  
  export default ViesMaterialSelection;
  