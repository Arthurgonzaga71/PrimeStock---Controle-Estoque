// HistoricoSolicitacao.js - VERSÃO MELHORADA
import React from 'react';
import './HistoricoSolicitacao.css';

const HistoricoSolicitacao = ({ historico, loading = false, solicitacaoInfo }) => {
    // 🎯 FUNÇÃO PARA FORMATAR AÇÃO - VERSÃO COMPLETA
    const formatarAcao = (acao) => {
        const acoesFormatadas = {
            'criacao': '📝 Solicitação Criada',
            'edicao': '✏️ Solicitação Editada',
            'envio_aprovacao': '📤 Enviada para Aprovação',
            'aprovacao': '✅ Aprovada',
            'aprovacao_coordenador': '✅ Aprovada',
            'rejeicao': '❌ Rejeitada',
            'rejeicao_coordenador': '❌ Rejeitada',
            'envio_estoque': '📦 Enviada para Estoque',
            'processamento_estoque': '⚙️ Processando no Estoque',
            'entrega': '📦 Itens Entregues',
            'rejeicao_estoque': '❌ Rejeitada pelo Estoque',
            'cancelamento': '🚫 Cancelada',
            'ajuste': '🔧 Ajuste Realizado'
        };
        return acoesFormatadas[acao] || acao;
    };

    // 🎯 FUNÇÃO PARA ICONE E COR
    const getIcone = (acao) => {
        const icones = {
            criacao: '📝',
            edicao: '✏️',
            envio_aprovacao: '📤',
            aprovacao: '✅',
            aprovacao_coordenador: '✅',
            rejeicao: '❌',
            rejeicao_coordenador: '❌',
            envio_estoque: '📦',
            processamento_estoque: '⚙️',
            entrega: '📦',
            rejeicao_estoque: '🚫',
            cancelamento: '🚫',
            ajuste: '🔧'
        };
        return icones[acao] || '📄';
    };

    const getCor = (acao) => {
        const cores = {
            criacao: '#3498db',           // Azul
            edicao: '#f39c12',           // Laranja
            envio_aprovacao: '#3498db',  // Azul
            aprovacao: '#2ecc71',        // Verde
            aprovacao_coordenador: '#2ecc71',
            rejeicao: '#e74c3c',         // Vermelho
            rejeicao_coordenador: '#e74c3c',
            envio_estoque: '#3498db',    // Azul
            processamento_estoque: '#9b59b6', // Roxo
            entrega: '#27ae60',          // Verde escuro
            rejeicao_estoque: '#e74c3c', // Vermelho
            cancelamento: '#7f8c8d',     // Cinza
            ajuste: '#f39c12'            // Laranja
        };
        return cores[acao] || '#95a5a6';
    };

    const formatarDataHora = (dataString) => {
        try {
            const data = new Date(dataString);
            return data.toLocaleString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return 'Data inválida';
        }
    };

    if (loading) {
        return (
            <div className="historico-loading">
                <div className="loading-spinner"></div>
                <p>Carregando histórico...</p>
            </div>
        );
    }

    if (!historico || historico.length === 0) {
        return (
            <div className="historico-vazio">
                <div className="vazio-icon">📝</div>
                <h4>Nenhum registro no histórico</h4>
                <p>As ações realizadas nesta solicitação aparecerão aqui</p>
            </div>
        );
    }

    return (
        <div className="historico-solicitacao">
            <div className="historico-header">
                <h3>
                    <span className="historico-icon">📋</span>
                    Histórico da Solicitação
                </h3>
                <span className="badge-contador">
                    {historico.length} {historico.length === 1 ? 'registro' : 'registros'}
                </span>
            </div>

            {/* 🎯 NOVA VERSÃO: TABELA SIMPLES (ESTILO DO SEU EXEMPLO) */}
            <div className="historico-tabela-container">
                <div className="historico-tabela-header">
                    <div className="col-data">Data/Hora</div>
                    <div className="col-acao">Ação</div>
                    <div className="col-descricao">Descrição</div>
                    <div className="col-solicitacao">Código</div>
                    <div className="col-titulo">Título</div>
                    <div className="col-prioridade">Prioridade</div>
                    <div className="col-status">Status</div>
                    <div className="col-usuario">Usuário</div>
                </div>

                <div className="historico-tabela-body">
                    {historico.map((registro, index) => (
                        <div 
                            key={registro.id || index} 
                            className="historico-linha"
                            style={{ 
                                borderLeft: `4px solid ${getCor(registro.acao)}`,
                                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                            }}
                        >
                            <div className="col-data">
                                <span className="data-formatada">
                                    {formatarDataHora(registro.data_acao || registro.data)}
                                </span>
                            </div>
                            
                            <div className="col-acao">
                                <span className="acao-com-icone">
                                    <span className="acao-icone">{getIcone(registro.acao)}</span>
                                    <span className="acao-texto">{formatarAcao(registro.acao)}</span>
                                </span>
                            </div>
                            
                            <div className="col-descricao">
                                {registro.descricao}
                            </div>
                            
                            <div className="col-solicitacao">
                                <span className="codigo-badge">
                                    {solicitacaoInfo?.codigo_solicitacao || 'SOL-XXXX'}
                                </span>
                            </div>
                            
                            <div className="col-titulo">
                                {solicitacaoInfo?.titulo || 'Solicitação'}
                            </div>
                            
                            <div className="col-prioridade">
                                <span className={`prioridade-badge prioridade-${solicitacaoInfo?.prioridade || 'media'}`}>
                                    {solicitacaoInfo?.prioridade || 'media'}
                                </span>
                            </div>
                            
                            <div className="col-status">
                                <span className={`status-badge status-${solicitacaoInfo?.status || 'pendente'}`}>
                                    {solicitacaoInfo?.status || 'pendente'}
                                </span>
                            </div>
                            
                            <div className="col-usuario">
                                <div className="usuario-info">
                                    <span className="usuario-nome">
                                        {registro.usuario_nome || 'Sistema'}
                                    </span>
                                    {registro.usuario_perfil && (
                                        <span className="usuario-perfil">
                                            ({registro.usuario_perfil})
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🎯 VERSÃO ALTERNATIVA: TIMELINE (MANTENDO O SEU ORIGINAL COMO OPÇÃO) */}
            <div className="timeline-alternativa" style={{ display: 'none' }}>
                {historico.map((registro, index) => (
                    <div key={registro.id || index} className="timeline-item-alternativo">
                        <div className="timeline-marker-alternativo" style={{ backgroundColor: getCor(registro.acao) }}>
                            {getIcone(registro.acao)}
                        </div>
                        <div className="timeline-content-alternativo">
                            <div className="timeline-header-alternativo">
                                <span className="timeline-data">
                                    {formatarDataHora(registro.data_acao || registro.data)}
                                </span>
                                <span className="timeline-usuario">
                                    <strong>{registro.usuario_nome || 'Sistema'}</strong>
                                    {registro.usuario_perfil && ` (${registro.usuario_perfil})`}
                                </span>
                            </div>
                            <div className="timeline-descricao-alternativo">
                                <span className="acao-icon">{getIcone(registro.acao)}</span>
                                {registro.descricao}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoricoSolicitacao;