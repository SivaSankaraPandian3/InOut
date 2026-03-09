import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Building, 
  Shield, 
  Eye, 
  EyeOff, 
  Edit3, 
  Mail, 
  Phone, 
  GraduationCap,
  CreditCard,
  User,
  ChevronDown,
  ChevronUp,
  X,
  Droplet
} from 'lucide-react';
import urbancodeLogoSrc from '../../../assets/uclogo.png';
import jobzenterLogoSrc from '../../../assets/jzlogo.png';

const UserCard = ({ user, className = '', onEdit, forceExpanded = false, onClose }) => {
  const [showBankingDetails, setShowBankingDetails] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!!forceExpanded);

  const formatBankingDetails = (details) => {
    if (!details) return null;

    return {
      accountNumber: showBankingDetails ? details.bankAccountNumber : `****${details.bankAccountNumber?.slice(-4) || ''}`,
      ifscCode: showBankingDetails ? details.ifscCode : `****${details.ifscCode?.slice(-4) || ''}`,
      bankName: details.bankingName,
      upiId: details.upiId ? (showBankingDetails ? details.upiId : `****${details.upiId.split('@')[0].slice(-2)}@${details.upiId.split('@')[1]}`) : null
    };
  };

  const getCompanyLogo = (company) => {
    return company.toLowerCase() === 'jobzenter' ?jobzenterLogoSrc: urbancodeLogoSrc ;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formattedBankingDetails = formatBankingDetails(user.bankDetails);

  if (!isExpanded) {
    return (
      <div 
        className={`relative w-full hover:bg-blue-50 hover:border-blue-200 rounded-xl border bg-white p-3 shadow-sm transition-all duration-300 cursor-pointer ${className}`}
        onClick={() => setIsExpanded(true)}
      >
        <div className={`absolute top-3 right-3 w-5 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} ></div>


        <div className="flex items-center gap-4">
          <div className="relative">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={`${user.name}'s avatar`}
                className={`w-16 h-16 rounded-full object-cover ring-2 ring-gray-200 p-1 `}
              />
            ) : (
              <div className={`w-16 h-16 text-3xl font-semibold rounded-full flex justify-center items-center ring-2 ring-gray-200 p-1 `}>{(user.name || 'U').charAt(0)}</div>
            )}
            <img
              src={getCompanyLogo(user.company)}
              alt={`${user.company} logo`}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white ring-2 p-0.5 object-contain ring-white"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-600 truncate">{user.name}</h3>
            <p className="text-sm font-semibold text-gray-600 truncate">{user.position}</p>
            <div className="flex items-center gap-1 mt-1">
              <Building className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500 truncate">{user.company}</span>
            </div>
          </div>

          <ChevronDown className="w-5 h-5 text-gray-400 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full  hover:border-blue-200 mx-auto rounded-xl border bg-white p-4 shadow-lg group transition-all duration-300 hover:shadow-xl ${className}`}>
      <button 
        onClick={() => {
          setIsExpanded(false);
          if (onClose) onClose();
        }}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
      >
        <X className="w-7 h-7 text-gray-500 bg-gray-200 rounded-full" />
      </button>
      
     

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column - Big Profile Picture and Basic Info */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          <div className="relative mb-6">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={`${user.name}'s avatar`}
                className={`w-36 h-36 rounded-full object-cover shadow-md p-1`}
              />
            ) : (
              <img
                src={'https://www.pikpng.com/pngl/m/154-1540525_male-user-filled-icon-my-profile-icon-png.png'}
                alt={`${user.name}'s avatar`}
                className={`w-36 h-36 rounded-full object-cover shadow-md p-1`}
              />
            )}
            <img
              src={getCompanyLogo(user.company)}
              alt={`${user.company} logo`}
              className={`absolute -bottom-4 -right-4 w-14 h-14 ring-gray-200 rounded-full bg-white object-contain`}
            />
          </div>

          <div className="w-full text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-3xl font-bold text-gray-900">{user.name}</h3>
              
            </div>

            <div className="text-lg text-gray-700 font-medium">
              {user.position} at {user.company}
            </div>

            {user.skills.length>0 && (<div className="text-sm border px-3 py-1 rounded-full text-gray-500">
              Skills
            </div>)}

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {user.skills?.map((skill, i) => (
                <span key={i} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  {skill}
                </span>
              ))}
             
            </div>
          </div>
          {onEdit && (
            <button
              onClick={() => onEdit(user._id)}
              className="mt-8 border-2 text-sm text-gray-600 px-2 py-1 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-medium"
            >
              <div className="flex items-center justify-center gap-3">
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </div>
            </button>
          )}
        </div>

        {/* Right Column - Detailed Information */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* Personal Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work Information */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Work Information
              </h4>
              <div className="space-y-3 text-gray-700">
                {user.department && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>{user.department}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>Joined {formatDate(user.dateOfJoining)}</span>
                </div>
                {user.qualification && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span>{user.qualification}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Details
                </h4>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="font-mono break-all">
                    {user.email}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="font-mono">
                    {user.phone}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Droplet className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="font-mono">
                    {user.bloodGroup||'N/A'}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="font-mono">
                    {user.address|| 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Roles and Responsibilities */}
          {user.rolesAndResponsibility?.length > 0 && (
            <div className="border rounded-xl p-5 bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Roles & Responsibilities</h4>
              <ul className="space-y-2 text-gray-700">
                {user.rolesAndResponsibility.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-2.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Banking Details */}
          {formattedBankingDetails && (
            <div className="border border-red-100 rounded-xl p-5 bg-red-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  Banking Details
                </h4>
                <button
                  onClick={() => setShowBankingDetails(!showBankingDetails)}
                  className="h-8 w-8 p-1.5 rounded hover:bg-red-100 flex items-center justify-center"
                >
                  {showBankingDetails ? (
                    <EyeOff className="w-5 h-5 text-red-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-red-600" />
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Bank Name</div>
                  <div className="font-medium">{formattedBankingDetails.bankName || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Account Number</div>
                  <div className="font-mono">{formattedBankingDetails.accountNumber || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">IFSC Code</div>
                  <div className="font-mono">{formattedBankingDetails.ifscCode || 'Not provided'}</div>
                </div>
                {formattedBankingDetails.upiId && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">UPI ID</div>
                    <div className="font-mono break-all">{formattedBankingDetails.upiId}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer with timestamps */}
          <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 pt-4 border-t">
            <div>
              <span className="font-medium">Account Created: </span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            <div>
              <span className="font-medium">Last Updated: </span>
              <span>{formatDate(user.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;