import { Component, type ReactNode } from "react";
import { trackEvent } from "./analytics";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 捕获 React 渲染期错误：上报粗粒度事件（不传报错原文/堆栈，符合隐私定位），
 * 并展示兜底 UI，避免整页白屏。仅在有 code 时上报（trackEvent 内部已兜底）。
 */
export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    trackEvent("error:react");
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="grid min-h-[60vh] place-items-center p-6 text-center">
            <div>
              <p className="text-lg font-semibold">Something went wrong.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your data is safe in this browser. Try reloading the page.
              </p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
