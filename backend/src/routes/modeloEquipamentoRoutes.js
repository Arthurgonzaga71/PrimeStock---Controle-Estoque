const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { authorize } = require('../middleware/authorize');
// REMOVI: const { validate } = require('../middleware/validation'); // ❌ NÃO EXISTE

// 🔥 FUNÇÃO AUXILIAR PARA BUSCAR MODELOS
const buscarModelosEquipamentos = async (options = {}) => {
  try {
    const query = `
      SELECT 
        me.*,
        c.nome as categoria_nome
      FROM modelos_equipamentos me
      LEFT JOIN categorias c ON me.categoria_id = c.id
      WHERE 1=1
      ${options.categoriaId ? 'AND me.categoria_id = :categoriaId' : ''}
      ${options.search ? 'AND (me.nome_modelo LIKE :search OR me.fabricante LIKE :search)' : ''}
      ORDER BY me.nome_modelo ASC
    `;

    const replacements = {};
    if (options.categoriaId) replacements.categoriaId = options.categoriaId;
    if (options.search) replacements.search = `%${options.search}%`;

    const [modelos] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Processar JSON fields
    if (Array.isArray(modelos)) {
      return modelos.map(modelo => ({
        ...modelo,
        especificacoes_padrao: modelo.especificacoes_padrao ? JSON.parse(modelo.especificacoes_padrao) : {},
        codigos_conhecidos: modelo.codigos_conhecidos ? JSON.parse(modelo.codigos_conhecidos) : []
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar modelos:', error);
    throw error;
  }
};

// 🔥 FUNÇÃO AUXILIAR PARA BUSCAR MODELO POR ID
const buscarModeloPorId = async (id) => {
  try {
    const query = `
      SELECT 
        me.*,
        c.nome as categoria_nome
      FROM modelos_equipamentos me
      LEFT JOIN categorias c ON me.categoria_id = c.id
      WHERE me.id = :id
    `;

    const [modelos] = await sequelize.query(query, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!modelos || modelos.length === 0) return null;

    const modelo = modelos[0];
    return {
      ...modelo,
      especificacoes_padrao: modelo.especificacoes_padrao ? JSON.parse(modelo.especificacoes_padrao) : {},
      codigos_conhecidos: modelo.codigos_conhecidos ? JSON.parse(modelo.codigos_conhecidos) : []
    };
  } catch (error) {
    console.error('Erro ao buscar modelo por ID:', error);
    throw error;
  }
};

// 🔥 FUNÇÃO AUXILIAR PARA CRIAR MODELO
const criarModeloEquipamento = async (dados) => {
  try {
    const query = `
      INSERT INTO modelos_equipamentos (
        nome_modelo,
        fabricante,
        categoria_id,
        especificacoes_padrao,
        codigos_conhecidos,
        criado_em
      ) VALUES (
        :nome_modelo,
        :fabricante,
        :categoria_id,
        :especificacoes_padrao,
        :codigos_conhecidos,
        NOW()
      )
    `;

    const replacements = {
      nome_modelo: dados.nome_modelo,
      fabricante: dados.fabricante || null,
      categoria_id: dados.categoria_id || null,
      especificacoes_padrao: dados.especificacoes_padrao ? JSON.stringify(dados.especificacoes_padrao) : '{}',
      codigos_conhecidos: dados.codigos_conhecidos ? JSON.stringify(dados.codigos_conhecidos) : '[]'
    };

    const [result] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.INSERT
    });

    return { id: result.insertId };
  } catch (error) {
    console.error('Erro ao criar modelo:', error);
    throw error;
  }
};

// 🔥 FUNÇÃO AUXILIAR PARA ATUALIZAR MODELO
const atualizarModeloEquipamento = async (id, dados) => {
  try {
    const campos = [];
    const replacements = { id };

    if (dados.nome_modelo !== undefined) {
      campos.push('nome_modelo = :nome_modelo');
      replacements.nome_modelo = dados.nome_modelo;
    }

    if (dados.fabricante !== undefined) {
      campos.push('fabricante = :fabricante');
      replacements.fabricante = dados.fabricante;
    }

    if (dados.categoria_id !== undefined) {
      campos.push('categoria_id = :categoria_id');
      replacements.categoria_id = dados.categoria_id;
    }

    if (dados.especificacoes_padrao !== undefined) {
      campos.push('especificacoes_padrao = :especificacoes_padrao');
      replacements.especificacoes_padrao = JSON.stringify(dados.especificacoes_padrao);
    }

    if (dados.codigos_conhecidos !== undefined) {
      campos.push('codigos_conhecidos = :codigos_conhecidos');
      replacements.codigos_conhecidos = JSON.stringify(dados.codigos_conhecidos);
    }

    if (campos.length === 0) {
      return { updated: false };
    }

    const query = `
      UPDATE modelos_equipamentos 
      SET ${campos.join(', ')}
      WHERE id = :id
    `;

    const [result] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.UPDATE
    });

    return { updated: result.affectedRows > 0 };
  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
    throw error;
  }
};

