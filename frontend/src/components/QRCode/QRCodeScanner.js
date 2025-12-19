// 📁 frontend/src/components/QRCode/QRCodeScanner.js
import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRCodeScanner = ({ onScan, onError }) => {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanner = () => {
    if (scanner) {
      scanner.clear();
    }

    const newScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: []
      },
      false
    );

    newScanner.render(
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.tipo === 'item_estoque') {
            onScan(data);
            newScanner.clear();
            setIsScanning(false);
          }
        } catch (error) {
          onError('QR Code inválido');
        }
      },
      (error) => {
        onError(error);
      }
    );

    setScanner(newScanner);
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
  };

  return (
    <div className="qrcode-scanner">
      <div className="scanner-header">
        <h3>📷 Scanner de QR Code</h3>
        <div className="scanner-controls">
          {!isScanning ? (
            <button onClick={startScanner} className="btn btn-success">
              🎬 Iniciar Scanner
            </button>
          ) : (
            <button onClick={stopScanner} className="btn btn-danger">
              ⏹️ Parar Scanner
            </button>
          )}
        </div>
      </div>
      
      <div id="qr-reader" className="qr-reader-container"></div>
      
      <div className="scanner-instructions">
        <h4>Como usar:</h4>
        <ol>
          <li>Clique em "Iniciar Scanner"</li>
          <li>Permita o acesso à câmera</li>
          <li>Aponte para o QR Code do item</li>
          <li>O sistema irá carregar automaticamente</li>
        </ol>
      </div>
    </div>
  );
};

export default QRCodeScanner;