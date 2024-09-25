import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the context
const MaterialsContext = createContext();

// Create a custom hook to use the context
export const useMaterials = () => useContext(MaterialsContext);

export const MaterialsProvider = ({ children }) => {
  const [materialOptions, setMaterialOptions] = useState({});
  const [uomOptions, setUomOptions] = useState({});
  const [rateOptions, setRateOptions] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState(null);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [users, setUsers] = useState([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);

  const token = localStorage.getItem('token'); // Get token from local storage

  useEffect(() => {
    fetchMaterials();
    fetchQuotations();
    fetchUsers();
    fetchMaterialTypeOptions(); // Call to fetch material types
  }, [token]);

  const fetchMaterialTypeOptions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/components/rate-materials', {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      // Extract material types and remove duplicates
      const uniqueMaterialTypes = [...new Set(response.data.map(item => item.material_type))];
      setMaterialTypeOptions(uniqueMaterialTypes);
    } catch (error) {
      console.error('Error fetching material types:', error);
      setError('Failed to load material types');
    }
  };

  // Function to add material
  const addMaterial = async (materialType, options) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/components/rate-materials',
        {
          material_type: materialType,
          options,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
        }
      );

      if (response.status === 201) {
        setSubmitMessage('Material added successfully!');
      } else {
        throw new Error('Unexpected response from the server.');
      }
    } catch (error) {
      console.error('Error adding material:', error);
      setSubmitError(error.message || 'Failed to add material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 

  const fetchMaterials = async () => {
    try {
      console.log(token);
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

      // Transform the data
      const materialOpts = {};
      const uomOpts = {};
      const rateOpts = {};

      data.forEach((material) => {
        const materialType = material.material_type;
        const options = Object.keys(material.options);
        materialOpts[materialType] = options;

        if (materialType === 'finishes') {
          uomOpts[materialType] = {};
          options.forEach((option) => {
            uomOpts[materialType][option] = material.options[option].uom;
          });
        } else {
          // Assuming all non-finish materials have the same UOM
          uomOpts[materialType] = material.options[options[0]].uom;
        }

        rateOpts[materialType] = {};
        options.forEach((option) => {
          rateOpts[materialType][option] = material.options[option].rate;
        });
      });

      setMaterialOptions(materialOpts);
      setUomOptions(uomOpts);
      setRateOptions(rateOpts);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError(error.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/components/combined/getAllFurniture-Detail', {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
        }
      );
      setQuotations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/components/user/alluser',{
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      }); // Updated API endpoint
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to submit form data
  const submitFormData = async (formData) => {
    setLoading(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
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

      setSubmitMessage(result.message || 'Form submitted successfully!');
      return result;
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit form!');
      throw error; // Re-throw the error so it can be handled in the component if needed
    } finally {
      setLoading(false);
    }
  };

  // Update User Function
  const updateUser = async (id, userData) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/components/user/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      await fetchUsers(); // Call fetchUsers to refresh the user list after updating
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error; // Re-throw the error to handle it in the component
    } finally {
      setLoading(false);
    }
  };

  // Delete User Function
  const deleteUser = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/components/user/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      await fetchUsers(); // Call fetchUsers to refresh the user list after deleting
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error; // Re-throw the error to handle it in the component
    } finally {
      setLoading(false);
    }
  };

  // Add this function in your MaterialsProvider
const addUser = async (userData) => {
  setLoading(true);
  try {
    const response = await fetch('http://localhost:5000/api/components/register', { // Adjust endpoint as necessary
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to add user');
    }

    await fetchUsers(); // Refresh user list after adding
  } catch (error) {
    console.error('Failed to add user:', error);
    throw error; // Re-throw the error for handling in the component
  } finally {
    setLoading(false);
  }
};


  return (
    <MaterialsContext.Provider
      value={{
        materialOptions,
        uomOptions,
        rateOptions,
        error,
        loading,
        submitError,
        submitMessage,
        submitFormData, 
        quotations,
        users,
        updateUser,
        deleteUser,
        addUser,
        addMaterial,
        materialTypeOptions
      }}
    >
      {children}
    </MaterialsContext.Provider>
  );
};