// 🔥 FUNÇÃO AUXILIAR PARA EXCLUIR MODELO
const excluirModeloEquipamento = async (id) => {
  try {
    // Verificar se modelo está sendo usado
    const queryCheck = `
      SELECT COUNT(*) as total 
      FROM solicitacao_itens 
      WHERE modelo_equipamento_id = :id
    `;

    const [result] = await sequelize.query(queryCheck, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    if (result.total > 0) {
      throw new Error('Modelo está sendo usado em solicitações');
    }

    const queryDelete = `DELETE FROM modelos_equipamentos WHERE id = :id`;
    const [deleteResult] = await sequelize.query(queryDelete, {
      replacements: { id },
      type: sequelize.QueryTypes.DELETE
    });

    return { deleted: deleteResult.affectedRows > 0 };
  } catch (error) {
    console.error('Erro ao excluir modelo:', error);
    throw error;
  }
};

// 📌 ROTAS DA API

// GET /api/modelos-equipamentos - Listar todos os modelos
router.get('/', authorize(['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista']), async (req, res) => {
  try {
    const { categoria_id, search } = req.query;
    
    const modelos = await buscarModelosEquipamentos({
      categoriaId: categoria_id,
      search: search
    });
    
    res.json({
      success: true,
      data: modelos,
      total: modelos.length
    });
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar modelos de equipamentos',
      error: error.message
    });
  }
});

// GET /api/modelos-equipamentos/:id - Buscar modelo por ID
router.get('/:id', authorize(['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico']), async (req, res) => {
  try {
    const modelo = await buscarModeloPorId(req.params.id);
    
    if (!modelo) {
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: modelo
    });
  } catch (error) {
    console.error('Erro ao buscar modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar modelo',
      error: error.message
    });
  }
});

// POST /api/modelos-equipamentos - Criar novo modelo
router.post('/', authorize(['admin', 'admin_estoque']), async (req, res) => {
  try {
    const { nome_modelo, fabricante, categoria_id, especificacoes_padrao, codigos_conhecidos } = req.body;
    
    // ✅ VALIDAÇÃO MANUAL (substitui o validate que não existe)
    if (!nome_modelo || nome_modelo.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Nome do modelo deve ter no mínimo 3 caracteres'
      });
    }
    
    if (categoria_id && isNaN(parseInt(categoria_id))) {
      return res.status(400).json({
        success: false,
        message: 'Categoria inválida'
      });
    }
    
    if (codigos_conhecidos && !Array.isArray(codigos_conhecidos)) {
      return res.status(400).json({
        success: false,
        message: 'Códigos conhecidos deve ser um array'
      });
    }
    
    // Verificar se categoria existe
    if (categoria_id) {
      const query = `SELECT id FROM categorias WHERE id = :categoria_id`;
      const [categorias] = await sequelize.query(query, {
        replacements: { categoria_id },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (categorias.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
    }
    
    const result = await criarModeloEquipamento({
      nome_modelo,
      fabricante: fabricante || null,
      categoria_id: categoria_id || null,
      especificacoes_padrao: especificacoes_padrao || {},
      codigos_conhecidos: codigos_conhecidos || []
    });
    
    const novoModelo = await buscarModeloPorId(result.id);
    
    res.status(201).json({
      success: true,
      message: 'Modelo criado com sucesso',
      data: novoModelo
    });
  } catch (error) {
    console.error('Erro ao criar modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar modelo de equipamento',
      error: error.message
    });
  }
});

// PUT /api/modelos-equipamentos/:id - Atualizar modelo
router.put('/:id', authorize(['admin', 'admin_estoque']), async (req, res) => {
  try {
    const modelo = await buscarModeloPorId(req.params.id);
    
    if (!modelo) {
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrado'
      });
    }
    
    // ✅ VALIDAÇÃO MANUAL
    const { nome_modelo, categoria_id, codigos_conhecidos } = req.body;
    
    if (nome_modelo !== undefined && nome_modelo.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Nome do modelo deve ter no mínimo 3 caracteres'
      });
    }
    
    if (categoria_id && isNaN(parseInt(categoria_id))) {
      return res.status(400).json({
        success: false,
        message: 'Categoria inválida'
      });
    }
    
    if (codigos_conhecidos !== undefined && !Array.isArray(codigos_conhecidos)) {
      return res.status(400).json({
        success: false,
        message: 'Códigos conhecidos deve ser um array'
      });
    }
    
    // Verificar se categoria existe
    if (req.body.categoria_id) {
      const query = `SELECT id FROM categorias WHERE id = :categoria_id`;
      const [categorias] = await sequelize.query(query, {
        replacements: { categoria_id: req.body.categoria_id },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (categorias.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
    }
    
    const result = await atualizarModeloEquipamento(req.params.id, req.body);
    
    if (!result.updated) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum dado para atualizar'
      });
    }
    
    const modeloAtualizado = await buscarModeloPorId(req.params.id);
    
    res.json({
      success: true,
      message: 'Modelo atualizado com sucesso',
      data: modeloAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar modelo',
      error: error.message
    });
  }
});

