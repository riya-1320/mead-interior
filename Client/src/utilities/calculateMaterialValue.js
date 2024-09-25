// materialUtils.js
export const calculateMaterialValue = (materialRates, materialName, { quantity, cutsize, length, breadth }) => {
    let value = 0;

    const materialCalculations = {
        "OSL - 18mm": () => quantity * cutsize * 1.03,
        "OSR - 18mm": () => quantity * cutsize * 1.03,
        "Sal Wood": () => quantity * 0.05 * 0.05 * 1.2,
        "Hardware": () => quantity * 4 * 5,
        "Lipping": () => quantity * (length + breadth) * 2 * 1.05,
        "Machine": () => (quantity * (length + breadth) * 2 * 2) / 60 + (quantity * 4 * 3 * 0.5) / 60 + (quantity * length * 2.5) / 60,
        default: () => quantity * cutsize,
    };

    value = materialCalculations[materialName] ? materialCalculations[materialName]() : 0;
    const rate = materialRates[materialName] || 0;
    return (value * rate).toFixed(4);
};

export const updateTotalSum = (itemsData, removedValue = 0) => {
    const sum = itemsData.reduce((acc, item) => {
        const componentSum = item.components.reduce((componentAcc, component) => {
            const materialSum = component.materials.reduce((materialAcc, material) => {
                return materialAcc + (parseFloat(material.value) || 0);
            }, 0);
            return componentAcc + materialSum;
        }, 0);

        const boSum = item.bo.reduce((boAcc, boItem) => {
            const materialSum = boItem.materials.reduce((materialAcc, material) => {
                return materialAcc + (parseFloat(material.value) || 0);
            }, 0);
            return boAcc + materialSum;
        }, 0);

        return acc + componentSum + boSum;
    }, 0);

    return (sum - removedValue).toFixed(4);
};
 
export const updateItems = (items, itemIndex, componentIndex, field, value, isBo) => {
    const updatedItems = [...items];
    const target = isBo ? updatedItems[itemIndex].bo[componentIndex] : updatedItems[itemIndex].components[componentIndex];
    target[field] = value;
    return updatedItems;
};


export const submitMaterialSelection = async (id, cleanedItems) => {

    if (!id) return setError("No ID found");
  
    const cleanedItems = items.map((item) => {
      // Calculate total amount for the item
      const totalAmount = item.components.reduce((total, component) => {
        const componentCost = component.materials.reduce((acc, material) => {
          return acc + (parseFloat(material.value) || 0);
        }, 0);
        return total + componentCost;
      }, 0) + item.bo.reduce((total, boItem) => {
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
          materials: component.materials.filter((mat) => mat.material && mat.value),
        })),
        bo: item.bo.map((boItem) => ({
          ...boItem,
          materials: boItem.materials.filter((mat) => mat.material && mat.value),
        })),
      };
    });
  
    try {
      const response = await fetch(`http://localhost:5000/api/components/combined/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cleanedItems }),
      });
  
      if (!response.ok) throw new Error("Submission failed");
  
      await response.json();
      alert("Materials submitted successfully");
    } catch (error) {
      setError(`Submission error: ${error.message}`);
    }
  };
  