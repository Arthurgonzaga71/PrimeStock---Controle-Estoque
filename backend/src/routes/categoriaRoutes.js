const express = require('express');
const Categoria = require('../models/Categoria');
const { auth, authorizeProfiles } = require('../middleware/auth'); // ✅ CORRIGIDO
const { sequelize } = require('../config/database');

const router = express.Router();

// GET - Listar todas as categorias
router.get('/', auth, async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      order: [['nome', 'ASC']]
    });
    
    res.json({
      success: true,
      count: categorias.length,
      data: categorias
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categorias'
    });
  }
});

// GET - Buscar categoria por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categoria'
    });
  }
});

// POST - Criar nova categoria (apenas admin e coordenador) - ✅ CORRIGIDO
router.post('/', auth, authorizeProfiles('admin', 'admin_estoque', 'coordenador', 'gerente'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { nome, descricao } = req.body;
    
    if (!nome) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Nome é obrigatório'
      });
    }

    const categoriaExistente = await Categoria.findOne({ 
      where: { nome },
      transaction 
    });
    
    if (categoriaExistente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Já existe uma categoria com este nome'
      });
    }
    
    const categoria = await Categoria.create({
      nome,
      descricao: descricao || null
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso!',
      data: categoria
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar categoria:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao criar categoria'
    });
  }
});

// PUT - Atualizar categoria (apenas admin e coordenador) - ✅ CORRIGIDO
router.put('/:id', auth, authorizeProfiles('admin', 'admin_estoque', 'coordenador', 'gerente'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const categoria = await Categoria.findByPk(req.params.id, { transaction });
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    if (req.body.nome && req.body.nome !== categoria.nome) {
      const nomeExistente = await Categoria.findOne({
        where: { nome: req.body.nome },
        transaction
      });
      
      if (nomeExistente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Já existe uma categoria com este nome'
        });
      }
    }
    
    await categoria.update(req.body, { transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso!',
      data: categoria
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao atualizar categoria:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar categoria'
    });
  }
});

// DELETE - Deletar categoria (apenas admin) - ✅ CORRIGIDO
router.delete('/:id', auth, authorizeProfiles('admin'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const categoriaId = parseInt(req.params.id);

    if (isNaN(categoriaId)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID da categoria inválido'
      });
    }

    const categoria = await Categoria.findByPk(categoriaId, { transaction });
    
    if (!categoria) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Verificar se categoria tem itens vinculados
    const { Item } = require('../models/associations');
    const itensCount = await Item.count({
      where: { categoria_id: categoriaId },
      transaction
    });

    if (itensCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Não é possível excluir categoria com ${itensCount} item(ns) vinculado(s).`
      });
    }

    await categoria.destroy({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: 'Categoria excluída com sucesso!'
    });
  } catch (error) {
    await transaction.rollback();
    
    let mensagemErro = 'Erro ao excluir categoria';
    let statusCode = 500;

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      mensagemErro = 'Categoria possui itens vinculados.';
      statusCode = 400;
    }

    console.error('Erro ao excluir categoria:', error);
    
    res.status(statusCode).json({
      success: false,
      message: mensagemErro
    });
  }
});

module.exports = router;