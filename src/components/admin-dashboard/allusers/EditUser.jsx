import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { emptyWork, getUserWorks, withSyncedWorks } from '../../../utils/userWorks';

const EditUser = ({ userId, onClose, onUpdated, pageMode = false }) => {
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
    dateOfRelieving: '',
    profilePic: '',
    skills: [],
    rolesAndResponsibility: [],
    works: [emptyWork()],
    isActive: true,
    adminComments: '',
    employeeId: '',
    bankDetails: {
      bankingName: '',
      bankAccountNumber: '',
      ifscCode: '',
      upiId: ''
    }
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const navigate = useNavigate();

  const isPage = pageMode || !onClose;

  useEffect(() => {
    if (!userId) return;
    axios.get(API_ENDPOINTS.getUserById(userId), {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(({ data }) => {
        const works = getUserWorks(data);
        setForm({
          ...data,
          skills: data.skills || [],
          rolesAndResponsibility: data.rolesAndResponsibility || [],
          works: works.length ? works : [emptyWork()],
          bankDetails: data.bankDetails || {},
          isActive: data.isActive ?? false,
        });
      })
      .catch(() => Swal.fire('Error', 'Failed to fetch user', 'error'));
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
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
      await axios.put(API_ENDPOINTS.updateUser(userId), { password: passwordData.newPassword }, { headers });
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
      const { password, ...formDataWithoutPassword } = withSyncedWorks(form);
      await axios.put(API_ENDPOINTS.updateUser(userId), formDataWithoutPassword, { headers });
      Swal.fire('Success', 'User updated successfully', 'success');
      onUpdated?.();
      if (isPage) navigate(-1);
      else onClose?.();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Update failed', 'error');
    }
  };

  const handleArrayField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value.split(',').map(v => v.trim()) }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, [name]: value } }));
  };

  const handleWorkChange = (index, field, value) => {
    setForm((prev) => {
      const works = [...(prev.works || [])];
      works[index] = { ...works[index], [field]: value };
      const next = { ...prev, works };
      if (index === 0) {
        next.company = works[0].company;
        next.department = works[0].department;
        next.position = works[0].position;
      }
      return next;
    });
  };

  const addWork = () => {
    setForm((prev) => ({
      ...prev,
      works: [...(prev.works || []), emptyWork()],
    }));
  };

  const removeWork = (index) => {
    setForm((prev) => {
      if ((prev.works || []).length <= 1) return prev;
      const works = prev.works.filter((_, i) => i !== index);
      const next = { ...prev, works };
      if (index === 0) {
        next.company = works[0]?.company || '';
        next.department = works[0]?.department || '';
        next.position = works[0]?.position || '';
      }
      return next;
    });
  };

  return (
    <div className={isPage ? 'p-6 bg-gray-50 min-h-screen' : 'fixed inset-0 z-50 bg-black bg-opacity-40 flex items-start justify-center p-6 overflow-auto'}>
      <div className={`bg-white max-w-4xl w-full rounded-lg shadow-lg overflow-y-auto ${isPage ? 'mx-auto mt-6' : 'max-h-[92vh]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-4">
            {isPage && (
              <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-gray-100 mr-2">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-700">
              {form.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold">Edit User</h2>
              <div className="text-sm text-gray-500">{form.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">Employee ID</div>
            <div className="font-mono text-sm text-gray-800">{form.employeeId || '—'}</div>
            {!isPage && (
              <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl">&times;</button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm text-gray-600">Full name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full border rounded px-3 py-2" />

            <label className="text-sm text-gray-600">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full border rounded px-3 py-2" />

            <label className="text-sm text-gray-600">Phone</label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full border rounded px-3 py-2" />

            <label className="text-sm text-gray-600">Date of Joining</label>
            <input type="date" name="dateOfJoining" value={form.dateOfJoining?.slice(0, 10) || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />

            <label className="text-sm text-gray-600">Date of Relieving</label>
            <input
              type="date"
              name="dateOfRelieving"
              value={form.dateOfRelieving?.slice(0, 10) || ''}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 -mt-1">Leave empty if the employee is still working.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-gray-600">Salary</label>
            <input type="number" name="salary" value={form.salary} onChange={handleChange} placeholder="Salary" className="w-full border rounded px-3 py-2" />

            <label className="text-sm text-gray-600">Qualification</label>
            <input type="text" name="qualification" value={form.qualification} onChange={handleChange} placeholder="Qualification" className="w-full border rounded px-3 py-2" />

            <label className="text-sm text-gray-600">Skills (comma separated)</label>
            <input type="text" name="skills" value={form.skills.join(', ')} onChange={(e) => handleArrayField('skills', e.target.value)} placeholder="e.g. React,Node" className="w-full border rounded px-3 py-2" />

            <label className="text-sm text-gray-600">Responsibilities (comma separated)</label>
            <input type="text" name="rolesAndResponsibility" value={form.rolesAndResponsibility.join(', ')} onChange={(e) => handleArrayField('rolesAndResponsibility', e.target.value)} placeholder="Comma separated" className="w-full border rounded px-3 py-2" />

            <div className="flex items-center gap-3">
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

          </div>

          {/* Multiple work assignments */}
          <div className="col-span-1 md:col-span-2 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Work Assignments</h3>
                <p className="text-xs text-gray-500 mt-0.5">One person can have multiple company / department / role entries.</p>
              </div>
              <button
                type="button"
                onClick={addWork}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Add Work
              </button>
            </div>

            <div className="space-y-3">
              {(form.works || []).map((work, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {index === 0 ? 'Primary Work' : `Work ${index + 1}`}
                    </span>
                    {(form.works || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWork(index)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Company</label>
                      <input
                        type="text"
                        list={`companies-${index}`}
                        value={work.company}
                        onChange={(e) => handleWorkChange(index, 'company', e.target.value)}
                        placeholder="e.g. Urbancode, Jobzenter"
                        className="w-full border rounded px-3 py-2 mt-1 bg-white"
                      />
                      <datalist id={`companies-${index}`}>
                        <option value="Jobzenter" />
                        <option value="Urbancode" />
                      </datalist>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Department</label>
                      <input
                        type="text"
                        value={work.department}
                        onChange={(e) => handleWorkChange(index, 'department', e.target.value)}
                        placeholder="Department"
                        className="w-full border rounded px-3 py-2 mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Designation</label>
                      <input
                        type="text"
                        value={work.position}
                        onChange={(e) => handleWorkChange(index, 'position', e.target.value)}
                        placeholder="Designation"
                        className="w-full border rounded px-3 py-2 mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin comments - full width editable by admin */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm text-gray-600">Admin Comments</label>
            <textarea
              name="adminComments"
              value={form.adminComments || ''}
              onChange={handleChange}
              placeholder="Internal notes / comments"
              className="w-full border rounded px-3 py-2 h-24 resize-none"
            />
          </div>

          {/* Banking - full width */}
          <div className="col-span-1 md:col-span-2 border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Banking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" name="bankingName" value={form.bankDetails.bankingName || ''} onChange={handleBankChange} placeholder="Bank Name" className="w-full border rounded px-3 py-2" />
              <input type="text" name="bankAccountNumber" value={form.bankDetails.bankAccountNumber || ''} onChange={handleBankChange} placeholder="Account Number" className="w-full border rounded px-3 py-2 font-mono" />
              <input type="text" name="ifscCode" value={form.bankDetails.ifscCode || ''} onChange={handleBankChange} placeholder="IFSC Code" className="w-full border rounded px-3 py-2 font-mono" />
            </div>
            <div className="mt-3">
              <input type="text" name="upiId" value={form.bankDetails.upiId || ''} onChange={handleBankChange} placeholder="UPI ID" className="w-full border rounded px-3 py-2 font-mono" />
            </div>
          </div>

          {/* Password Section */}
          <div className="col-span-1 md:col-span-2 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwordData.newPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="New Password" 
                  className="w-full border rounded px-3 py-2" 
                />
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="Confirm Password" 
                  className="w-full border rounded px-3 py-2" 
                />
                <div className="md:col-span-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={handlePasswordUpdate}
                    className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  >
                    Update Password
                  </button>
                  <div className="text-sm text-gray-500 self-center">Password must be at least 6 characters</div>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2">
            {!isPage && <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>}
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;