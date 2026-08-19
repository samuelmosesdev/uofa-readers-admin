import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Network } from "@capacitor/network";
import { useNavigate } from "react-router-dom";

/**
 * Mount once near the root (inside BrowserRouter), e.g. in App.jsx:
 *   <NativeBootstrap />
 *
 * Handles:
 * - Hide splash when React is ready
 * - Status bar colors
 * - Android hardware back button
 * - Online / offline banner
 */
export default function NativeBootstrap() {
  const navigate = useNavigate();
  const [offline, setOffline] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let backSub;
    let netSub;

    (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0a0f1e" });
      } catch {
        /* web / unsupported */
      }

      try {
        // Let first paint finish, then hide splash
        await new Promise((r) => setTimeout(r, 300));
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }

      // Android back: go back in history, or exit on root
      backSub = await CapApp.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack || window.history.length > 1) {
          navigate(-1);
        } else {
          CapApp.exitApp();
        }
      });

      try {
        const status = await Network.getStatus();
        setOffline(!status.connected);
        netSub = await Network.addListener("networkStatusChange", (s) => {
          setOffline(!s.connected);
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      backSub?.remove();
      netSub?.remove();
    };
  }, [isNative, navigate]);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] bg-amber-600 px-3 py-2 text-center text-xs font-medium text-white"
      style={{
        paddingTop: "max(0.5rem, var(--safe-area-inset-top, env(safe-area-inset-top, 0px)))",
      }}
    >
      You’re offline. Some features need internet. Cached pages may still work.
    </div>
  );
}
