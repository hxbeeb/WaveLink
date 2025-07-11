import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-20 w-20 animate-spin-slow mb-4"
        >
          <circle cx="24" cy="24" r="24" fill="#2563eb"/>
          <path d="M8 32c4-8 12-8 16 0s12 8 16 0" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M12 24c2-4 8-4 10 0s8 4 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <span className="text-white text-xl font-semibold tracking-wide">Loading WaveLink...</span>
      </div>
    </div>
  );
  if (!isSignedIn) return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;
