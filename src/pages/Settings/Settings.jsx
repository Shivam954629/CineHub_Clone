import React, { useState, useRef } from "react";
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
  const fileInputRef = useRef();

  // Profile state
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("cinehub_display_name") ||
      user?.displayName ||
      "CineHub User",
  );
  const [avatarSrc, setAvatarSrc] = useState(
    localStorage.getItem("cinehub_avatar") || user?.photoURL || profile_img,
  );

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ Save display name
  const handleSaveProfile = () => {
    if (!displayName.trim()) {
      toast.error("Name cannot be empty!");
      return;
    }
    localStorage.setItem("cinehub_display_name", displayName);
    toast.success("Profile saved! ✅");
  };

  // ✅ Profile photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large! Max 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setAvatarSrc(base64);
      localStorage.setItem("cinehub_avatar", base64);
      toast.success("Profile photo updated! ✅");
    };
    reader.readAsDataURL(file);
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

  return (
    <div className="settings-page">
      <Navbar />
      <div className="settings-content">
        <h1>⚙️ Settings</h1>

        <div className="settings-layout">
          {/* Sidebar */}
          <div className="settings-sidebar">
            {["profile", "account", "notifications"].map((tab) => (
              <button
                key={tab}
                className={`settings-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "profile" && "👤 Profile"}
                {tab === "account" && "🔒 Account"}
                {tab === "notifications" && "🔔 Notifications"}
              </button>
            ))}
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
                    src={avatarSrc}
                    alt="profile"
                    className="settings-avatar"
                  />
                  <button
                    className="change-avatar-btn"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Change Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />
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
                    <input type="email" value={user?.email || ""} disabled />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
