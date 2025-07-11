import React, { useState } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);


  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-md">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-[50px] w-[50px] rounded-full shadow-md border-2 border-white bg-white p-2"
          >
            <circle cx="24" cy="24" r="24" fill="#2563eb"/>
            <path d="M8 32c4-8 12-8 16 0s12 8 16 0" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M12 24c2-4 8-4 10 0s8 4 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">WaveLink</h1>
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
      </div>
    </nav>
  );
}

export default Navbar;
