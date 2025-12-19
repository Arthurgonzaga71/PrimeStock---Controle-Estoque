// 📁 frontend/src/components/QRCode/QRCodeManager.js - VERSÃO INTEGRADA
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { itensService } from '../../services/api';
import './QRCodeManager.css';

const QRCodeManager = () => {
  const [itens, setItens] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [scannedItem, setScannedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');

  // Carregar itens do banco
  const loadItens = async () => {
    try {
      setLoading(true);
      const response = await itensService.getAll({ limit: 100 });
      
      if (response.data.success) {
        setItens(response.data.data);
        console.log('📦 Itens carregados:', response.data.data.length);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItens();
  }, []);

  // Dados para QR Code
  const getQRData = (item) => {
    return JSON.stringify({
      id: item.id,
      nome: item.nome,
      patrimonio: item.patrimonio,
      categoria: item.categoria?.nome,
      tipo: 'item_estoque',
      sistema: 'ControleEstoqueTI',
      url: `${window.location.origin}/itens/${item.id}`,
      timestamp: new Date().toISOString()
    });
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!selectedItem) return;

    const svg = document.getElementById(`qrcode-${selectedItem.id}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode-${selectedItem.patrimonio || selectedItem.id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Handler para dados escaneados
  const handleScan = (data) => {
    console.log('✅ Item escaneado:', data);
    setScannedItem(data);
    setActiveTab('details');
    
    // Buscar informações completas do item
    loadItemDetails(data.id);
  };

  const loadItemDetails = async (itemId) => {
    try {
      const response = await itensService.getById(itemId);
      if (response.data.success) {
        setScannedItem(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes do item:', error);
    }
  };

  const handleScanError = (error) => {
    if (!error.includes('NotFoundException')) {
      console.log('⚠️ Erro no scanner:', error);
    }
  };

  return (
    <div className="qrcode-manager">
      <div className="manager-header">
        <h2>🔲 Sistema de QR Code</h2>
        <p>Gerencie QR Codes dos itens do estoque</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            🖨️ Gerar QR Code
          </button>
          <button 
            className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            📷 Scanner
          </button>
          <button 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
            disabled={!scannedItem}
          >
            📋 Detalhes
          </button>
        </div>

        <div className="tab-content">
          {/* GERADOR */}
          {activeTab === 'generate' && (
            <div className="generate-tab">
              <h3>Gerar QR Code para Item</h3>
              
              <div className="item-selector">
                <label>Selecione um item do estoque:</label>
                <select 
                  value={selectedItem?.id || ''} 
                  onChange={(e) => {
                    const item = itens.find(i => i.id === parseInt(e.target.value));
                    setSelectedItem(item);
                  }}
                  disabled={loading}
                >
                  <option value="">Selecione um item...</option>
                  {itens.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nome} {item.patrimonio ? `(${item.patrimonio})` : ''}
                    </option>
                  ))}
                </select>
                {loading && <span>Carregando itens...</span>}
              </div>

              {selectedItem && (
                <div className="qrcode-preview">
                  <div className="qrcode-card">
                    <QRCodeSVG
                      id={`qrcode-${selectedItem.id}`}
                      value={getQRData(selectedItem)}
                      size={200}
                      level="H"
                      includeMargin
                    />
                    
                    <div className="item-info">
                      <h4>{selectedItem.nome}</h4>
                      {selectedItem.patrimonio && (
                        <p><strong>Patrimônio:</strong> {selectedItem.patrimonio}</p>
                      )}
                      <p><strong>Categoria:</strong> {selectedItem.categoria?.nome}</p>
                      <p><strong>Quantidade:</strong> {selectedItem.quantidade}</p>
                      <p><strong>Status:</strong> 
                        <span className={`status-badge ${selectedItem.status}`}>
                          {selectedItem.status}
                        </span>
                      </p>
                    </div>

                    <button 
                      onClick={downloadQRCode}
                      className="download-btn"
                    >
                      📥 Download QR Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCANNER */}
          {activeTab === 'scan' && (
            <div className="scan-tab">
              <h3>Escanear QR Code</h3>
              {/* O componente Scanner vai aqui - já temos do teste */}
              <QRCodeScanner onScan={handleScan} onError={handleScanError} />
            </div>
          )}

          {/* DETALHES */}
          {activeTab === 'details' && scannedItem && (
            <div className="details-tab">
              <h3>Item Escaneado</h3>
              <div className="scanned-item-details">
                <div className="detail-card">
                  <h4>{scannedItem.nome}</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>ID:</strong> {scannedItem.id}
                    </div>
                    <div className="detail-item">
                      <strong>Patrimônio:</strong> {scannedItem.patrimonio || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Categoria:</strong> {scannedItem.categoria}
                    </div>
                    <div className="detail-item">
                      <strong>Quantidade:</strong> {scannedItem.quantidade}
                    </div>
                    <div className="detail-item">
                      <strong>Status:</strong> 
                      <span className={`status-badge ${scannedItem.status}`}>
                        {scannedItem.status}
                      </span>
                    </div>
                    {scannedItem.localizacao && (
                      <div className="detail-item">
                        <strong>Localização:</strong> {scannedItem.localizacao}
                      </div>
                    )}
                  </div>

                  <div className="action-buttons">
                    <button 
                      className="btn-primary"
                      onClick={() => window.location.href = `/itens/${scannedItem.id}`}
                    >
                      👁️ Ver Detalhes Completos
                    </button>
                    <button 
                      className="btn-warning"
                      onClick={() => window.location.href = `/movimentacoes/registrar-saida?item_id=${scannedItem.id}`}
                    >
                      📤 Registrar Saída
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => setScannedItem(null)}
                    >
                      🔄 Escanear Outro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeManager;