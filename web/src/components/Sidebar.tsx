import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/account">My Account</Link>
        </li>
        <li>
          <Link to="/preferences">Preferences</Link>
        </li>
        <li>
          <Link to="/ai-settings">AI Settings</Link>
        </li>
        {/* Other links... */}
      </ul>
    </nav>
  );
};

export default Sidebar; 