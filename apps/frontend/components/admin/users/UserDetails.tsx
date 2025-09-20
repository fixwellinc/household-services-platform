/**
 * User Details Component
 * Displays detailed information about a user
 */

import React from 'react';

interface UserDetailsProps {
  userId: string;
}

const UserDetails: React.FC<UserDetailsProps> = ({ userId }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">User Details</h2>
      <p className="text-gray-600">User ID: {userId}</p>
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          User details component - implementation in progress
        </p>
      </div>
    </div>
  );
};

export default UserDetails;