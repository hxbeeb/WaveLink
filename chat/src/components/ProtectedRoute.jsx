import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;
