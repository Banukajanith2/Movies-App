import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/config";
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

  // 🔥 Forces React to update tracking refs when mutations happen to the user object fields
  const refreshUser = () => {
    if (auth.currentUser) {
      // Cloning the object into a new shallow copy forces a React re-render
      setCurrentUser({ ...auth.currentUser });
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  return (
    // 🔥 Added refreshUser to the context value stack
    <AuthContext.Provider value={{ currentUser, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context anywhere
export const useAuth = () => useContext(AuthContext);