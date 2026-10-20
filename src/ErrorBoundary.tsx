import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="recovery" style={{ padding: 32 }}>
          <h1>Let’s try that again.</h1>
          <p>
            This view couldn’t open. Your saved plans and preferences have not
            been cleared.
          </p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Reload lilimio
          </button>
          <a className="button text" href="/learn">
            Open safety guides
          </a>
        </main>
      );
    return this.props.children;
  }
}
