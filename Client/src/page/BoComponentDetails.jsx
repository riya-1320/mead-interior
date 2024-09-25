import React from "react";

const BOItem = ({
  itemIndex,
  boIndex,
  boItem,
  materialOptions,
  editableBOItems,
  setEditableBOItems,
  addMaterial,
  removeMaterial,
  handleMaterialChange,
}) => {
  const toggleBOEditMode = () => {
    setEditableBOItems((prev) => ({
      ...prev,
      [`${itemIndex}-${boIndex}`]: !prev[`${itemIndex}-${boIndex}`],
    }));
  };

  return (
    <div className="co-component-section">
      <div className="bo-unit-header">
        <h4>{boItem.materialname}</h4>
        <button onClick={toggleBOEditMode}>
          {editableBOItems[`${itemIndex}-${boIndex}`] ? "Cancel" : "Edit"}
        </button>
        {editableBOItems[`${itemIndex}-${boIndex}`] && (
          <button onClick={() => {/* Save B/O changes logic */}}>Save</button>
        )}
      </div>
      <div className="co-component-body">
        {/* Render fields for B/O items */}
        <div className="co-component-item">
          <label>Quantity:</label>
          <input
            className="input"
            type="text"
            value={boItem.quantity}
            readOnly={!editableBOItems[`${itemIndex}-${boIndex}`]}
            onChange={(e) => handleMaterialChange(itemIndex, boIndex, "quantity", e.target.value)}
          />
        </div>
        <div className="co-material-section">
          <h5>Materials</h5>
          <button onClick={() => addMaterial(itemIndex, boIndex)}>Add Material</button>
          {boItem.materials.map((material, materialIndex) => (
            <div key={materialIndex} className="material-item">
              <select
                className="select"
                value={material.material || ""}
                onChange={(e) =>
                  handleMaterialChange(itemIndex, boIndex, materialIndex, "material", e.target.value)
                }
              >
                <option value="">Select Material</option>
                {materialOptions}
              </select>
              <input className="input" type="text" value={material.value} readOnly />
              {boItem.materials.length > 1 && (
                <button onClick={() => removeMaterial(itemIndex, boIndex, materialIndex)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BOItem;
