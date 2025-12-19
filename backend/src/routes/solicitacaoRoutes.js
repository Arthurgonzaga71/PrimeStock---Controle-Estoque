// CORRIGIDO: solicitacaoRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const Solicitacao = require('../models/Solicitacao');
const SolicitacaoItem = require('../models/SolicitacaoItens');
const HistoricoSolicitacao = require('../models/HistoricoSolicitacoes');

// REMOVIDO: syncModels não é necessário
// REMOVIDO: Funções canCreateSolicitacao, canApproveSolicitacao, canProcessEstoque - são verificações inline

// 🆕 POST /api/solicitacoes - Criar nova solicitação (CORRIGIDO)
router.post('/', auth, async (req, res) => {
    console.log('📝 [CORRIGIDA - SEM LIMITE DE ITENS] Criando nova solicitação...');
    
    try {
        const allowedProfiles = ['admin', 'admin_estoque', 'tecnico', 'analista', 'coordenador', 'gerente'];
        if (!allowedProfiles.includes(req.user?.perfil)) {
            return res.status(403).json({
                success: false,
                error: 'Permissão negada. Perfil não autorizado'
            });
        }

        const {
            titulo,
            descricao = '',
            prioridade = 'media',
            tipo = 'equipamento',
            tipo_solicitacao = 'retirada_estoque',
            orcamento_estimado = null,
            fornecedor_sugerido = '',
            link_referencia = '',
            urgencia_compra = 'media',
            data_devolucao_prevista = null,
            itens = []
        } = req.body;

        console.log('📋 Dados recebidos:', { 
            titulo, 
            itens_count: itens?.length || 0, 
            user: req.user.id,
            user_perfil: req.user.perfil 
        });

        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Título é obrigatório'
            });
        }

        // 🔧 SOLUÇÃO DEFINITIVA: Query direta
        const ano = new Date().getFullYear();
        
        // 1. Gerar código
        const [ultimaSolicitacao] = await sequelize.query(
            `SELECT id, codigo_solicitacao FROM solicitacoes 
             WHERE codigo_solicitacao LIKE ?
             ORDER BY id DESC LIMIT 1`,
            {
                replacements: [`SOL-${ano}-%`],
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        let sequencia = 1;
        if (ultimaSolicitacao?.codigo_solicitacao) {
            const match = ultimaSolicitacao.codigo_solicitacao.match(/SOL-\d+-(\d+)/);
            if (match && match[1]) {
                sequencia = parseInt(match[1]) + 1;
            }
        }
        
        const codigo_solicitacao = `SOL-${ano}-${sequencia.toString().padStart(3, '0')}`;
        console.log('🔧 Código gerado:', codigo_solicitacao);
        
        // 2. INSERIR SOLICITAÇÃO (CORRIGIDO: sem atualizado_em, que não existe)
        const [result] = await sequelize.query(
            `INSERT INTO solicitacoes (
                codigo_solicitacao,
                usuario_solicitante_id,
                titulo,
                descricao,
                prioridade,
                tipo,
                tipo_solicitacao,
                orcamento_estimado,
                fornecedor_sugerido,
                link_referencia,
                urgencia_compra,
                data_devolucao_prevista,
                status,
                nivel_aprovacao_atual
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
                replacements: [
                    codigo_solicitacao,
                    req.user.id,
                    titulo.trim(),
                    descricao.trim(),
                    prioridade,
                    tipo,
                    tipo_solicitacao,
                    orcamento_estimado || null,
                    fornecedor_sugerido || '',
                    link_referencia || '',
                    urgencia_compra,
                    data_devolucao_prevista || null,
                    'rascunho',
                    1
                ],
                type: sequelize.QueryTypes.INSERT
            }
        );

        const solicitacaoId = result;
        
        // 3. Inserir itens (se houver)
        if (itens && itens.length > 0) {
            for (const item of itens) {
                await sequelize.query(
                    `INSERT INTO solicitacao_itens (
                        solicitacao_id, 
                        nome_item, 
                        quantidade_solicitada, 
                        tipo_item,
                        motivo_uso,
                        valor_unitario_estimado,
                        fornecedor,
                        link_produto,
                        urgencia,
                        especificacoes_tecnicas,
                        especificacoes,
                        status_item
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    {
                        replacements: [
                            solicitacaoId,
                            item.nome_item || 'Item sem nome',
                            item.quantidade_solicitada || 1,
                            item.tipo_item || 'estoque',
                            item.motivo_uso || '',
                            item.valor_unitario_estimado || null,
                            item.fornecedor || '',
                            item.link_produto || '',
                            item.urgencia || 'normal',
                            JSON.stringify(item.especificacoes_tecnicas || {}),
                            JSON.stringify(item.especificacoes || {}),
                            'pendente'
                        ],
                        type: sequelize.QueryTypes.INSERT
                    }
                );
            }
            console.log('✅ Itens inseridos:', itens.length);
        }

        // 4. Registrar histórico
        await sequelize.query(
            `INSERT INTO historico_solicitacoes (
                solicitacao_id, 
                usuario_id, 
                acao, 
                descricao,
                dados_alterados
            ) VALUES (?, ?, 'criacao', ?, ?)`,
            {
                replacements: [
                    solicitacaoId,
                    req.user.id,
                    `Solicitação "${titulo}" criada com ${itens?.length || 0} item(ns)`,
                    JSON.stringify({
                        titulo,
                        prioridade,
                        tipo,
                        tipo_solicitacao,
                        status: 'rascunho'
                    })
                ],
                type: sequelize.QueryTypes.INSERT
            }
        );

        console.log('🎉 Solicitação criada com SUCESSO! ID:', solicitacaoId);

        res.status(201).json({
            success: true,
            data: {
                id: solicitacaoId,
                codigo_solicitacao: codigo_solicitacao,
                titulo: titulo.trim(),
                status: 'rascunho',
                itens_count: itens?.length || 0,
                message: 'Solicitação criada com sucesso!'
            }
        });

    } catch (error) {
        console.error('❌ ERRO ao criar solicitação:', error.message);
        console.error('❌ Stack trace:', error.stack);
        
        let errorMessage = 'Erro interno do servidor ao criar solicitação';
        
        if (error.name === 'SequelizeDatabaseError') {
            if (error.message.includes('Table')) {
                errorMessage = 'Erro no banco de dados. Tabela não encontrada.';
            } else if (error.message.includes('column')) {
                errorMessage = 'Erro no banco de dados. Coluna não encontrada: ' + error.message;
            }
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                sql: error.sql
            } : undefined
        });
    }
});

