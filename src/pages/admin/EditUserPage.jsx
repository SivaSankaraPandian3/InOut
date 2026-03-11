import React from 'react';
import { useParams } from 'react-router-dom';
import EditUser from '../../components/admin-dashboard/allusers/EditUser';

const EditUserPage = () => {
  const { userId } = useParams();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <EditUser userId={userId} pageMode />
      </div>
    </div>
  );
};

export default EditUserPage;
