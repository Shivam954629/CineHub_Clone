import React, { useState } from "react";
import "./Settings.css";
import Navbar from "../../Components/Navbar/Navbar";
import profile_img from "../../assets/profile_img.png";
import { logout } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { toast } from "react-toastify";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Profile state
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("cinehub_display_name") || "CineHub User",
  );

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Appearance state
  const [activeTheme, setActiveTheme] = useState(
    localStorage.getItem("cinehub_theme") || "Dark",
  );

  // ✅ Save display name
  const handleSaveProfile = () => {
    if (!displayName.trim()) {
      toast.error("Name cannot be empty!");
      return;
    }
    localStorage.setItem("cinehub_display_name", displayName);
    toast.success("Profile saved! ✅");
  };

  // ✅ Update password
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success("Password updated! ✅");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        toast.error("Current password is wrong!");
      } else {
        toast.error("Error updating password!");
      }
    }
  };

  // ✅ Theme change
  const handleThemeChange = (theme) => {
    setActiveTheme(theme);
    localStorage.setItem("cinehub_theme", theme);
    if (theme === "Light") {
      document.body.style.background = "#f5f5f5";
      document.body.style.color = "#000";
      toast.info("Light theme applied ☀️");
    } else {
      document.body.style.background = "#000";
      document.body.style.color = "#fff";
      toast.info("Dark theme applied 🌙");
    }
  };

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
            {/* ✅ Profile Tab */}
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
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user?.email || "user@cinehub.com"}
                      disabled
                    />
                  </div>
                  <button className="save-btn" onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* ✅ Account Tab */}
            {activeTab === "account" && (
              <div className="settings-section">
                <h2>Account & Security</h2>
                {user?.providerData[0]?.providerId === "google.com" ? (
                  <div className="google-account-msg">
                    <p>🔒 You are signed in with Google.</p>
                    <p>Password change is not available for Google accounts.</p>
                  </div>
                ) : (
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <button className="save-btn" onClick={handleUpdatePassword}>
                      Update Password
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
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

            {/* ✅ Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="settings-section">
                <h2>Appearance</h2>
                <div className="appearance-options">
                  {["Dark", "Light", "Auto"].map((theme) => (
                    <button
                      key={theme}
                      className={`theme-btn ${activeTheme === theme ? "active" : ""}`}
                      onClick={() => handleThemeChange(theme)}
                    >
                      {theme === "Dark" && "🌙"}
                      {theme === "Light" && "☀️"}
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
