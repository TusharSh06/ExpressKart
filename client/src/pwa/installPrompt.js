let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent default mini-infobar
  e.preventDefault();
  deferredPrompt = e;
  // Optional: broadcast availability to app via custom event
  window.dispatchEvent(new CustomEvent("pwa-install-available"));
});

export async function triggerInstall() {
  if (!deferredPrompt) return { outcome: "no-prompt" };
  deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;
  deferredPrompt = null;
  // Optional: broadcast result
  window.dispatchEvent(new CustomEvent("pwa-install-result", { detail: choiceResult }));
  return choiceResult;
}
