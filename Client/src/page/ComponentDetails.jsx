import React from "react";

const ComponentItem = ({
  itemIndex,
  componentIndex,
  component,
  materialOptions,
  editableItems,
  setEditableItems,
  addMaterial,
  removeMaterial,
  handleMaterialChange,
}) => {
  const toggleEditMode = () => {
    setEditableItems((prev) => ({
      ...prev,
      [`${itemIndex}-${componentIndex}`]: !prev[`${itemIndex}-${componentIndex}`],
    }));
  };

  return (
    <div className="co-component-section">
      <div className="component-item">
        <div className="co-unit-header">
          <h3>{component.unit}</h3>
          <button onClick={toggleEditMode}>
            {editableItems[`${itemIndex}-${componentIndex}`] ? "Cancel" : "Edit"}
          </button>
          {editableItems[`${itemIndex}-${componentIndex}`] && (
            <button onClick={() => {/* Save changes logic */}}>Save</button>
          )}
        </div>
        <div className="co-component-body">
          {/* Render component fields here */}
          <div className="co-component-item">
            <label>Component Name:</label>
            <input
              className="input"
              type="text"
              value={component.componentName}
              readOnly={!editableItems[`${itemIndex}-${componentIndex}`]}
              onChange={(e) => handleMaterialChange(itemIndex, componentIndex, "componentName", e.target.value)}
            />
          </div>
          {/* More fields like Length, Breadth, etc. */}
          <div className="co-material-section">
            <div className="co-unit-header">
              <h3>Materials</h3>
              <button onClick={() => addMaterial(itemIndex, componentIndex)}>Add Material</button>
            </div>
            {/* Render materials */}
            {component.materials.map((material, materialIndex) => (
              <div key={materialIndex} className="material-item">
                <select
                  className="select"
                  value={material.material || ""}
                  onChange={(e) =>
                    handleMaterialChange(itemIndex, componentIndex, materialIndex, "material", e.target.value)
                  }
                >
                  <option value="">Select Material</option>
                  {materialOptions}
                </select>
                <input className="input" type="text" value={material.value} readOnly />
                {component.materials.length > 1 && (
                  <button onClick={() => removeMaterial(itemIndex, componentIndex, materialIndex)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentItem;
