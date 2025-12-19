// 📁 backend/src/routes/testRoutes.js - COMPLETO
const express = require('express');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// ✅ Rota para testar sistema de email
router.post('/test-email', auth, async (req, res) => {
  try {
    console.log('📧 Recebida requisição de teste de email');
    const usuario = req.usuario;
    
    const result = await emailService.sendTestEmail(usuario);
    
    console.log('✅ Email de teste processado:', result);
    
    res.json({
      success: true,
      message: 'Email de teste enviado com sucesso!',
      mode: result.mode,
      data: result.data,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('❌ Erro no teste de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de teste',
      error: error.message
    });
  }
});

// ✅ Rota para testar alerta de estoque baixo
router.post('/test-alerta-estoque', auth, async (req, res) => {
  try {
    console.log('⚠️ Recebida requisição de teste de alerta');
    const usuario = req.usuario;
    
    const itemTeste = {
      nome: 'Monitor Samsung 24" - ITEM TESTE',
      quantidade: 2,
      quantidade_minima: 5,
      patrimonio: 'TEST-002',
      localizacao: 'Almoxarifado TI'
    };

    const result = await emailService.sendEstoqueBaixo(itemTeste, usuario);
    
    console.log('✅ Alerta de estoque testado:', result);
    
    res.json({
      success: true,
      message: 'Alerta de estoque baixo testado com sucesso!',
      mode: result.mode,
      item: itemTeste,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('❌ Erro no teste de alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao testar alerta',
      error: error.message
    });
  }
});

module.exports = router;