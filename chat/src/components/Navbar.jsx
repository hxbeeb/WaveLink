import React, { useState } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);


  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md rounded-b-3xl">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <img
            src="https://imgs.search.brave.com/bQqKskhFF1oYkq1c-N2Sz_5OBykjpp2U7sesZOWH12w/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9wcmlu/dC1uaWtlLWxvZ28t/YmxhY2stYmFja2dy/b3VuZC1mYWRpbmct/d2hpdGUtdmVjdG9y/LWltYWdlLTM2Nzkw/NDQ0MC5qcGc"
            alt="Logo"
            className="h-[50px] w-[50px] rounded-full shadow-md border-2 border-white"
          />
          <h1 className="text-2xl font-extrabold text-white tracking-wide">SikeChat</h1>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-8 text-white font-medium text-lg">
          <a href="#home" className="hover:underline hover:text-yellow-200 transition">Home</a>
          <a href="#features" className="hover:underline hover:text-yellow-200 transition">Features</a>
          <a href="#team" className="hover:underline hover:text-yellow-200 transition">Team</a>
          <a href="#contact" className="hover:underline hover:text-yellow-200 transition">Contact</a>
        </div>
<SignedOut>
  <SignInButton mode="modal">
    <button className="bg-yellow-300 hover:bg-yellow-400 text-black font-bold px-5 py-2 rounded-full transition duration-200 shadow-md">
      Sign In
    </button>
  </SignInButton>
</SignedOut>
<SignedIn>
  <UserButton afterSignOutUrl="/" />
</SignedIn>
        {/* Sign In Button */}
       

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-3xl">
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Nav Links */}
      {menuOpen && (
        <div className="md:hidden flex flex-col items-center pb-4 space-y-4 text-white font-medium text-lg">
          <a href="#home" onClick={() => setMenuOpen(false)} className="hover:text-yellow-200">Home</a>
          <a href="#features" onClick={() => setMenuOpen(false)} className="hover:text-yellow-200">Features</a>
          <a href="#team" onClick={() => setMenuOpen(false)} className="hover:text-yellow-200">Team</a>
          <a href="#contact" onClick={() => setMenuOpen(false)} className="hover:text-yellow-200">Contact</a>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
