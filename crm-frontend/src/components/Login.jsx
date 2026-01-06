import React, { useState } from "react";
import api from "../services/api";
import logo from '../assets/logo.jpg';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/login/", {
        email,
        password,
      });

    if (res.data.token) {
      localStorage.setItem("access_token", res.data.token);

    }

      onLogin(res.data.user);
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Invalid email or password");

    }

  };

  return (
    <div className="login-page">
{/*       <h2>Login</h2> */}
      <div className="login-card">

       {/* Top Logo Section */}
          <div className="sidebar-top"
            style={{
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 10
            }}
          >
            <img
              src={logo}
              alt="Accounts2Arun Logo"
              style={{
                height: "68px",
                width: "68px",
                borderRadius: "10px",
                boxShadow: "0 0 12px rgba(198, 243, 106, 0.7)",
                backgroundColor: "#0b1d2e",
                padding: "2px",
              }}
            />

            <div style={{ color: '#c6f36a', fontWeight: 850, fontSize: 22 }}>
              Accounts2Arun
            </div>

          </div>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <p className="login-subtitle">Sign in to continue</p>

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="forgot-password">
          Forgot password?
        </div>


        <button type="submit">Sign in</button>
      </form>
     </div>
     <style>{`
         @media (max-width: 600px) {
            .sidebar-top {
             justify-content: center !important;
             gap: 8px;
           }

            .sidebar-top div {
             font-size: 16px !important;
           }
         }

        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f4c81, #1b6ca8);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-card {
          width: 360px;
          background: rgba(255, 255, 255, 0.95);
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .login-title {
          text-align: center;
          margin-bottom: 4px;
        }

        .login-subtitle {
          text-align: center;
          margin-bottom: 24px;
          color: #555;
        }

        .login-card input {
          width: 100%;
          padding: 10px;
          margin-bottom: 14px;
        }

        .login-card button {
          width: 100%;
          padding: 10px;
          background: #0f4c81;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .login-card button:hover {
          background: #09345a;
        }

        .forgot-password {
          text-align: right;
          font-size: 12px;
          color: #0f4c81;
          cursor: pointer;
          margin-bottom: 16px;
        }
        .login-card {
          width: 360px;
          max-width: 90%;
          display: block;
          margin: 0 auto 20px auto;
        }
        .login-logo {
          width: 380px;
          max-width: 70%;
          height: 65px;
          display: block;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 20px;
        }


        `}
        </style>
    </div>
  );
};

export default Login;

