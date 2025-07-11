import React from 'react';

function Message(props) {
  const { message, side, className, fileUrl } = props;
  const fileExtension = fileUrl?.split('.').pop().toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  const isVideo = ['mp4', 'webm', 'ogg'].includes(fileExtension);

  return (
    <div
      className={`${
        side === 'l' ? 'self-end' : 'self-start'
      } w-fit max-w-[70%] ${className}`}
    >
      {fileUrl ? (
        <div className="bg-gray-800 p-2 rounded-2xl shadow-md">
          {isImage ? (
            <img
              crossOrigin="anonymous"
              src={`https://back-r655.onrender.com${fileUrl}`}
              alt="sent file"
              className="max-w-full rounded-2xl"
            />
          ) : isVideo ? (
            <video
              crossOrigin="anonymous"
              controls
              src={`https://back-r655.onrender.com${fileUrl}`}
              className="max-w-full rounded-2xl"
            />
          ) : (
            <a
              href={`https://back-r655.onrender.com${fileUrl}`}
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
  );
}

export default Message;
