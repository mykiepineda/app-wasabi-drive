import React, { useState } from "react";

const AuthContext = React.createContext({
  user: null,
  token: null,
  isLoggedIn: false,
  login: (user, token) => {},
  logout: () => {},
});

export const AuthContextProvider = ({ children }) => {
  const { initialLoggedInUser, initialToken } =
    localStorage.getItem("authentication") || {};
  const [user, setUser] = useState(initialLoggedInUser);
  const [token, setToken] = useState(initialToken);

  const isLoggedIn = !!token;

  const loginHandler = (loggedInUser, token) => {
    setUser(loggedInUser);
    setToken(token);
    localStorage.setItem("authentication", { loggedInUser, token });
  };

  const logoutHandler = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authentication");
  };

  const contextValue = {
    user,
    token,
    isLoggedIn,
    login: loginHandler,
    logout: logoutHandler,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
