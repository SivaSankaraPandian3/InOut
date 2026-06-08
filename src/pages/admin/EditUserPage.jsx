import React from 'react';
import { useParams } from 'react-router-dom';
import EditUser from '../../components/admin-dashboard/allusers/EditUser';

const EditUserPage = () => {
  const { userId } = useParams();

  return (
    <div className="uc-profile-page">
      <div className="uc-profile-shell">
        <EditUser userId={userId} pageMode />
      </div>
    </div>
  );
};

export default EditUserPage;
