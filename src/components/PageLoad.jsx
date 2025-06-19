import { useEffect, useState } from "react";
import Spinner from "./Spinner.jsx"; // or any other loading UI
import App from "../App.jsx"; // main app

export default function PageLoad() {
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowApp(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showApp ? (
        <App />
      ) : (
        <div className="fixed inset-0 bg-dark-100 flex items-center justify-center z-99">
          <Spinner />
        </div>
      )}
    </>
  );
};
