import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase/config"; // Added googleProvider
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth"; // Added signInWithPopup
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Login = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        // Sign Up New User
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Login Existing User
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/"); // Redirect to home page on success
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Popup Handler
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/"); // Redirect to home page on success
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:min-h-auto bg-primary flex items-center justify-center px-4 relative">
      <Navbar />
      
      <div className="pattern" />
      
      <div className="bg-dark-200/50 backdrop-blur-md border border-white/10 p-8 lg:mt-[95px] rounded-2xl w-full max-w-md shadow-2xl z-10">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isRegistering ? "Create an Account" : "Welcome Back"}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-dark-100 text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-indigo-500 transition3s"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-dark-100 text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-indigo-500 transition3s"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 rounded-lg transition3s mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Processing..." : isRegistering ? "Sign Up" : "Sign In"}
          </button>
        </form>

        {/* ── VISUAL DIVIDER ── */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-3 text-xs font-semibold text-gray-500 uppercase">Or</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* ── GOOGLE SIGN-IN BUTTON ── */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg py-2 font-medium transition3s disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gray-400 hover:text-indigo-400 transition3s cursor-pointer"
          >
            {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Login;