import React from 'react';

function ActionButton({ type, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-6 rounded-full bg-blue-600 text-white font-semibold text-sm shadow hover:bg-blue-700 transition duration-200"
    >
      {type === 'check-in' ? 'Check In' : 'Check Out'}
    </button>
  );
}

export default ActionButton;
