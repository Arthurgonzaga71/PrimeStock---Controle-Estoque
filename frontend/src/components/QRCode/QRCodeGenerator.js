// 📁 frontend/src/components/QRCode/QRCodeGenerator.js - VERSÃO COM BANCO
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { itensService } from '../../services/api';

const QRCodeGenerator = () => {
  const [itens, setItens] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carregar itens do banco
  const loadItens = async () => {
    try {
      setLoading(true);
      const response = await itensService.getAll({ limit: 100 });
      
      if (response.data.success) {
        setItens(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItens();
  }, []);

  const qrData = selectedItem ? JSON.stringify({
    id: selectedItem.id,
    nome: selectedItem.nome,
    patrimonio: selectedItem.patrimonio,
    categoria: selectedItem.categoria?.nome,
    tipo: 'item_estoque',
    sistema: 'ControleEstoqueTI',
    url: `${window.location.origin}/itens/${selectedItem.id}`
  }) : '';

  const downloadQRCode = () => {
    // ... código de download (igual anterior)
  };

  return (
    <div>
      <h3>🔲 Gerar QR Code</h3>
      
      {/* Seletor de Itens */}
      <div style={{ marginBottom: '20px' }}>
        <label>Selecione um item: </label>
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
      </div>

      {/* QR Code */}
      {selectedItem && (
        <QRCodeSVG
          value={qrData}
          size={200}
          level="H"
          includeMargin
        />
      )}
    </div>
  );
};