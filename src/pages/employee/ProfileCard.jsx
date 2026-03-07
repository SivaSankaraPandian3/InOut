import './ProfileCard.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';

export default function ProfileCard() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bloodGroup: "",
    address: "",
    position: "",
    company: "",
    salary: 0,
    role: "employee",
    profilePic: "",
    department: "",
    qualification: "",
    dateOfJoining: "",
    rolesAndResponsibility: [],
    skills: [],
    bankDetails: {
      bankingName: "",
      bankAccountNumber: "",
      ifscCode: "",
      upiId: ""
    }
  });

  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  const [previewSrc, setPreviewSrc] = useState(null);

  // Fetch user profile data from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(API_ENDPOINTS.getProfile, {
          headers: { Authorization: `Bearer ${token}` }
        }); // Adjust endpoint as needed

        // Normalize response and merge with defaults to avoid undefined nested fields
        const data = response.data || {};
        const normalized = {
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          bloodGroup: data.bloodGroup || "",
          address: data.address || "",
          position: data.position || "",
          company: data.company || "",
          salary: data.salary ?? 0,
          role: data.role || "employee",
          profilePic: data.profilePic || "",
          department: data.department || "",
          qualification: data.qualification || "",
          dateOfJoining: data.dateOfJoining || "",
          rolesAndResponsibility: Array.isArray(data.rolesAndResponsibility) ? data.rolesAndResponsibility : [],
          skills: Array.isArray(data.skills) ? data.skills : [],
          bankDetails: {
            bankingName: (data.bankDetails && data.bankDetails.bankingName) || "",
            bankAccountNumber: (data.bankDetails && data.bankDetails.bankAccountNumber) || "",
            ifscCode: (data.bankDetails && data.bankDetails.ifscCode) || "",
            upiId: (data.bankDetails && data.bankDetails.upiId) || ""
          }
        };

        setProfile(normalized);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Cleanup preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewSrc) {
        try { URL.revokeObjectURL(previewSrc); } catch (e) { /* ignore */ }
      }
    };
  }, [previewSrc]);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField, field, value) => {
    setProfile(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...profile[field]];
    newArray[index] = value;
    setProfile(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const addArrayItem = (field) => {
    setProfile(prev => ({
      ...prev,
      [field]: [...prev[field], "New Item"]
    }));
  };

  const removeArrayItem = (field, index) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const toggleEdit = (section) => {
    setEditing(editing === section ? null : section);
  };

  const saveChanges = async () => {
    const token = localStorage.getItem('token');
    try {
      // Ensure salary is sent as a number
      const payload = {
        ...profile,
        salary: profile.salary === '' || profile.salary === null ? 0 : Number(profile.salary)
      };
      console.log('Saving profile with payload:', payload);
      await axios.put(API_ENDPOINTS.updateProfile, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditing(null);
      // Small success feedback
      try {
        Swal.fire({ icon: 'success', title: 'Profile updated', text: 'Your profile was updated successfully', timer: 1500, showConfirmButton: false });
      } catch (e) { /* ignore */ }
    } catch (error) {
      console.error('Error updating profile:', error);
  try { Swal.fire({ icon: 'error', title: 'Update failed', text: 'Failed to update profile. See console for details.' }); } catch (e) { /* ignore */ }
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Left Column */}
        <div className="column">
          {/* Basic Information Card */}
          <div className="card">
            <div className="card-header">
              <h3>Basic Information</h3>
              <button 
                className="edit-btn" 
                onClick={() => toggleEdit('basicInfo')}
              >
                {editing === 'basicInfo' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="basic-info">
              <div className="left">
                <img
                  src={previewSrc || profile.profilePic || "/default-avatar.jpg"}
                  alt="Profile"
                  className="avatar"
                />
                {editing === 'basicInfo' ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <h2>{profile.name}</h2>
                )}
                {editing === 'basicInfo' && (
                  <div className="info-item upload-block">
                    <label className="upload-label">Change Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={async (e) => {
                        if (uploading) return;
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;

                        // create local preview
                        let localUrl = null;
                        try {
                          localUrl = URL.createObjectURL(file);
                          setPreviewSrc(localUrl);
                        } catch (err) {
                          console.error('Could not create preview', err);
                        }

                        // Client-side guards
                        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                          try { Swal.fire({ icon: 'warning', title: 'Invalid file type', text: 'Only JPG and PNG are allowed.' }); } catch (e) {}
                          if (localUrl) URL.revokeObjectURL(localUrl);
                          setPreviewSrc(null);
                          return;
                        }
                        if (file.size > MAX_FILE_SIZE) {
                          try { Swal.fire({ icon: 'warning', title: 'File too large', text: 'Maximum allowed size is 2 MB.' }); } catch (e) {}
                          if (localUrl) URL.revokeObjectURL(localUrl);
                          setPreviewSrc(null);
                          return;
                        }

                        const token = localStorage.getItem('token');
                        const form = new FormData();
                        form.append('profilePic', file);
                        setUploading(true);
                        try {
                          const res = await axios.post(API_ENDPOINTS.uploadProfile, form, {
                            headers: {
                              Authorization: `Bearer ${token}`,
                              'Content-Type': 'multipart/form-data'
                            }
                          });
                          // backend returns updated user
                          const updated = res.data;
                          setProfile(prev => ({ ...prev, profilePic: updated.profilePic || '' }));
                          // clear preview
                          if (localUrl) URL.revokeObjectURL(localUrl);
                          setPreviewSrc(null);
                        } catch (err) {
                          console.error('Upload failed', err);
                          try { Swal.fire({ icon: 'error', title: 'Upload failed', text: 'Image upload failed' }); } catch (e) {}
                          // keep preview so user can retry or choose another
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                    {uploading && <div className="small">Uploading...</div>}
                  </div>
                )}
                
                <div className="info-item">
                   Email: 
                  {editing === 'basicInfo' ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{profile.email}</span>
                  )}
                </div>
                <div className="info-item">
                   Phone: 
                  {editing === 'basicInfo' ? (
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{profile.phone}</span>
                  )}
                </div>
                <div className="info-item">
                   Address: 
                  {editing === 'basicInfo' ? (
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{profile.address}</span>
                  )}
                </div>
                <div className="info-item">
                   Blood Group: 
                  {editing === 'basicInfo' ? (
                    <input
                      type="text"
                      value={profile.bloodGroup}
                      onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{profile.bloodGroup}</span>
                  )}
                </div>
              </div>
            </div>
            {editing === 'basicInfo' && (
              <button className="save-btn" onClick={saveChanges}>
                Save Changes
              </button>
            )}
          </div>

          {/* Education Card */}
          <div className="card">
            <div className="card-header">
              <h3>Education & Qualification</h3>
              <button 
                className="edit-btn" 
                onClick={() => toggleEdit('education')}
              >
                {editing === 'education' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="education-info">
              <div className="info-row">
                 Qualification: 
                {editing === 'education' ? (
                  <input
                    type="text"
                    value={profile.qualification}
                    onChange={(e) => handleInputChange('qualification', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.qualification}</span>
                )}
              </div>
            </div>
            {editing === 'education' && (
              <button className="save-btn" onClick={saveChanges}>
                Save Changes
              </button>
            )}
          </div>

          {/* Skills Card */}
          <div className="card">
            <div className="card-header">
              <h3>Skills</h3>
              <button 
                className="edit-btn" 
                onClick={() => toggleEdit('skills')}
              >
                {editing === 'skills' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="skills-info">
              {profile.skills.map((skill, index) => (
                <div key={index} className="skill-item-container">
                  {editing === 'skills' ? (
                    <>
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                        className="edit-input skill-input"
                      />
                      <button 
                        className="remove-skill-btn"
                        onClick={() => removeArrayItem('skills', index)}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="skill-item">{skill}</div>
                  )}
                </div>
              ))}
              {editing === 'skills' && (
                <button className="add-skill-btn" onClick={() => addArrayItem('skills')}>
                  + Add Skill
                </button>
              )}
            </div>
            {editing === 'skills' && (
              <button className="save-btn" onClick={saveChanges}>
                Save Changes
              </button>
            )}
          </div>

          {/* Roles & Responsibilities Card */}
          <div className="card">
            <div className="card-header">
              <h3>Roles & Responsibilities</h3>
              <button 
                className="edit-btn" 
                onClick={() => toggleEdit('rolesAndResponsibility')}
              >
                {editing === 'rolesAndResponsibility' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="roles-info">
              {profile.rolesAndResponsibility.map((role, index) => (
                <div key={index} className="role-item-container">
                  {editing === 'rolesAndResponsibility' ? (
                    <>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => handleArrayChange('rolesAndResponsibility', index, e.target.value)}
                        className="edit-input role-input"
                      />
                      <button 
                        className="remove-role-btn"
                        onClick={() => removeArrayItem('rolesAndResponsibility', index)}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="role-item">• {role}</div>
                  )}
                </div>
              ))}
              {editing === 'rolesAndResponsibility' && (
                <button className="add-role-btn" onClick={() => addArrayItem('rolesAndResponsibility')}>
                  + Add Responsibility
                </button>
              )}
            </div>
            {editing === 'rolesAndResponsibility' && (
              <button className="save-btn" onClick={saveChanges}>
                Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="column">
          {/* Personal Details Card */}
          {/* <div className="card">
            <div className="card-header">
              <h3>Personal Details</h3>
              <button 
                className="edit-btn" 
                onClick={() => toggleEdit('personalDetails')}
              >
                {editing === 'personalDetails' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="personal-details">
              <div className="info-row">
                 Blood Group: 
                {editing === 'personalDetails' ? (
                  <select
                    value={profile.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="edit-select"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <span>{profile.bloodGroup}</span>
                )}
              </div>
              <div className="info-row">
                 Role: 
                {editing === 'personalDetails' ? (
                  <select
                    value={profile.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="edit-select"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <span>{profile.role}</span>
                )}
              </div>
            </div>
            {editing === 'personalDetails' && (
              <button className="save-btn" onClick={saveChanges}>
                Save Changes
              </button>
            )}
          </div> */}

          {/* Banking Details Card */}
          <div className="card">
            <div className="card-header">
              <h3>Banking Details</h3>
              <button 
                className="edit-btn" 
                onClick={() => toggleEdit('bankDetails')}
              >
                {editing === 'bankDetails' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="banking-info">
              <div className="info-row">
                 Bank Name: 
                {editing === 'bankDetails' ? (
                  <input
                    type="text"
                    value={profile.bankDetails.bankingName}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'bankingName', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.bankDetails.bankingName}</span>
                )}
              </div>
              <div className="info-row">
                 Account Number: 
                {editing === 'bankDetails' ? (
                  <input
                    type="text"
                    value={profile.bankDetails.bankAccountNumber}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'bankAccountNumber', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.bankDetails.bankAccountNumber}</span>
                )}
              </div>
              <div className="info-row">
                 IFSC Code: 
                {editing === 'bankDetails' ? (
                  <input
                    type="text"
                    value={profile.bankDetails.ifscCode}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'ifscCode', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.bankDetails.ifscCode}</span>
                )}
              </div>
              <div className="info-row">
                 UPI ID: 
                {editing === 'bankDetails' ? (
                  <input
                    type="text"
                    value={profile.bankDetails.upiId}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'upiId', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.bankDetails.upiId}</span>
                )}
              </div>
            </div>
            {editing === 'bankDetails' && (
              <button className="save-btn" onClick={saveChanges}>
                Save Changes
              </button>
            )}
          </div>

          {/* Company & Position Card */}
          <div className="card">
            <div className="card-header">
              <h3>Company & Position</h3>
              <button 
                className="edit-btn" 
                onClick={() => toggleEdit('company')}
              >
                {editing === 'company' ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="company-info">
              <div className="info-row">
                 Position: 
                {editing === 'company' ? (
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.position}</span>
                )}
              </div>
              <div className="info-row">
                 Company: 
                {editing === 'company' ? (
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.company}</span>
                )}
              </div>
              <div className="info-row">
                 Department: 
                {editing === 'company' ? (
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.department}</span>
                )}
              </div>
              <div className="info-row">
                 Salary: 
                {editing === 'company' ? (
                  <input
                    type="number"
                    value={profile.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>${Number(profile.salary).toLocaleString()}/year</span>
                )}
              </div>
              <div className="info-row">
                 Date of Joining: 
                {editing === 'company' ? (
                  <input
                    type="date"
                    value={profile.dateOfJoining ? new Date(profile.dateOfJoining).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('dateOfJoining', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span>{profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : 'Not set'}</span>
                )}
              </div>
            </div>
            {editing === 'company' && (
              <button className="save-btn" onClick={saveChanges}>
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}