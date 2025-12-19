// 📁 frontend/src/utils/mobileOptimizations.js
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const installPWA = () => {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botão de instalação
    showInstallPromotion();
  });

  const showInstallPromotion = () => {
    const installButton = document.createElement('button');
    installButton.innerHTML = '📱 Instalar App';
    installButton.className = 'pwa-install-btn';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: bold;
    `;
    
    installButton.onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ PWA instalado');
          installButton.remove();
        }
        
        deferredPrompt = null;
      }
    };
    
    document.body.appendChild(installButton);
  };
};

export const enableOfflineMode = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration);
      })
      .catch((error) => {
        console.log('❌ Erro no Service Worker:', error);
      });
  }
};