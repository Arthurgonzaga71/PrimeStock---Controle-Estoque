// 📁 backend/src/routes/qrCodeRoutes.js
const express = require('express');
const { auth } = require('../middleware/auth');
const { Item, Categoria } = require('../models/associations');

const router = express.Router();

// ✅ Buscar item por ID para QR Code
router.get('/item/:id', auth, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, {
      include: [{ model: Categoria, as: 'categoria' }]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    // Dados para o QR Code
    const qrData = {
      id: item.id,
      nome: item.nome,
      patrimonio: item.patrimonio,
      categoria: item.categoria?.nome,
      quantidade: item.quantidade,
      status: item.status,
      tipo: 'item_estoque',
      sistema: 'ControleEstoqueTI',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/itens/${item.id}`,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: qrData,
      item: {
        id: item.id,
        nome: item.nome,
        patrimonio: item.patrimonio,
        categoria: item.categoria?.nome,
        quantidade: item.quantidade,
        status: item.status,
        localizacao: item.localizacao
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar item para QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar item',
      error: error.message
    });
  }
});

module.exports = router;