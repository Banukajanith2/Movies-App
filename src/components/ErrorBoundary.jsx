import { Component } from "react";

/**
 * Catches render-time errors anywhere below it so a single bad payload or thrown
 * component can't leave the user staring at a blank white document.
 * Class syntax is required — React has no hook equivalent for error boundaries.
 */
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  handleReload = () => window.location.reload();

  handleHome = () => {
    window.location.href = import.meta.env.BASE_URL;
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary-card">
          <span className="error-boundary-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </span>

          <h1 className="error-boundary-title">Something went wrong</h1>
          <p className="error-boundary-text">
            This page hit an unexpected error. Reloading usually clears it — if it keeps
            happening, head back to the home page.
          </p>

          {import.meta.env.DEV && (
            <pre className="error-boundary-detail">{String(error?.stack || error)}</pre>
          )}

          <div className="error-boundary-actions">
            <button onClick={this.handleReload} className="error-boundary-btn-primary">
              Reload page
            </button>
            <button onClick={this.handleHome} className="error-boundary-btn-secondary">
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
