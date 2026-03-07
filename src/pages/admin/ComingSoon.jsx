import React from "react";

function ComingSoon() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-100 px-4 overflow-hidden">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-3">
          🚧 Page under construction
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          We’re currently working on requested page and exciting new features to improve your
          experience. Please check back soon.
        </p>
      </div>
    </div>
  );
}

export default ComingSoon;
