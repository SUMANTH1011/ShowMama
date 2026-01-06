import React from 'react';
import { Link } from 'react-router-dom';

const AdminNavbar = () => {
  return (
    <div className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-300/30">
      <Link to="/">
        <h1 className="text-2xl font-bold cursor-pointer hover:opacity-90">
        <span className="text-[#F84565]">S</span>
        <span className="text-white">howMama</span>
        </h1>
      </Link>
    </div>
  );
};

export default AdminNavbar;
