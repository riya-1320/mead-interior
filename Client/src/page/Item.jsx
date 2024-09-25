import React from "react";

const ItemSection = ({
  itemName,
  items,
  editMode,
  setEditMode,
  handleEditSave,
  handleMaterialChange,
  addMaterial,
  removeMaterial,
  materialOptions,
  setItems,
}) => (
  <div className="component-section">
    <h2 className="item-name">{itemName}</h2>

    {items.map((item, index) => (
      <div key={index} className="component-two-column">
        <div className="component-details">
          <div className="component-info-header">
            <h3>{item.unit}</h3>
            <button
              className={editMode[itemName + index] ? "save-button button-25" : "edit-button button-25"}
              onClick={() => {
                if (editMode[itemName + index]) {
                  handleEditSave();
                }
                setEditMode({ ...editMode, [itemName + index]: !editMode[itemName + index] });
              }}
            >
              {editMode[itemName + index] ? "Save" : "Edit"}
            </button>
          </div>

          <div className="component-info-body">
            {["componentName", "length", "breadth", "depth", "quantity", "cutsize"].map((field) => (
              <div key={field} className="component-info-section">
                <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input
                  type="text"
                  className="input"
                  value={item[field]}
                  readOnly={!editMode[itemName + index]}
                  onChange={(e) =>
                    setItems((prevItems) =>
                      prevItems.map((itm, i) =>
                        i === index ? { ...itm, [field]: e.target.value } : itm
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
            <button className="button-25" onClick={() => addMaterial(index)}>+ Add Material</button>
          </div>

          {item.materials.map((material, materialIndex) => (
            <div key={materialIndex} className="material-row">
              <select
                value={material.material}
                onChange={(e) => handleMaterialChange(index, materialIndex, "material", e.target.value)}
              >
                <option value="">Select Material</option>
                {materialOptions}
              </select>

              <input
                type="text"
                className="input"
                value={material.value}
                onChange={(e) => handleMaterialChange(index, materialIndex, "value", e.target.value)}
                readOnly
              />
              <button onClick={() => removeMaterial(index, materialIndex)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    ))}
    <hr />
  </div>
);

export default ItemSection;
