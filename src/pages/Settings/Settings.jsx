import React, { useState } from "react";
import "./Settings.css";
import Navbar from "../../Components/Navbar/Navbar";
import profile_img from "../../assets/profile_img.png";
import { logout } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const user = auth.currentUser;

  return (
    <div className="settings-page">
      <Navbar />
      <div className="settings-content">
        <h1>⚙️ Settings</h1>

        <div className="settings-layout">
          {/* Sidebar */}
          <div className="settings-sidebar">
            {["profile", "account", "notifications", "appearance"].map(
              (tab) => (
                <button
                  key={tab}
                  className={`settings-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "profile" && "👤 Profile"}
                  {tab === "account" && "🔒 Account"}
                  {tab === "notifications" && "🔔 Notifications"}
                  {tab === "appearance" && "🎨 Appearance"}
                </button>
              ),
            )}
            <button
              className="settings-tab signout-tab"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              🚪 Sign Out
            </button>
          </div>

          {/* Content */}
          <div className="settings-body">
            {activeTab === "profile" && (
              <div className="settings-section">
                <h2>Profile</h2>
                <div className="profile-avatar-section">
                  <img
                    src={profile_img}
                    alt="profile"
                    className="settings-avatar"
                  />
                  <button className="change-avatar-btn">Change Photo</button>
                </div>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input type="text" defaultValue="CineHub User" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || "user@cinehub.com"}
                      disabled
                    />
                  </div>
                  <button className="save-btn">Save Changes</button>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="settings-section">
                <h2>Account & Security</h2>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <button className="save-btn">Update Password</button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="settings-section">
                <h2>Notifications</h2>
                <div className="toggle-list">
                  {[
                    "New movie releases",
                    "Watchlist updates",
                    "Trending alerts",
                    "Email notifications",
                  ].map((item) => (
                    <div key={item} className="toggle-item">
                      <span>{item}</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="settings-section">
                <h2>Appearance</h2>
                <div className="appearance-options">
                  {["Dark", "Light", "Auto"].map((theme) => (
                    <button
                      key={theme}
                      className={`theme-btn ${theme === "Dark" ? "active" : ""}`}
                    >
                      {theme === "Dark" && "🌙"} {theme === "Light" && "☀️"}{" "}
                      {theme === "Auto" && "🔄"} {theme}
                    </button>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: "24px" }}>
                  <label>Language</label>
                  <select className="sort-select">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
