import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryFallbackProps {
  error: Error;
  reset: () => void;
}

interface ErrorBoundaryProps {
  fallback: (props: ErrorBoundaryFallbackProps) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Contains render errors to one widget so the rest of the page keeps working. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) this.props.onError(error, info);
    else console.error(error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    return error ? this.props.fallback({ error, reset: this.reset }) : this.props.children;
  }
}