// 📝 PUT /api/solicitacoes/:id - Atualizar solicitação (CORRIGIDO)
router.put('/:id', auth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const {
            titulo,
            descricao,
            prioridade,
            tipo,
            tipo_solicitacao,
            orcamento_estimado,
            fornecedor_sugerido,
            link_referencia,
            urgencia_compra,
            data_devolucao_prevista,
            itens = []
        } = req.body;

        console.log('✏️ Atualizando solicitação:', id);
        console.log('📦 Itens recebidos:', itens?.length || 0, 'itens');

        const [solicitacao] = await sequelize.query(
            `SELECT * FROM solicitacoes 
             WHERE id = ? AND status = 'rascunho'`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!solicitacao) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Solicitação não encontrada ou não pode ser editada (não está em rascunho)'
            });
        }

        if (solicitacao.usuario_solicitante_id !== req.user.id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                error: 'Você não tem permissão para editar esta solicitação'
            });
        }

        // CORRIGIDO: Usar 'data_atualizacao' que é o nome correto da coluna (não atualizado_em)
        await sequelize.query(
            `UPDATE solicitacoes SET
                titulo = COALESCE(?, titulo),
                descricao = COALESCE(?, descricao),
                prioridade = COALESCE(?, prioridade),
                tipo = COALESCE(?, tipo),
                tipo_solicitacao = COALESCE(?, tipo_solicitacao),
                orcamento_estimado = COALESCE(?, orcamento_estimado),
                fornecedor_sugerido = COALESCE(?, fornecedor_sugerido),
                link_referencia = COALESCE(?, link_referencia),
                urgencia_compra = COALESCE(?, urgencia_compra),
                data_devolucao_prevista = COALESCE(?, data_devolucao_prevista)
            WHERE id = ?`,
            {
                replacements: [
                    titulo,
                    descricao,
                    prioridade,
                    tipo,
                    tipo_solicitacao,
                    orcamento_estimado,
                    fornecedor_sugerido,
                    link_referencia,
                    urgencia_compra,
                    data_devolucao_prevista,
                    id
                ],
                transaction,
                type: sequelize.QueryTypes.UPDATE
            }
        );

        if (Array.isArray(itens)) {
            await sequelize.query(
                `DELETE FROM solicitacao_itens WHERE solicitacao_id = ?`,
                {
                    replacements: [id],
                    transaction,
                    type: sequelize.QueryTypes.DELETE
                }
            );

            for (const item of itens) {
                await sequelize.query(
                    `INSERT INTO solicitacao_itens (
                        solicitacao_id, 
                        item_id,
                        modelo_equipamento_id,
                        nome_item, 
                        quantidade_solicitada, 
                        tipo_item, 
                        valor_unitario_estimado, 
                        fornecedor, 
                        link_produto, 
                        motivo_uso, 
                        urgencia,
                        especificacoes_tecnicas,
                        especificacoes,
                        status_item
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
                    {
                        replacements: [
                            id,
                            item.item_id || null,
                            item.modelo_equipamento_id || null,
                            item.nome_item || 'Item sem nome',
                            item.quantidade_solicitada || 1,
                            item.tipo_item || 'estoque',
                            item.valor_unitario_estimado || null,
                            item.fornecedor || '',
                            item.link_produto || '',
                            item.motivo_uso || '',
                            item.urgencia || 'normal',
                            JSON.stringify(item.especificacoes_tecnicas || {}),
                            JSON.stringify(item.especificacoes || {})
                        ],
                        transaction,
                        type: sequelize.QueryTypes.INSERT
                    }
                );
            }
        }

        await sequelize.query(
            `INSERT INTO historico_solicitacoes (
                solicitacao_id, 
                usuario_id, 
                acao, 
                descricao,
                dados_alterados
            ) VALUES (?, ?, 'edicao', ?, ?)`,
            {
                replacements: [
                    id,
                    req.user.id,
                    `Solicitação atualizada`,
                    JSON.stringify({
                        titulo_anterior: solicitacao.titulo,
                        titulo_novo: titulo || solicitacao.titulo,
                        status: 'rascunho',
                        itens_count: itens?.length || 0
                    })
                ],
                transaction,
                type: sequelize.QueryTypes.INSERT
            }
        );

        await transaction.commit();

        console.log('✅ Solicitação atualizada:', id);

        res.json({
            success: true,
            data: {
                id: parseInt(id),
                message: 'Solicitação atualizada com sucesso'
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Erro ao atualizar solicitação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao atualizar solicitação: ' + error.message
        });
    }
});

// 📤 PUT /api/solicitacoes/:id/enviar - Enviar para aprovação
// 📤 PUT /api/solicitacoes/:id/enviar - ENVIAR PARA APROVAÇÃO (VERSÃO DEFINITIVA)
router.put('/:id/enviar', auth, async (req, res) => {
    console.log('📤 [ENVIAR] Enviando solicitação ID:', req.params.id);
    
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        
        // 1. Buscar a solicitação
        const [solicitacao] = await sequelize.query(
            `SELECT * FROM solicitacoes WHERE id = ?`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!solicitacao) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Solicitação não encontrada'
            });
        }

        console.log('📊 Status atual:', {
            id: solicitacao.id,
            status: solicitacao.status || '(vazio)',
            titulo: solicitacao.titulo,
            solicitante_id: solicitacao.usuario_solicitante_id,
            usuario_atual_id: req.user.id
        });

        // 2. Verificar permissões
        if (solicitacao.usuario_solicitante_id !== req.user.id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                error: 'Apenas o solicitante pode enviar para aprovação'
            });
        }

        // 3. Normalizar status
        const statusAtual = (solicitacao.status || '').trim().toLowerCase();
        const statusFinal = statusAtual === '' ? 'rascunho' : statusAtual;

        console.log('🔧 Status processado:', {
            original: `"${solicitacao.status}"`,
            processado: `"${statusFinal}"`
        });

        // 4. Verificar se pode enviar
        if (statusFinal !== 'rascunho') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: `Solicitação não pode ser enviada no status "${statusFinal}". Apenas rascunhos podem ser enviados.`
            });
        }

        // 5. Verificar se tem itens
        const [itensResult] = await sequelize.query(
            `SELECT COUNT(*) as count FROM solicitacao_itens WHERE solicitacao_id = ?`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (itensResult.count === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: 'Solicitação precisa ter pelo menos um item para enviar'
            });
        }

        // 6. Atualizar para 'pendente'
        await sequelize.query(
            `UPDATE solicitacoes SET status = 'pendente' WHERE id = ?`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.UPDATE
            }
        );

        // 7. Registrar histórico
        await sequelize.query(
            `INSERT INTO historico_solicitacoes (
                solicitacao_id, 
                usuario_id, 
                acao, 
                descricao,
                dados_alterados
            ) VALUES (?, ?, 'envio_aprovacao', ?, ?)`,
            {
                replacements: [
                    id,
                    req.user.id,
                    `Solicitação enviada para aprovação`,
                    JSON.stringify({ 
                        status_anterior: statusFinal,
                        status_novo: 'pendente',
                        observacoes: 'Enviada pelo solicitante'
                    })
                ],
                transaction,
                type: sequelize.QueryTypes.INSERT
            }
        );

        await transaction.commit();

        console.log('✅ ENVIADA COM SUCESSO!', {
            id,
            status_anterior: statusFinal,
            status_novo: 'pendente'
        });

        // 8. Retornar sucesso
        res.json({
            success: true,
            data: {
                id: parseInt(id),
                status: 'pendente',
                message: 'Solicitação enviada para aprovação com sucesso!',
                detalhes: {
                    codigo: solicitacao.codigo_solicitacao,
                    titulo: solicitacao.titulo,
                    data_envio: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ ERRO AO ENVIAR:', error.message);
        console.error('❌ Stack trace:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Erro interno ao enviar solicitação para aprovação',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ POST /api/solicitacoes/:id/aprovar - Aprovar solicitação (NOVO ENDPOINT)
router.put('/:id/aprovar', auth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { observacoes = '' } = req.body;
        
        console.log('✅ [APROVAR] Aprovando solicitação ID:', id);

        // 1. Verificar permissões do usuário
        const userProfile = req.user.perfil;
        const allowedProfiles = ['admin', 'admin_estoque', 'coordenador', 'gerente'];
        
        if (!allowedProfiles.includes(userProfile)) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                error: 'Apenas administradores, coordenadores ou gerentes podem aprovar solicitações'
            });
        }

        // 2. Buscar solicitação
        const [solicitacao] = await sequelize.query(
            `SELECT * FROM solicitacoes 
             WHERE id = ? AND status = 'pendente'`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!solicitacao) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Solicitação não encontrada ou não está pendente de aprovação'
            });
        }

        // 3. Verificar se não é o próprio solicitante
        if (solicitacao.usuario_solicitante_id === req.user.id) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: 'Você não pode aprovar sua própria solicitação'
            });
        }

        // 4. Atualizar status para 'aprovada'
        await sequelize.query(
            `UPDATE solicitacoes SET 
                status = 'aprovada',
                usuario_aprovador_id = ?
             WHERE id = ?`,
            {
                replacements: [req.user.id, id],
                transaction,
                type: sequelize.QueryTypes.UPDATE
            }
        );

        // 5. Atualizar status dos itens
        await sequelize.query(
            `UPDATE solicitacao_itens SET 
                status_item = 'aprovado'
             WHERE solicitacao_id = ?`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.UPDATE
            }
        );

        // 6. Registrar histórico
        await sequelize.query(
            `INSERT INTO historico_solicitacoes (
                solicitacao_id, 
                usuario_id, 
                acao, 
                descricao,
                dados_alterados
            ) VALUES (?, ?, 'aprovacao', ?, ?)`,
            {
                replacements: [
                    id,
                    req.user.id,
                    `Solicitação aprovada por ${req.user.nome} (${userProfile})`,
                    JSON.stringify({ 
                        status_anterior: 'pendente',
                        status_novo: 'aprovada',
                        aprovador_id: req.user.id,
                        aprovador_perfil: userProfile,
                        observacoes: observacoes
                    })
                ],
                transaction,
                type: sequelize.QueryTypes.INSERT
            }
        );

        await transaction.commit();

        console.log('✅ Solicitação APROVADA:', {
            id,
            aprovador: req.user.nome,
            perfil: userProfile
        });

        res.json({
            success: true,
            data: {
                id: parseInt(id),
                status: 'aprovada',
                aprovador: {
                    id: req.user.id,
                    nome: req.user.nome,
                    perfil: userProfile
                },
                message: 'Solicitação aprovada com sucesso!'
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Erro ao aprovar solicitação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao aprovar solicitação: ' + error.message
        });
    }
});

// ❌ PUT /api/solicitacoes/:id/rejeitar - Rejeitar solicitação (MANTIDO)
router.put('/:id/rejeitar', auth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { motivo_rejeicao = '' } = req.body;
        
        console.log('❌ [REJEITAR] Rejeitando solicitação ID:', id);

        if (!motivo_rejeicao.trim()) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: 'Motivo da rejeição é obrigatório'
            });
        }

        const userProfile = req.user.perfil;
        const allowedProfiles = ['admin', 'admin_estoque', 'coordenador', 'gerente'];
        
        if (!allowedProfiles.includes(userProfile)) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                error: 'Apenas administradores, coordenadores ou gerentes podem rejeitar solicitações'
            });
        }

        const [solicitacao] = await sequelize.query(
            `SELECT * FROM solicitacoes 
             WHERE id = ? AND status = 'pendente'`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!solicitacao) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Solicitação não encontrada ou não está pendente'
            });
        }

        if (solicitacao.usuario_solicitante_id === req.user.id) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: 'Você não pode rejeitar sua própria solicitação'
            });
        }

        // 🔧 CORREÇÃO 5: Remover data_aprovacao (não existe)
        await sequelize.query(
            `UPDATE solicitacoes SET 
                status = 'rejeitada',
                usuario_aprovador_id = ?,
                motivo_rejeicao = ?
                -- REMOVIDO: data_aprovacao = NOW() (coluna não existe)
             WHERE id = ?`,
            {
                replacements: [req.user.id, motivo_rejeicao, id],
                transaction,
                type: sequelize.QueryTypes.UPDATE
            }
        );

        await sequelize.query(
            `UPDATE solicitacao_itens SET 
                status_item = 'rejeitado',
                observacao_aprovador = ?
             WHERE solicitacao_id = ?`,
            {
                replacements: [`Rejeitado: ${motivo_rejeicao}`, id],
                transaction,
                type: sequelize.QueryTypes.UPDATE
            }
        );

        await sequelize.query(
            `INSERT INTO historico_solicitacoes (
                solicitacao_id, 
                usuario_id, 
                acao, 
                descricao,
                dados_alterados
            ) VALUES (?, ?, 'rejeicao', ?, ?)`,
            {
                replacements: [
                    id,
                    req.user.id,
                    `Solicitação rejeitada por ${req.user.nome} (${userProfile})`,
                    JSON.stringify({ 
                        status_anterior: 'pendente',
                        status_novo: 'rejeitada',
                        rejeitador_id: req.user.id,
                        rejeitador_perfil: userProfile,
                        motivo_rejeicao: motivo_rejeicao
                    })
                ],
                transaction,
                type: sequelize.QueryTypes.INSERT
            }
        );

        await transaction.commit();

        console.log('✅ Solicitação REJEITADA:', {
            id,
            rejeitador: req.user.nome,
            motivo: motivo_rejeicao
        });

        res.json({
            success: true,
            data: {
                id: parseInt(id),
                status: 'rejeitada',
                rejeitador: {
                    id: req.user.id,
                    nome: req.user.nome,
                    perfil: userProfile
                },
                message: 'Solicitação rejeitada com sucesso'
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Erro ao rejeitar solicitação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao rejeitar solicitação: ' + error.message
        });
    }
});

// 🔍 GET /api/solicitacoes - TODAS AS SOLICITAÇÕES COM PESQUISA AVANÇADA (CORRIGIDO)
router.get('/', auth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            prioridade,
            tipo,
            departamento,
            dataInicio,
            dataFim,
            usuario,
            sortBy = 'data_solicitacao',
            sortOrder = 'DESC'
        } = req.query;

        console.log('🔍 Buscando solicitações com filtros:', req.query);

        let whereConditions = ['1=1'];
        const replacements = {};

        if (search) {
            whereConditions.push(`(
                s.codigo_solicitacao LIKE :search OR 
                s.titulo LIKE :search OR 
                s.descricao LIKE :search OR
                u.nome LIKE :search
            )`);
            replacements.search = `%${search}%`;
        }

        if (status) {
            whereConditions.push('s.status = :status');
            replacements.status = status;
        }

        if (prioridade) {
            whereConditions.push('s.prioridade = :prioridade');
            replacements.prioridade = prioridade;
        }

        if (tipo) {
            whereConditions.push('s.tipo = :tipo');
            replacements.tipo = tipo;
        }

        if (departamento) {
            whereConditions.push('u.departamento = :departamento');
            replacements.departamento = departamento;
        }

        if (usuario) {
            whereConditions.push('s.usuario_solicitante_id = :usuario');
            replacements.usuario = usuario;
        }

        if (dataInicio) {
            whereConditions.push('s.data_solicitacao >= :dataInicio');
            replacements.dataInicio = dataInicio;
        }

        if (dataFim) {
            whereConditions.push('s.data_solicitacao <= :dataFim');
            replacements.dataFim = dataFim + ' 23:59:59';
        }

        const whereClause = whereConditions.join(' AND ');
        const offset = (page - 1) * limit;

        const solicitacoes = await sequelize.query(
            `SELECT 
                s.id,
                s.codigo_solicitacao,
                s.titulo,
                s.descricao,
                s.prioridade,
                s.tipo,
                s.status,
                s.data_solicitacao,
                s.tipo_solicitacao,
                s.orcamento_estimado,
                s.fornecedor_sugerido,
                u.nome as solicitante_nome,
                u.departamento,
                u.email as solicitante_email,
                (SELECT COUNT(*) FROM solicitacao_itens si WHERE si.solicitacao_id = s.id) as total_itens,
                (SELECT SUM(si.quantidade_solicitada * COALESCE(si.valor_unitario_estimado, 0)) 
                 FROM solicitacao_itens si WHERE si.solicitacao_id = s.id) as valor_total_estimado
             FROM solicitacoes s
             JOIN usuarios u ON s.usuario_solicitante_id = u.id
             WHERE ${whereClause}
             ORDER BY ${sortBy} ${sortOrder}
             LIMIT :limit OFFSET :offset`,
            {
                replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
                type: sequelize.QueryTypes.SELECT
            }
        );

        const [countResult] = await sequelize.query(
            `SELECT COUNT(*) as total
             FROM solicitacoes s
             JOIN usuarios u ON s.usuario_solicitante_id = u.id
             WHERE ${whereClause}`,
            {
                replacements,
                type: sequelize.QueryTypes.SELECT
            }
        );

        const total = countResult?.total || 0;

        console.log('✅ Solicitações encontradas:', solicitacoes?.length || 0);

        res.json({
            success: true,
            data: {
                solicitacoes: solicitacoes || [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                },
                filters: req.query
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar solicitações:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao buscar solicitações: ' + error.message
        });
    }
});

// 📋 GET /api/solicitacoes/minhas - Minhas solicitações (MANTIDO)
router.get('/minhas', auth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            prioridade,
            dataInicio,
            dataFim
        } = req.query;

        console.log('📦 Buscando minhas solicitações:', req.user.id);

        let whereConditions = ['s.usuario_solicitante_id = :userId'];
        const replacements = { userId: req.user.id };

        if (search) {
            whereConditions.push(`(
                s.codigo_solicitacao LIKE :search OR 
                s.titulo LIKE :search OR 
                s.descricao LIKE :search
            )`);
            replacements.search = `%${search}%`;
        }

        if (status) {
            whereConditions.push('s.status = :status');
            replacements.status = status;
        }

        if (prioridade) {
            whereConditions.push('s.prioridade = :prioridade');
            replacements.prioridade = prioridade;
        }

        if (dataInicio) {
            whereConditions.push('s.data_solicitacao >= :dataInicio');
            replacements.dataInicio = dataInicio;
        }

        if (dataFim) {
            whereConditions.push('s.data_solicitacao <= :dataFim');
            replacements.dataFim = dataFim + ' 23:59:59';
        }

        const whereClause = whereConditions.join(' AND ');
        const offset = (page - 1) * limit;

        const solicitacoes = await sequelize.query(
            `SELECT 
                s.id,
                s.codigo_solicitacao,
                s.titulo,
                s.descricao,
                s.prioridade,
                s.tipo,
                s.status,
                s.data_solicitacao,
                s.tipo_solicitacao,
                s.orcamento_estimado,
                s.fornecedor_sugerido,
                (SELECT COUNT(*) FROM solicitacao_itens si WHERE si.solicitacao_id = s.id) as total_itens,
                (SELECT MAX(data_acao) FROM historico_solicitacoes hs WHERE hs.solicitacao_id = s.id) as ultima_atualizacao
             FROM solicitacoes s
             WHERE ${whereClause}
             ORDER BY s.data_solicitacao DESC
             LIMIT :limit OFFSET :offset`,
            {
                replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
                type: sequelize.QueryTypes.SELECT
            }
        );

        const [countResult] = await sequelize.query(
            `SELECT COUNT(*) as total
             FROM solicitacoes s
             WHERE ${whereClause}`,
            {
                replacements,
                type: sequelize.QueryTypes.SELECT
            }
        );

        const total = countResult?.total || 0;

        console.log('✅ Minhas solicitações encontradas:', solicitacoes?.length || 0);

        res.json({
            success: true,
            data: {
                solicitacoes: solicitacoes || [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar minhas solicitações:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao buscar minhas solicitações: ' + error.message
        });
    }
});

// 📋 GET /api/solicitacoes/pendentes - Solicitações pendentes de aprovação (SIMPLIFICADO)
router.get('/pendentes', auth, async (req, res) => {
    try {
        const userProfile = req.user.perfil;
        const allowedProfiles = ['admin', 'admin_estoque', 'coordenador', 'gerente'];
        
        if (!allowedProfiles.includes(userProfile)) {
            return res.status(403).json({
                success: false,
                error: 'Apenas administradores, coordenadores ou gerentes podem ver solicitações pendentes'
            });
        }

        const { search } = req.query;
        let whereClause = "s.status = 'pendente'";
        const replacements = [];

        if (search) {
            whereClause += ` AND (s.codigo_solicitacao LIKE ? OR s.titulo LIKE ? OR u.nome LIKE ?)`;
            const searchTerm = `%${search}%`;
            replacements.push(searchTerm, searchTerm, searchTerm);
        }

        const solicitacoes = await sequelize.query(
            `SELECT 
                s.id,
                s.codigo_solicitacao,
                s.titulo,
                s.prioridade,
                s.tipo,
                s.data_solicitacao,
                u.nome as solicitante_nome,
                u.departamento
             FROM solicitacoes s
             JOIN usuarios u ON s.usuario_solicitante_id = u.id
             WHERE ${whereClause}
             ORDER BY s.data_solicitacao DESC`,
            {
                replacements,
                type: sequelize.QueryTypes.SELECT
            }
        );

        res.json({
            success: true,
            data: solicitacoes || [],
            count: solicitacoes?.length || 0,
            message: `Encontradas ${solicitacoes?.length || 0} solicitações pendentes`
        });

    } catch (error) {
        console.error('❌ Erro ao buscar solicitações pendentes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao buscar solicitações pendentes: ' + error.message
        });
    }
});

// 🏭 GET /api/solicitacoes/para-estoque - Solicitações aprovadas para o estoque (CORRIGIDO)
// 🏭 GET /api/solicitacoes/para-estoque - Solicitações para o estoque (VERSÃO CORRIGIDA)
// 🏭 GET /api/solicitacoes/para-estoque - Solicitações para o estoque (VERSÃO COMPLETA)
// 🏭 GET /api/solicitacoes/para-estoque - VERSÃO CORRIGIDA COM COLUNAS QUE EXISTEM
router.get('/para-estoque', auth, async (req, res) => {
    try {
        const { search, status } = req.query;

        console.log('🏭 [ESTOQUE] Buscando solicitações para estoque');

        const userProfile = req.user.perfil;
        if (!['admin', 'admin_estoque'].includes(userProfile)) {
            return res.status(403).json({
                success: false,
                error: 'Apenas administradores ou responsáveis pelo estoque podem ver esta lista'
            });
        }

        // Status que aparecem na tela do estoque
        let whereClause = "s.status IN ('aprovada', 'processando_estoque', 'entregue', 'rejeitada_estoque')";
        const replacements = [];

        if (status) {
            whereClause = "s.status = ?";
            replacements.push(status);
        }

        if (search) {
            whereClause += ` AND (s.codigo_solicitacao LIKE ? OR s.titulo LIKE ? OR u.nome LIKE ?)`;
            const searchTerm = `%${search}%`;
            replacements.push(searchTerm, searchTerm, searchTerm);
        }

        console.log('📊 [ESTOQUE] Buscando com WHERE:', whereClause);

        // CONSULTA CORRIGIDA - VERIFIQUE AS COLUNAS REAIS DA SUA TABELA
        const solicitacoes = await sequelize.query(
            `SELECT 
                s.id,
                s.codigo_solicitacao,
                s.titulo,
                s.descricao,
                s.prioridade,
                s.tipo,
                s.status,
                s.data_solicitacao,
                -- NÃO TEMOS data_aprovacao, então usamos data_atualizacao ou NULL
                NULL as data_aprovacao,
                -- NÃO TEMOS observacoes_entrega, temos observacoes_estoque ou motivo_rejeicao
                COALESCE(s.observacoes_estoque, s.motivo_rejeicao) as observacoes_entrega,
                s.motivo_rejeicao,
                u.nome as solicitante_nome,
                u.departamento,
                u_aprov.nome as aprovador_nome,
                -- Estatísticas
                (SELECT COUNT(*) FROM solicitacao_itens si WHERE si.solicitacao_id = s.id) as total_itens,
                (SELECT SUM(si.quantidade_solicitada) FROM solicitacao_itens si WHERE si.solicitacao_id = s.id) as quantidade_total,
                (SELECT SUM(si.quantidade_entregue) FROM solicitacao_itens si WHERE si.solicitacao_id = s.id) as quantidade_entregue,
                s.usuario_aprovador_id
             FROM solicitacoes s
             JOIN usuarios u ON s.usuario_solicitante_id = u.id
             LEFT JOIN usuarios u_aprov ON s.usuario_aprovador_id = u_aprov.id
             WHERE ${whereClause}
             ORDER BY 
                 CASE s.status 
                     WHEN 'aprovada' THEN 1
                     WHEN 'processando_estoque' THEN 2
                     WHEN 'entregue' THEN 3
                     WHEN 'rejeitada_estoque' THEN 4
                     ELSE 5
                 END,
                 s.data_solicitacao DESC`,
            {
                replacements,
                type: sequelize.QueryTypes.SELECT
            }
        );

        console.log('✅ [ESTOQUE] Solicitações encontradas:', solicitacoes?.length || 0);
        
        // Log para debug
        if (solicitacoes && solicitacoes.length > 0) {
            console.log('📋 Exemplo de dados retornados:', {
                id: solicitacoes[0].id,
                codigo: solicitacoes[0].codigo_solicitacao,
                titulo: solicitacoes[0].titulo,
                status: solicitacoes[0].status,
                campos: Object.keys(solicitacoes[0])
            });
        }

        res.json({
            success: true,
            data: solicitacoes || [],
            count: solicitacoes?.length || 0,
            message: `Encontradas ${solicitacoes?.length || 0} solicitações para o estoque`
        });

    } catch (error) {
        console.error('❌ [ESTOQUE] ERRO ao buscar solicitações:', error.message);
        
        // Verificar exatamente qual coluna não existe
        if (error.message.includes('Unknown column')) {
            console.error('❌ Coluna não encontrada no banco. Faça este teste:');
            console.error('❌ Execute: SHOW COLUMNS FROM solicitacoes;');
        }
        
        res.status(500).json({
            success: false,
            error: 'Erro interno ao buscar solicitações para estoque: ' + error.message
        });
    }
});
// 🔍 GET /api/solicitacoes/:id - Buscar solicitação detalhada (CORRIGIDO)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📄 [DETALHE] Buscando detalhes da solicitação ID:', id);

    // 1. Buscar dados básicos - CORRIGIDO: Verificar se retorna status
    const [solicitacao] = await sequelize.query(
      `SELECT 
          s.*,
          u_solicitante.nome as solicitante_nome,
          u_solicitante.departamento,
          u_solicitante.perfil as solicitante_perfil,
          u_aprovador.nome as aprovador_nome
       FROM solicitacoes s
       JOIN usuarios u_solicitante ON s.usuario_solicitante_id = u_solicitante.id
       LEFT JOIN usuarios u_aprovador ON s.usuario_aprovador_id = u_aprovador.id
       WHERE s.id = ?`,
      {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!solicitacao) {
      return res.status(404).json({
        success: false,
        error: 'Solicitação não encontrada'
      });
    }
    if (!solicitacao.status || solicitacao.status.trim() === '') {
      console.log('⚠️ Status vazio detectado, normalizando para "rascunho"');
      solicitacao.status = 'rascunho';
    }

    console.log('✅ [DETALHE] Solicitação encontrada:', {
      id: solicitacao.id,
      codigo: solicitacao.codigo_solicitacao,
      status: solicitacao.status,
      titulo: solicitacao.titulo
    });

    // 2. Buscar itens
    const itens = await sequelize.query(
      `SELECT 
          si.*,
          i.nome as item_estoque_nome,
          i.localizacao,
          i.quantidade as quantidade_disponivel,
          i.patrimonio,
          i.numero_serie,
          i.codigo_barras,
          c.nome as categoria_nome
       FROM solicitacao_itens si
       LEFT JOIN itens i ON si.item_id = i.id
       LEFT JOIN categorias c ON i.categoria_id = c.id
       WHERE si.solicitacao_id = ?
       ORDER BY si.id`,
      {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      }
    );

    // 3. Buscar histórico
    const historico = await sequelize.query(
      `SELECT 
          h.*,
          u.nome as usuario_nome,
          u.perfil as usuario_perfil
       FROM historico_solicitacoes h
       JOIN usuarios u ON h.usuario_id = u.id
       WHERE h.solicitacao_id = ?
       ORDER BY h.data_acao DESC`,
      {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      }
    );

    // 4. Calcular estatísticas
    const valorTotal = itens.reduce((total, item) => {
      const valor = parseFloat(item.valor_unitario_estimado) || 0;
      const quantidade = parseInt(item.quantidade_solicitada) || 0;
      return total + (valor * quantidade);
    }, 0);

    console.log('✅ [DETALHE] Detalhes carregados:', {
      id,
      titulo: solicitacao.titulo,
      status: solicitacao.status || 'NÃO TEM STATUS',
      itens_count: itens.length,
      valor_total: valorTotal
    });

    // 🔥 CORREÇÃO: Garantir que status não seja null ou vazio
    if (!solicitacao.status || solicitacao.status.trim() === '') {
      console.warn('⚠️ [DETALHE] Status está vazio/nulo, definindo como "rascunho"');
      solicitacao.status = 'rascunho';
    }

    res.json({
      success: true,
      data: {
        ...solicitacao,
        itens: itens || [],
        historico: historico || [],
        estatisticas: {
          total_itens: itens.length,
          valor_total_estimado: valorTotal,
          status: solicitacao.status,
          prioridade: solicitacao.prioridade,
          tipo_solicitacao: solicitacao.tipo_solicitacao
        }
      }
    });

  } catch (error) {
    console.error('❌ [DETALHE] Erro ao buscar detalhes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao buscar detalhes: ' + error.message
    });
  }
});

// 📝 GET /api/solicitacoes/:id/itens - Buscar apenas itens da solicitação
router.get('/:id/itens', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const itens = await sequelize.query(
            `SELECT 
                si.*,
                i.nome as item_estoque_nome,
                i.numero_serie,
                i.codigo_barras,
                i.quantidade as quantidade_disponivel
             FROM solicitacao_itens si
             LEFT JOIN itens i ON si.item_id = i.id
             WHERE si.solicitacao_id = ?
             ORDER BY si.id`,
            {
                replacements: [id],
                type: sequelize.QueryTypes.SELECT
            }
        );

        res.json({
            success: true,
            data: itens || []
        });

    } catch (error) {
        console.error('❌ Erro ao buscar itens da solicitação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao buscar itens: ' + error.message
        });
    }
});

// 🗑️ DELETE /api/solicitacoes/:id - Cancelar solicitação (MANTIDO)
router.delete('/:id', auth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { motivo = '' } = req.body;
        
        console.log('🗑️ Cancelando solicitação:', id);

        const [solicitacao] = await sequelize.query(
            `SELECT * FROM solicitacoes 
             WHERE id = ?`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!solicitacao) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Solicitação não encontrada'
            });
        }

        const podeCancelar = 
            solicitacao.usuario_solicitante_id === req.user.id || 
            ['admin', 'admin_estoque'].includes(req.user.perfil);

        if (!podeCancelar) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                error: 'Você não tem permissão para cancelar esta solicitação'
            });
        }

        const statusPermitidos = ['rascunho', 'pendente'];
        if (!statusPermitidos.includes(solicitacao.status)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: `Solicitação não pode ser cancelada no status "${solicitacao.status}"`
            });
        }

        await sequelize.query(
            `UPDATE solicitacoes SET 
                status = 'cancelada',
                motivo_rejeicao = COALESCE(?, motivo_rejeicao)
             WHERE id = ?`,
            {
                replacements: [motivo || 'Cancelada pelo usuário', id],
                transaction,
                type: sequelize.QueryTypes.UPDATE
            }
        );

        await sequelize.query(
            `UPDATE solicitacao_itens SET 
                status_item = 'rejeitado'
             WHERE solicitacao_id = ?`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.UPDATE
            }
        );

        await sequelize.query(
            `INSERT INTO historico_solicitacoes (
                solicitacao_id, 
                usuario_id, 
                acao, 
                descricao,
                dados_alterados
            ) VALUES (?, ?, 'cancelamento', ?, ?)`,
            {
                replacements: [
                    id,
                    req.user.id,
                    motivo ? `Solicitação cancelada: ${motivo}` : 'Solicitação cancelada',
                    JSON.stringify({ 
                        status_anterior: solicitacao.status,
                        status_novo: 'cancelada',
                        motivo_cancelamento: motivo,
                        cancelador_id: req.user.id,
                        cancelador_perfil: req.user.perfil
                    })
                ],
                transaction,
                type: sequelize.QueryTypes.INSERT
            }
        );

        await transaction.commit();

        console.log('✅ Solicitação cancelada:', id);

        res.json({
            success: true,
            data: {
                id: parseInt(id),
                status: 'cancelada',
                message: 'Solicitação cancelada com sucesso'
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Erro ao cancelar solicitação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao cancelar solicitação: ' + error.message
        });
    }
});
// 📦 PUT /api/solicitacoes/:id/processar-estoque - VERSÃO DEFINITIVA SEM COLUNAS NOVAS
// 📦 PUT /api/solicitacoes/:id/processar-estoque - VERSÃO COMPLETA COM 3 ESTÁGIOS
// 📦 PUT /api/solicitacoes/:id/processar-estoque - VERSÃO CORRIGIDA
router.put('/:id/processar-estoque', auth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { 
            acao, // 'aceitar', 'entregar' ou 'rejeitar'
            observacoes_estoque = '',
            quantidade_entregue = null
        } = req.body;
        
        console.log('📦 [ESTOQUE] Processando:', {
            id, acao, usuario: req.user.nome, perfil: req.user.perfil
        });

        // Verificar permissões
        const allowedProfiles = ['admin', 'admin_estoque'];
        if (!allowedProfiles.includes(req.user.perfil)) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                error: 'Apenas administradores ou responsáveis pelo estoque podem processar solicitações'
            });
        }

        // Buscar solicitação
        const [solicitacao] = await sequelize.query(
            `SELECT 
                s.*,
                u.nome as solicitante_nome
             FROM solicitacoes s
             JOIN usuarios u ON s.usuario_solicitante_id = u.id
             WHERE s.id = ?`,
            {
                replacements: [id],
                transaction,
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!solicitacao) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Solicitação não encontrada'
            });
        }

        let novoStatus, mensagem, acaoHistorico, dadosAlterados;

        // ESTÁGIO 1: ACEITAR NO ESTOQUE (de 'aprovada' para 'processando_estoque')
        if (acao === 'aceitar' && solicitacao.status === 'aprovada') {
            novoStatus = 'processando_estoque';
            mensagem = `✅ Solicitação aceita pelo estoque. Agora está aguardando entrega.`;
            acaoHistorico = 'estoque_aceitar';
            dadosAlterados = {
                status_anterior: 'aprovada',
                status_novo: 'processando_estoque',
                responsavel: req.user.nome,
                data_aceitacao: new Date().toISOString(),
                observacoes: observacoes_estoque || `Aceita por ${req.user.nome} no estoque`
            };

        // ESTÁGIO 2: FINALIZAR ENTREGA (de 'processando_estoque' para 'entregue')
        } else if (acao === 'entregar' && solicitacao.status === 'processando_estoque') {
            novoStatus = 'entregue';
            
            if (!quantidade_entregue) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'Quantidade entregue é obrigatória para finalizar entrega'
                });
            }

            mensagem = `📦 Entrega finalizada com sucesso! ${quantidade_entregue} item(s) entregue(s).`;
            acaoHistorico = 'entrega_finalizada';
            dadosAlterados = {
                status_anterior: 'processando_estoque',
                status_novo: 'entregue',
                entregador: req.user.nome,
                data_entrega: new Date().toISOString(),
                quantidade_entregue: quantidade_entregue,
                observacoes: observacoes_estoque || `Entrega realizada por ${req.user.nome}`
            };

            // Atualizar quantidade entregue nos itens
            await sequelize.query(
                `UPDATE solicitacao_itens 
                 SET quantidade_entregue = ?,
                     status_item = 'entregue'
                 WHERE solicitacao_id = ?`,
                {
                    replacements: [quantidade_entregue, id],
                    transaction,
                    type: sequelize.QueryTypes.UPDATE
                }
            );

        // ESTÁGIO 3: REJEITAR (em qualquer ponto)
        } else if (acao === 'rejeitar') {
            novoStatus = 'rejeitada_estoque';
            mensagem = `❌ Solicitação rejeitada pelo estoque.`;
            acaoHistorico = 'estoque_rejeitar';
            dadosAlterados = {
                status_anterior: solicitacao.status,
                status_novo: 'rejeitada_estoque',
                rejeitador: req.user.nome,
                motivo_rejeicao: observacoes_estoque,
                data_rejeicao: new Date().toISOString()
            };

        } else {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: `Ação "${acao}" não permitida para status "${solicitacao.status}"`
            });
        }

        // Atualizar status da solicitação
        // USANDO APENAS COLUNAS QUE EXISTEM: status e data_entrega (se for entrega)
        if (acao === 'entregar') {
            await sequelize.query(
                `UPDATE solicitacoes SET 
                    status = ?,
                    data_entrega = NOW()  -- Esta coluna EXISTE
                 WHERE id = ?`,
                {
                    replacements: [novoStatus, id],
                    transaction,
                    type: sequelize.QueryTypes.UPDATE
                }
            );
        } else {
            await sequelize.query(
                `UPDATE solicitacoes SET 
                    status = ?
                 WHERE id = ?`,
                {
                    replacements: [novoStatus, id],
                    transaction,
                    type: sequelize.QueryTypes.UPDATE
                }
            );
        }

        // Registrar histórico
        await sequelize.query(
            `INSERT INTO historico_solicitacoes (
                solicitacao_id, 
                usuario_id, 
                acao, 
                descricao,
                dados_alterados
            ) VALUES (?, ?, ?, ?, ?)`,
            {
                replacements: [
                    id,
                    req.user.id,
                    acaoHistorico,
                    `Solicitação ${acao === 'aceitar' ? 'aceita' : acao === 'entregar' ? 'entregue' : 'rejeitada'} pelo estoque (${req.user.nome})`,
                    JSON.stringify(dadosAlterados)
                ],
                transaction,
                type: sequelize.QueryTypes.INSERT
            }
        );

        await transaction.commit();

        console.log(`✅ Estoque: ${acao} - ID ${id}: ${solicitacao.status} → ${novoStatus}`);

        res.json({
            success: true,
            data: {
                id: parseInt(id),
                status: novoStatus,
                mensagem: mensagem,
                dados: dadosAlterados,
                processador: {
                    id: req.user.id,
                    nome: req.user.nome,
                    perfil: req.user.perfil
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ ERRO no estoque:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao processar no estoque: ' + error.message
        });
    }
});
module.exports = router;