import { Component } from "react";

// Catches render-time errors so a crash shows a friendly notice instead of a
// blank white screen — important for a point-of-care reference tool.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error in Plagiocephaly Assessment Tool", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="error-fallback">
          <h1>Something went wrong</h1>
          <p>The reference tool hit an unexpected error. Refresh the page to continue.</p>
          <p className="error-fallback-note">
            This is a reference tool, not a diagnostic device. No patient data is stored, so nothing is lost on refresh.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
