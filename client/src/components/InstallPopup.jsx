import { useEffect, useState } from "react";

export default function InstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPopup(true);
    };

    // Check if the app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        console.log('App is already installed');
        return;
      }
      window.addEventListener('beforeinstallprompt', handler);
    };

    // Initial check
    checkIfInstalled();

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }
    
    try {
      console.log('Prompting installation');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setDeferredPrompt(null);
      setShowPopup(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-[90%] max-w-md text-center shadow-xl animate-fadeIn">
        <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-blue-600 dark:text-blue-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Install ExpressKart
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
          Add ExpressKart to your home screen for faster access and a better shopping experience.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={installApp}
            className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity"
          >
            Install Now
          </button>

          <button
            onClick={() => setShowPopup(false)}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
