import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../../utils/api';

const EditUser = ({ userId, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    position: '',
    company: '',
    salary: '',
    department: '',
    qualification: '',
    dateOfJoining: '',
    profilePic: '',
    skills: [],
    rolesAndResponsibility: [],
    isActive: true,
    bankDetails: {
      bankingName: '',
      bankAccountNumber: '',
      ifscCode: '',
      upiId: ''
    }
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (userId) {
      axios.get(API_ENDPOINTS.getUserById(userId), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(({ data }) => {
          setForm({
            ...data,
            skills: data.skills || [],
            rolesAndResponsibility: data.rolesAndResponsibility || [],
            bankDetails: data.bankDetails || {},
            isActive: data.isActive ?? false
          });
        })
        .catch(() => Swal.fire('Error', 'Failed to fetch user', 'error'));
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value
      }
    }));
  };

  const handleArrayField = (name, value) => {
    setForm(prev => ({
      ...prev,
      [name]: value.split(',').map(v => v.trim())
    }));
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire('Error', 'Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Swal.fire('Error', 'Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(API_ENDPOINTS.updateUser(userId), {
        password: passwordData.newPassword
      }, { headers });

      Swal.fire('Success', 'Password updated successfully', 'success');
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordFields(false);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Password update failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Remove password from form data when submitting main form
      const { password, ...formDataWithoutPassword } = form;
      
      await axios.put(API_ENDPOINTS.updateUser(userId), formDataWithoutPassword, { headers });
      Swal.fire('Success', 'User updated successfully', 'success');
      onUpdated?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Update failed', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white max-w-3xl w-full p-6 rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2" />
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2" />
          <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="border p-2" />
          <input type="text" name="position" value={form.position} onChange={handleChange} placeholder="Position" className="border p-2" />
          <input type="text" name="company" value={form.company} onChange={handleChange} placeholder="Company" className="border p-2" />
          <input type="number" name="salary" value={form.salary} onChange={handleChange} placeholder="Salary" className="border p-2" />
          <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="Department" className="border p-2" />
          <input type="text" name="qualification" value={form.qualification} onChange={handleChange} placeholder="Qualification" className="border p-2" />
          <input type="date" name="dateOfJoining" value={form.dateOfJoining?.slice(0, 10)} onChange={handleChange} className="border p-2" />

          {/* Active Status */}
          <div className="col-span-2 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isActive"
              name="isActive" 
              checked={form.isActive} 
              onChange={handleChange} 
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium">Active User</label>
          </div>

          <input type="text" name="skills" value={form.skills.join(', ')} onChange={(e) => handleArrayField('skills', e.target.value)} placeholder="Skills (comma separated)" className="col-span-2 border p-2" />
          <input type="text" name="rolesAndResponsibility" value={form.rolesAndResponsibility.join(', ')} onChange={(e) => handleArrayField('rolesAndResponsibility', e.target.value)} placeholder="Responsibilities (comma separated)" className="col-span-2 border p-2" />

          {/* Banking Fields */}
          <input type="text" name="bankingName" value={form.bankDetails.bankingName || ''} onChange={handleBankChange} placeholder="Bank Name" className="border p-2" />
          <input type="text" name="bankAccountNumber" value={form.bankDetails.bankAccountNumber || ''} onChange={handleBankChange} placeholder="Account Number" className="border p-2" />
          <input type="text" name="ifscCode" value={form.bankDetails.ifscCode || ''} onChange={handleBankChange} placeholder="IFSC Code" className="border p-2" />
          <input type="text" name="upiId" value={form.bankDetails.upiId || ''} onChange={handleBankChange} placeholder="UPI ID" className="border p-2" />

          {/* Password Change Section */}
          <div className="col-span-2 border-t pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Change Password</h3>
              <button 
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showPasswordFields ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            
            {showPasswordFields && (
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwordData.newPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="New Password" 
                  className="border p-2" 
                />
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="Confirm Password" 
                  className="border p-2" 
                />
                <button 
                  type="button"
                  onClick={handlePasswordUpdate}
                  className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Update Password
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default EditUser;