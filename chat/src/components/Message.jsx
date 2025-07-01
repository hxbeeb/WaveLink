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
        <div className="bg-gray-100 p-2 rounded-2xl">
          {isImage ? (
            <img
            crossOrigin="anonymous"
              src={`http://localhost:5000${fileUrl}`}
              alt="sent file"
              className="max-w-full rounded-2xl"
            />
          ) : isVideo ? (
            <video
            crossOrigin="anonymous"
              controls
              src={`http://localhost:5000${fileUrl}`}
              className="max-w-full rounded-2xl"
            />
          ) : (
            <a
              href={`http://localhost:5000${fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {/* 📎  */}
              {message}
            </a>
          )}
          {/* {message && <div className="mt-1">{message}</div>} */}
        </div>
      ) : (
        <div
          className={`bg-green-200 p-2 rounded-t-2xl ${
            side === 'l' ? 'rounded-l-2xl' : 'rounded-r-2xl'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export default Message;
