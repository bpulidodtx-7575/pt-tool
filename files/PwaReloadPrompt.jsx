import { useRegisterSW } from "virtual:pwa-register/react";
import { ReloadPromptView } from "./components";

// Thin wrapper around vite-plugin-pwa's useRegisterSW. It owns the build-only
// virtual module and feeds plain props to the pure ReloadPromptView, so the UI
// stays unit-testable without mocking the service-worker registration. Rendered
// only from main.jsx (no test imports it), keeping the virtual module out of Vitest.
export default function PwaReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <ReloadPromptView
      offlineReady={offlineReady}
      needRefresh={needRefresh}
      onReload={() => updateServiceWorker(true)}
      onClose={close}
    />
  );
}
