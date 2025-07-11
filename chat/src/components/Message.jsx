import React from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://back-r655.onrender.com';

function Message(props) {
  const { message, side, className, fileUrl } = props;
  const fileExtension = fileUrl?.split('.').pop().toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  const isVideo = ['mp4', 'webm', 'ogg'].includes(fileExtension);

  return (
    <>
      <div
        className={`${
          side === 'l' ? 'self-end' : 'self-start'
        } w-fit max-w-[70%] ${className}`}
      >
        {fileUrl ? (
          <div className="bg-gray-800 p-2 rounded-2xl shadow-md">
            {isImage ? (
              <a
                href={`${BACKEND_URL}${fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  crossOrigin="anonymous"
                  src={`${BACKEND_URL}${fileUrl}`}
                  alt="sent file"
                  className="max-w-[320px] max-h-[320px] w-auto h-auto rounded-2xl cursor-pointer transition-transform duration-200 hover:scale-105 object-contain"
                />
              </a>
            ) : isVideo ? (
              <video
                crossOrigin="anonymous"
                controls
                src={`${BACKEND_URL}${fileUrl}`}
                className="max-w-[320px] max-h-[320px] w-auto h-auto rounded-2xl object-contain"
              />
            ) : (
              <a
                href={`${BACKEND_URL}${fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline break-all"
              >
                {message}
              </a>
            )}
          </div>
        ) : (
          <div
            className={`p-3 shadow-md text-base font-medium break-words ${
              side === 'l'
                ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white rounded-t-2xl rounded-l-2xl'
                : 'bg-gray-700 text-gray-100 rounded-t-2xl rounded-r-2xl'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </>
  );
}

export default Message;

