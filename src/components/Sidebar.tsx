import React from 'react';
import { FaHome, FaChartLine, FaBook, FaCog } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-icon active" title="Home">
        <FaHome size={24} />
      </div>
      <div className="sidebar-icon" title="Analytics">
        <FaChartLine size={24} />
      </div>
      <div className="sidebar-icon" title="Documentation">
        <FaBook size={24} />
      </div>
      <div className="sidebar-icon" title="Settings">
        <FaCog size={24} />
      </div>
    </div>
  );
};

export default Sidebar;
