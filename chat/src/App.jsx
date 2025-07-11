import Navbar from "./components/Navbar.jsx";
import React from "react";
import Form from "./components/Form.jsx";
import Chat from "./components/Chat.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
const App = () => {
  return (
    <Router>
      <Routes>
      <Route
  path="/"
  element={
    <div className="flex flex-col min-h-screen w-full bg-black text-white relative overflow-hidden">
      <Navbar />
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1500&q=80" alt="waves background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-black opacity-60"></div>
      </div>
      <main className="flex flex-1 flex-col items-center justify-center z-10 relative">
        <h1 className="text-4xl font-extrabold mb-4 text-white drop-shadow-lg">Welcome to WaveLink</h1>
        <p className="text-lg text-gray-300 mb-8 text-center max-w-xl drop-shadow">A modern, real-time chat app for fast, fun, and secure conversations. Sign in to start chatting with your friends and colleagues!</p>
        <SignedIn>
          <a
            href="/chat"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:scale-105 hover:shadow-blue-400/50 transition duration-300 text-lg"
          >
            Go to Chat
          </a>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:scale-105 hover:shadow-blue-400/50 transition duration-300 text-lg"
            >
              Login to get started
            </button>
          </SignInButton>
        </SignedOut>
      </main>
    </div>
  }
/>


        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
