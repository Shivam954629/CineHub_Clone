import React, { useState } from "react";
import "./Login.css";
import { login, signup, googleLogin } from "../../firebase";
import spinner from "../../assets/spinner.gif";

const Login = () => {
  const [signState, setSignState] = useState("Sign In");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const user_auth = async (event) => {
    event.preventDefault();
    setLoading(true);
    if (signState === "Sign In") {
      await login(email, password);
    } else {
      await signup(name, email, password);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await googleLogin();
    setLoading(false);
  };

  return loading ? (
    <div className="login-spinner">
      <img src={spinner} className="login-logo" alt="" />
    </div>
  ) : (
    <div className="login">
      <h1 className="cinehub-logo">
        CINE<span>HUB</span>
      </h1>

      <div className="login-form">
        <h2>{signState}</h2>
        <form>
          {signState === "Sign Up" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Your name"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button onClick={user_auth} type="submit">
            {signState}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
            />
            Continue with Google
          </button>

          <div className="form-help">
            <label className="remember">
              <input type="checkbox" />
              Remember Me
            </label>
            <a href="#" className="help-link">
              Need Help?
            </a>
          </div>
        </form>

        <div className="form-switch">
          {signState === "Sign In" ? (
            <p>
              New to CineHub?{" "}
              <span onClick={() => setSignState("Sign Up")}>Sign Up Now</span>
            </p>
          ) : (
            <p>
              Already have account?{" "}
              <span onClick={() => setSignState("Sign In")}>Sign In Now</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