// DELETE /api/modelos-equipamentos/:id - Excluir modelo
router.delete('/:id', authorize(['admin', 'admin_estoque']), async (req, res) => {
  try {
    const modelo = await buscarModeloPorId(req.params.id);
    
    if (!modelo) {
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrado'
      });
    }
    
    const result = await excluirModeloEquipamento(req.params.id);
    
    if (!result.deleted) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível excluir o modelo'
      });
    }
    
    res.json({
      success: true,
      message: 'Modelo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir modelo:', error);
    
    if (error.message.includes('sendo usado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir modelo',
      error: error.message
    });
  }
});

// GET /api/modelos-equipamentos/categoria/:categoriaId - Buscar por categoria
router.get('/categoria/:categoriaId', authorize(['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico']), async (req, res) => {
  try {
    const modelos = await buscarModelosEquipamentos({
      categoriaId: req.params.categoriaId
    });
    
    res.json({
      success: true,
      data: modelos
    });
  } catch (error) {
    console.error('Erro ao buscar modelos por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar modelos por categoria',
      error: error.message
    });
  }
});

// POST /api/modelos-equipamentos/:id/codigo - Adicionar código conhecido
router.post('/:id/codigo', authorize(['admin', 'admin_estoque']), async (req, res) => {
  try {
    // ✅ VALIDAÇÃO MANUAL
    const { codigo } = req.body;
    
    if (!codigo || codigo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Código é obrigatório'
      });
    }
    
    const modelo = await buscarModeloPorId(req.params.id);
    
    if (!modelo) {
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrado'
      });
    }
    
    const codigos = modelo.codigos_conhecidos || [];
    const novoCodigo = codigo.trim().toUpperCase();
    
    if (!codigos.includes(novoCodigo)) {
      codigos.push(novoCodigo);
      
      await atualizarModeloEquipamento(req.params.id, {
        codigos_conhecidos: codigos
      });
    }
    
    const modeloAtualizado = await buscarModeloPorId(req.params.id);
    
    res.json({
      success: true,
      message: 'Código adicionado com sucesso',
      data: modeloAtualizado
    });
  } catch (error) {
    console.error('Erro ao adicionar código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar código',
      error: error.message
    });
  }
});

// DELETE /api/modelos-equipamentos/:id/codigo/:codigo - Remover código conhecido
router.delete('/:id/codigo/:codigo', authorize(['admin', 'admin_estoque']), async (req, res) => {
  try {
    const modelo = await buscarModeloPorId(req.params.id);
    
    if (!modelo) {
      return res.status(404).json({
        success: false,
        message: 'Modelo não encontrado'
      });
    }
    
    const codigos = modelo.codigos_conhecidos || [];
    const codigoParaRemover = req.params.codigo.trim().toUpperCase();
    
    const index = codigos.indexOf(codigoParaRemover);
    if (index > -1) {
      codigos.splice(index, 1);
      
      await atualizarModeloEquipamento(req.params.id, {
        codigos_conhecidos: codigos
      });
    }
    
    const modeloAtualizado = await buscarModeloPorId(req.params.id);
    
    res.json({
      success: true,
      message: 'Código removido com sucesso',
      data: modeloAtualizado
    });
  } catch (error) {
    console.error('Erro ao remover código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover código',
      error: error.message
    });
  }
});

// GET /api/modelos-equipamentos/buscar-por-codigo/:codigo - Buscar modelo por código
router.get('/buscar-por-codigo/:codigo', authorize(['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico']), async (req, res) => {
  try {
    const codigo = req.params.codigo.trim().toUpperCase();
    
    const query = `
      SELECT 
        me.*,
        c.nome as categoria_nome
      FROM modelos_equipamentos me
      LEFT JOIN categorias c ON me.categoria_id = c.id
      WHERE JSON_CONTAINS(me.codigos_conhecidos, :codigo)
      LIMIT 1
    `;

    const [modelos] = await sequelize.query(query, {
      replacements: { codigo: `"${codigo}"` },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!modelos || modelos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum modelo encontrado com este código'
      });
    }
    
    const modelo = modelos[0];
    const modeloProcessado = {
      ...modelo,
      especificacoes_padrao: modelo.especificacoes_padrao ? JSON.parse(modelo.especificacoes_padrao) : {},
      codigos_conhecidos: modelo.codigos_conhecidos ? JSON.parse(modelo.codigos_conhecidos) : []
    };
    
    res.json({
      success: true,
      data: modeloProcessado
    });
  } catch (error) {
    console.error('Erro ao buscar modelo por código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar modelo por código',
      error: error.message
    });
  }
});

module.exports = router;