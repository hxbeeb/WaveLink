import Navbar from "./components/navbar.jsx";
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
    <div className="flex flex-col min-h-screen w-full p-2 gap-4">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="text-center p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl text-white">
        <h1 className="text-5xl font-extrabold mb-4">Welcome to 💬 SikeChat</h1>
        <p className="text-xl font-light mb-2">The ultimate real-time chat app for fast, fun, and secure conversations.</p>
        <p className="italic">Join now and connect instantly with your friends and colleagues.</p>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white p-6 rounded-2xl shadow-md mx-4">
        <h2 className="text-3xl font-bold mb-4 text-indigo-700">✨ Features</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>💬 Real-time Chat</li>
          <li>😊 Emoji Picker</li>
          <li>📎 File Sharing (images, videos, docs)</li>
          <li>🌓 Dark Mode Ready</li>
          <li>📱 Responsive for All Devices</li>
        </ul>
      </section>

      {/* Privacy Section */}
      <section id="team" className="bg-gray-100 p-6 rounded-2xl shadow-md mx-4">
        <h2 className="text-3xl font-bold mb-4 text-green-700">🔒 Secure & Private</h2>
        <p className="text-gray-700">
          Your conversations are end-to-end protected. We value your privacy and never store messages longer than needed.
        </p>
      </section>

      {/* Tech Section */}
      <section className="bg-white p-6 rounded-2xl shadow-md mx-4">
        <h2 className="text-3xl font-bold mb-4 text-blue-700">⚙️ Built with Modern Tech</h2>
        <p className="text-gray-700">React.js, Tailwind CSS, Node.js, MongoDB, Express, and Socket.io for real-time updates!</p>
      </section>

      {/* Testimonials (Optional Static) */}
      <section className="bg-gray-50 p-6 rounded-2xl shadow-md mx-4">
        <h2 className="text-3xl font-bold mb-4 text-purple-700">👥 Loved by Users</h2>
        <div className="space-y-2">
          <blockquote className="italic text-gray-600">"SikeChat changed how I connect with my team!" – A User</blockquote>
          <blockquote className="italic text-gray-600">"So smooth and beautiful. Love the emojis!" – Another User</blockquote>
        </div>
      </section>

      {/* Form Section */}
      <section id="contact">
<Form />
      </section>
      <SignedIn>
  <div className="fixed bottom-6 right-6 z-50">
    <a
      href="/chat"
      className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition duration-300"
    >
      💬 Go to Chat
    </a>
  </div>
</SignedIn>
      
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
