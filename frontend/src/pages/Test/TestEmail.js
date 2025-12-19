// 📁 frontend/src/pages/Test/TestEmail.js - VERSÃO CORRIGIDA
import React, { useState } from 'react';
import api from '../../services/api'; // ✅ Importar api diretamente

const TestEmail = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testEmailSystem = async (type) => {
    try {
      setLoading(true);
      setTestResult(null);

      let response;
      if (type === 'test') {
        // ✅ CORREÇÃO: Usar api.post diretamente
        response = await api.post('/test/test-email', {});
      } else if (type === 'alerta') {
        response = await api.post('/test/test-alerta-estoque', {});
      }

      if (response.data.success) {
        setTestResult({
          type: 'success',
          message: response.data.message,
          data: response.data
        });
        console.log('✅ Resultado do teste:', response.data);
      }
    } catch (error) {
      setTestResult({
        type: 'error',
        message: 'Erro ao testar: ' + (error.response?.data?.message || error.message)
      });
      console.error('❌ Erro no teste:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2c3e50', textAlign: 'center' }}>
        📧 TESTE DO SISTEMA DE EMAIL
      </h1>

      <div style={{ 
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '30px'
      }}>
        <h2>🎯 Modo de Teste Ativo</h2>
        <p>Os emails serão simulados e mostrados no console do backend.</p>
        <p><strong>Verifique o terminal do backend para ver os logs!</strong></p>
      </div>

      {/* Cartões de Teste */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Teste Email Simples */}
        <div style={{ 
          border: '3px solid #3498db', 
          borderRadius: '15px', 
          padding: '25px',
          background: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2980b9' }}>📧 Email de Teste</h3>
          <p>Teste o envio de um email simples</p>
          <button 
            onClick={() => testEmailSystem('test')}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '15px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Enviando...' : '🚀 Testar Email'}
          </button>
        </div>

        {/* Teste Alerta Estoque */}
        <div style={{ 
          border: '3px solid #e74c3c', 
          borderRadius: '15px', 
          padding: '25px',
          background: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#c0392b' }}>⚠️ Alerta Estoque Baixo</h3>
          <p>Teste alerta de estoque mínimo</p>
          <button 
            onClick={() => testEmailSystem('alerta')}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '15px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Enviando...' : '🚨 Testar Alerta'}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {testResult && (
        <div style={{ 
          border: `3px solid ${testResult.type === 'success' ? '#27ae60' : '#e74c3c'}`,
          borderRadius: '15px', 
          padding: '25px',
          background: testResult.type === 'success' ? '#e8f6f3' : '#fdedec',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: testResult.type === 'success' ? '#229954' : '#c0392b' }}>
            {testResult.type === 'success' ? '✅ SUCESSO!' : '❌ ERRO'}
          </h3>
          <p>{testResult.message}</p>
          {testResult.data && (
            <div style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '8px',
              marginTop: '15px'
            }}>
              <strong>Detalhes:</strong>
              <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '10px' }}>
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Informações de Debug */}
      <div style={{ 
        padding: '20px', 
        background: '#2c3e50', 
        color: 'white',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3>🐛 Informações de Debug</h3>
        <p><strong>URL da API:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}</p>
        <p><strong>Rota de Teste:</strong> /test/test-email</p>
        <p><strong>Método:</strong> POST</p>
      </div>

      {/* Instruções */}
      <div style={{ 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '10px',
        border: '2px dashed #bdc3c7'
      }}>
        <h3>📋 O QUE FAZER:</h3>
        <ol>
          <li>Clique em um dos botões de teste acima</li>
          <li><strong>Verifique o terminal do backend</strong> para ver os logs</li>
          <li>Você deve ver mensagens como "EMAIL DE TESTE" no console</li>
          <li>Se funcionar, o sistema de email está configurado!</li>
        </ol>

        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          background: '#fff3cd',
          borderRadius: '5px',
          color: '#856404'
        }}>
          <strong>💡 Próximo Passo:</strong> Para usar emails reais, configure as variáveis de ambiente SMTP no backend.
        </div>
      </div>
    </div>
  );
};

export default TestEmail;