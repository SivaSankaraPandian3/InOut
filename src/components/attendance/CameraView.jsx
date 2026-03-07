import React, { forwardRef, useEffect } from 'react';

const CameraView = forwardRef((props, ref) => {
  useEffect(() => {
    if (ref?.current) {
      ref.current.play().catch(err => {
        console.warn('Autoplay error:', err);
      });
    }
  }, [ref]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow bg-black">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="w-full h-80 object-cover aspect-video"
        style={{ backgroundColor: 'black',
          transform: 'scaleX(-1)',
          WebkitTransform: 'scaleX(-1)' }}
      />
    </div>
  );
});

export default CameraView;
