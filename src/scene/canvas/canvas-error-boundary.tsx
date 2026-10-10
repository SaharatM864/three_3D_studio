import { Component, type ReactNode } from "react";

import { WebGPUUnavailableError } from "./webgpu-support";

interface CanvasErrorBoundaryProps {
  fallback?: ReactNode;
  onFallback?: () => void;
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

  componentDidCatch(error: unknown) {
    if (error instanceof WebGPUUnavailableError) this.props.onFallback?.();
  }

  render() {
    const { error } = this.state;
    if (error === null) return this.props.children;
    if (error instanceof WebGPUUnavailableError) {
      return this.props.fallback;
    }
    throw error;
  }
}
