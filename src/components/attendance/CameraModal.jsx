// src/components/CameraModal.jsx
import React from 'react';

function CameraModal({
  videoRef,
  image,
  capturedTime,
  location,
  onCancel,
  onCapture,
  onRetake,
  onSubmit,
  type,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4 text-center">
        {!image ? (
          <>
            <video ref={videoRef} autoPlay className="rounded-lg w-full" />
            <div className="flex justify-between mt-4">
              <button onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
                Cancel
              </button>
              <button onClick={onCapture} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                Capture
              </button>
            </div>
          </>
        ) : (
          <>
            <img src={image} alt="Captured" className="rounded-lg w-full object-cover" />
            {capturedTime && (
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <p><span className="font-medium">Captured at:</span> {capturedTime.toLocaleTimeString()} on {capturedTime.toLocaleDateString()}</p>
                {location && (
                  <p><span className="font-medium">Location:</span> {location}</p>
                )}
              </div>
            )}
            <div className="flex justify-between mt-4">
              <button onClick={onRetake} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">
                Retake
              </button>
              <button onClick={onSubmit} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">
                Submit {type === 'check-in' ? 'Check In' : 'Check Out'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CameraModal;
