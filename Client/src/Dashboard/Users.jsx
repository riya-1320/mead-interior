import React, { useState } from 'react';
import './user.css'; // Ensure you have a CSS file for styles  
import { useMaterials } from '../Context/furnitureAPI';

const Users = () => {
  const { users, loading, deleteUser, updateUser, addUser } = useMaterials();
  const [editingUser, setEditingUser] = useState(null);
  const [userData, setUserData] = useState({ name: '', email: '', role: '' });
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'User' , password: ''}); // New user data state

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setUserData({ name: user.name, email: user.email, role: user.role , password: user.password});
  };

  const handleUpdate = async () => {
    try {
      await updateUser(editingUser, userData);
      setEditingUser(null); // Reset editing mode
      setUserData({ name: '', email: '', role: '' }); // Clear the input fields
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleAddUser = async () => {
    try {
      await addUser(newUserData);
      setNewUserData({ name: '', email: '', role: 'User' }); // Reset new user data
      setShowModal(false); // Close modal
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  return (
    <div className="us-users-container">
      <h1 className="us-users-title">Users</h1>
      <button className="us-add-user-button" onClick={() => setShowModal(true)}>Add User</button>
      {loading ? (
        <p className="us-loading-text">Loading...</p>
      ) : (
        <div className="us-table-container">
          {users.length === 0 ? (
            <p className="us-no-users">No users available.</p>
          ) : (
            <table className="us-users-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user._id}</td>
                    <td>
                      {editingUser === user._id ? (
                        <input
                          type="text"
                          value={userData.name}
                          onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                          className="us-input"
                        />
                      ) : (
                        user.name
                      )}
                    </td>
                    <td>
                      {editingUser === user._id ? (
                        <input
                          type="email"
                          value={userData.email}
                          onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                          className="us-input"
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td>
                      {editingUser === user._id ? (
                        <select
                          value={userData.role}
                          onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                          className="us-input"
                        >
                          <option value="Admin">Admin</option>
                          <option value="User">User</option>
                        </select>
                      ) : (
                        user.role
                      )}
                    </td>
                    <td>{new Date(user.date).toLocaleDateString()}</td>
                    <td>
                      {editingUser === user._id ? (
                        <>
                          <button className="us-save-button" onClick={handleUpdate}>Save</button>
                          <button className="us-cancel-button" onClick={() => setEditingUser(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="us-edit-button" onClick={() => handleEdit(user)}>Edit</button>
                          <button className="us-delete-button" onClick={() => handleDelete(user._id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal for Adding New User */}
     {
      showModal && (
        <div className="usad-modal">
          <div className="usad-modal-content">
            <h2>Add New User</h2>
            <input
              type="text"
              placeholder="Name"
              value={newUserData.name}
              onChange={(e) =>
                setNewUserData({ ...newUserData, name: e.target.value })
              }
              className="usad-input"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUserData.email}
              onChange={(e) =>
                setNewUserData({ ...newUserData, email: e.target.value })
              }
              className="usad-input"
            />
            <select
              value={newUserData.role}
              onChange={(e) =>
                setNewUserData({ ...newUserData, role: e.target.value })
              }
              className="usad-input"
            >
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
            <input
              type="password"
              placeholder="Password"
              value={newUserData.password}
              onChange={(e) =>
                setNewUserData({ ...newUserData, password: e.target.value })
              }
              className="usad-input"
            />
            <div className="usad-modal-buttons">
              <button
                className="usad-save-button"
                onClick={() => handleAddUser(newUserData)}
              >
                Add User
              </button>
              <button
                className="usad-cancel-button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )
     }
    </div>
  );
};

export default Users;
