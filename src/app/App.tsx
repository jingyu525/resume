import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastProvider } from "@/shared/ui/toast";
import { trackPageview } from "@/shared/analytics/analytics";
import { I18nProvider } from "./providers/I18nProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { useAutoSave } from "@/features/persistence/useAutoSave";
import { LandingPage } from "@/pages/landing/LandingPage";

// 路由级代码分割：编辑器（含分页测量、富文本、撤销栈等重逻辑）按需加载，
// 首屏落地页不必下载其代码；落地页直接 import，避免首屏 Suspense 白屏
const EditorPage = lazy(() =>
  import("@/pages/editor/EditorPage").then((m) => ({ default: m.EditorPage })),
);

function AutoSaveGate() {
  useAutoSave();
  return null;
}

// SPA 路由切换时上报页面浏览（埋点默认关闭，无域名时不发起请求）
function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview();
  }, [location.pathname]);
  return null;
}

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <I18nProvider>
          <AutoSaveGate />
          <BrowserRouter basename="/resume/">
            <AnalyticsTracker />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/editor" element={<EditorPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </I18nProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
