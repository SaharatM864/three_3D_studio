import { Component, type ReactNode } from "react";

import { RenderBackendUnavailableError } from "../backend/render-backend";

interface CanvasErrorBoundaryProps {
  fallback?: ReactNode;
  children?: ReactNode;
}

interface CanvasErrorBoundaryState {
  error: unknown;
}

export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): CanvasErrorBoundaryState {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error === null) return this.props.children;
    if (error instanceof RenderBackendUnavailableError) {
      return this.props.fallback;
    }
    throw error;
  }
}
