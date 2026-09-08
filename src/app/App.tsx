import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/shared/ui/toast";
import { I18nProvider } from "./providers/I18nProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { useAutoSave } from "@/features/persistence/useAutoSave";
import { LandingPage } from "@/pages/landing/LandingPage";
import { EditorPage } from "@/pages/editor/EditorPage";

function AutoSaveGate() {
  useAutoSave();
  return null;
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <I18nProvider>
          <AutoSaveGate />
          <BrowserRouter basename="/resume/">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/editor" element={<EditorPage />} />
            </Routes>
          </BrowserRouter>
        </I18nProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
