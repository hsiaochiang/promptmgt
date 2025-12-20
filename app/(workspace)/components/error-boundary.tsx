"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

class Boundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Boundary caught error", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="border border-amber-200 bg-amber-50 text-amber-800 text-xs rounded-lg p-3 space-y-2">
          <div className="font-semibold">{this.props.label ?? "區塊"}發生錯誤</div>
          <div className="text-amber-700 break-words">{this.state.message}</div>
          <button
            onClick={this.handleReset}
            className="px-2 py-1 rounded-full bg-slate-900 text-white text-[11px]"
          >
            重試
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <Boundary {...props} />;
}

interface AsyncBoundaryProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  label?: string;
}

export function AsyncBoundary({ children, loading, error, onRetry, label }: AsyncBoundaryProps) {
  if (loading) {
    return (
      <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg px-3 py-2">
        {label ? `${label}載入中…` : "載入中…"}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-amber-200 bg-amber-50 text-amber-800 text-xs rounded-lg p-3 space-y-2">
        <div className="font-semibold">{label ? `${label}錯誤` : "發生錯誤"}</div>
        <div className="text-amber-700 break-words">{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-2 py-1 rounded-full bg-slate-900 text-white text-[11px]"
          >
            重試
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
