import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes (login, logout, register)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Cleanup listener on unmount
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context anywhere
export const useAuth = () => useContext(AuthContext);