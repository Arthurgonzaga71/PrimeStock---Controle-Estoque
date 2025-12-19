// pages/HistoricoTecnico.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import HistoricoSolicitacao from '../components/HistoricoSolicitacao';
import './HistoricoPages.css';

const HistoricoTecnico = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [estatisticas, setEstatisticas] = useState({});
    const [filtros, setFiltros] = useState({
        status: '',
        dataInicio: '',
        dataFim: '',
        search: '',
        page: 1,
        limit: 10
    });
    const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
    const [detalhesVisiveis, setDetalhesVisiveis] = useState(false);

    // Carregar histórico do técnico
    const carregarHistorico = async () => {
        try {
            setLoading(true);
            const response = await api.get('/solicitacoes/historico/minhas', { params: filtros });
            
            if (response.data.success) {
                setSolicitacoes(response.data.data.solicitacoes || []);
                setEstatisticas(response.data.data.estatisticas || {});
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            alert('Erro ao carregar histórico: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Carregar detalhes de uma solicitação
    const carregarDetalhes = async (id) => {
        try {
            const response = await api.get(`/solicitacoes/${id}`);
            if (response.data.success) {
                setSolicitacaoSelecionada(response.data.data);
                setDetalhesVisiveis(true);
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            alert('Erro ao carregar detalhes: ' + error.message);
        }
    };

    // Exportar histórico para PDF/Excel
    const exportarHistorico = async (formato = 'pdf') => {
        try {
            const response = await api.get('/solicitacoes/historico/exportar', {
                params: { ...filtros, formato },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `historico-tecnico-${user.nome}.${formato}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao exportar histórico: ' + error.message);
        }
    };

    useEffect(() => {
        carregarHistorico();
    }, [filtros.page, filtros.status]);

    // Formatar data
    const formatarData = (data) => {
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
    };

    // Estatísticas em cards
    const renderEstatisticas = () => (
        <div className="estatisticas-grid">
            <div className="estatistica-card card-total">
                <div className="estatistica-icon">📋</div>
                <div className="estatistica-info">
                    <h3>{estatisticas.total || 0}</h3>
                    <p>Total de Solicitações</p>
                </div>
            </div>
            
            <div className="estatistica-card card-aprovadas">
                <div className="estatistica-icon">✅</div>
                <div className="estatistica-info">
                    <h3>{estatisticas.aprovadas || 0}</h3>
                    <p>Aprovadas</p>
                </div>
            </div>
            
            <div className="estatistica-card card-rejeitadas">
                <div className="estatistica-icon">❌</div>
                <div className="estatistica-info">
                    <h3>{estatisticas.rejeitadas || 0}</h3>
                    <p>Rejeitadas</p>
                </div>
            </div>
            
            <div className="estatistica-card card-entregues">
                <div className="estatistica-icon">📦</div>
                <div className="estatistica-info">
                    <h3>{estatisticas.entregues || 0}</h3>
                    <p>Entregues</p>
                </div>
            </div>
        </div>
    );

    // Tabela de solicitações
    const renderTabela = () => (
        <div className="table-responsive">
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Título</th>
                        <th>Status</th>
                        <th>Data Solicitação</th>
                        <th>Data Aprovação</th>
                        <th>Itens</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {solicitacoes.map((solicitacao) => (
                        <tr key={solicitacao.id}>
                            <td>
                                <span className="badge bg-primary">
                                    {solicitacao.codigo_solicitacao}
                                </span>
                            </td>
                            <td>{solicitacao.titulo}</td>
                            <td>
                                <span className={`status-badge status-${solicitacao.status}`}>
                                    {solicitacao.status_formatado || solicitacao.status}
                                </span>
                            </td>
                            <td>{formatarData(solicitacao.data_solicitacao)}</td>
                            <td>{formatarData(solicitacao.data_aprovacao)}</td>
                            <td>
                                <span className="badge bg-secondary">
                                    {solicitacao.total_itens || 0} item(s)
                                </span>
                            </td>
                            <td>
                                <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => carregarDetalhes(solicitacao.id)}
                                >
                                    <i className="fas fa-eye"></i> Detalhes
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="container-fluid historico-page">
            {/* Cabeçalho */}
            <div className="page-header">
                <h1>
                    <i className="fas fa-history me-2"></i>
                    Meu Histórico de Solicitações
                </h1>
                <p className="lead">
                    Histórico completo de todas as suas solicitações
                </p>
            </div>

            {/* Estatísticas */}
            {renderEstatisticas()}

            {/* Filtros */}
            <div className="filtros-section card">
                <div className="card-body">
                    <h5 className="card-title">
                        <i className="fas fa-filter me-2"></i>
                        Filtrar Histórico
                    </h5>
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Status</label>
                            <select 
                                className="form-select"
                                value={filtros.status}
                                onChange={(e) => setFiltros({...filtros, status: e.target.value, page: 1})}
                            >
                                <option value="">Todos os status</option>
                                <option value="rascunho">Rascunho</option>
                                <option value="pendente">Pendente</option>
                                <option value="aprovada">Aprovada</option>
                                <option value="rejeitada">Rejeitada</option>
                                <option value="entregue">Entregue</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                        
                        <div className="col-md-3">
                            <label className="form-label">Data Início</label>
                            <input 
                                type="date" 
                                className="form-control"
                                value={filtros.dataInicio}
                                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value, page: 1})}
                            />
                        </div>
                        
                        <div className="col-md-3">
                            <label className="form-label">Data Fim</label>
                            <input 
                                type="date" 
                                className="form-control"
                                value={filtros.dataFim}
                                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value, page: 1})}
                            />
                        </div>
                        
                        <div className="col-md-3">
                            <label className="form-label">Buscar</label>
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    className="form-control"
                                    placeholder="Código ou título..."
                                    value={filtros.search}
                                    onChange={(e) => setFiltros({...filtros, search: e.target.value, page: 1})}
                                />
                                <button className="btn btn-outline-secondary">
                                    <i className="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-3">
                        <button 
                            className="btn btn-primary me-2"
                            onClick={carregarHistorico}
                        >
                            <i className="fas fa-sync-alt me-1"></i>
                            Aplicar Filtros
                        </button>
                        
                        <button 
                            className="btn btn-outline-secondary me-2"
                            onClick={() => exportarHistorico('pdf')}
                        >
                            <i className="fas fa-file-pdf me-1"></i>
                            Exportar PDF
                        </button>
                        
                        <button 
                            className="btn btn-outline-success"
                            onClick={() => exportarHistorico('excel')}
                        >
                            <i className="fas fa-file-excel me-1"></i>
                            Exportar Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="card mt-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0">
                            <i className="fas fa-list me-2"></i>
                            Solicitações ({solicitacoes.length})
                        </h5>
                        
                        <div className="btn-group">
                            <button 
                                className="btn btn-sm btn-outline-secondary"
                                disabled={filtros.page === 1}
                                onClick={() => setFiltros({...filtros, page: filtros.page - 1})}
                            >
                                <i className="fas fa-chevron-left"></i> Anterior
                            </button>
                            <span className="btn btn-sm btn-light">
                                Página {filtros.page}
                            </span>
                            <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setFiltros({...filtros, page: filtros.page + 1})}
                            >
                                Próxima <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Carregando...</span>
                            </div>
                            <p className="mt-2">Carregando histórico...</p>
                        </div>
                    ) : solicitacoes.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <h5>Nenhuma solicitação encontrada</h5>
                            <p className="text-muted">Tente ajustar os filtros</p>
                        </div>
                    ) : (
                        renderTabela()
                    )}
                </div>
            </div>

            {/* Modal de Detalhes */}
            {detalhesVisiveis && solicitacaoSelecionada && (
                <div className="modal-backdrop show" onClick={() => setDetalhesVisiveis(false)}>
                    <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Detalhes da Solicitação
                                    <span className="badge bg-primary ms-2">
                                        {solicitacaoSelecionada.codigo_solicitacao}
                                    </span>
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setDetalhesVisiveis(false)}
                                ></button>
                            </div>
                            
                            <div className="modal-body">
                                {/* Informações da solicitação */}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <h6>Título</h6>
                                        <p>{solicitacaoSelecionada.titulo}</p>
                                    </div>
                                    <div className="col-md-3">
                                        <h6>Status</h6>
                                        <span className={`badge bg-${getStatusColor(solicitacaoSelecionada.status)}`}>
                                            {solicitacaoSelecionada.status}
                                        </span>
                                    </div>
                                    <div className="col-md-3">
                                        <h6>Prioridade</h6>
                                        <span className={`badge bg-${solicitacaoSelecionada.prioridade === 'alta' ? 'danger' : 'warning'}`}>
                                            {solicitacaoSelecionada.prioridade}
                                        </span>
                                    </div>
                                </div>

                                {/* Histórico */}
                                <div className="mt-4">
                                    <h6>Histórico de Ações</h6>
                                    <HistoricoSolicitacao 
                                        historico={solicitacaoSelecionada.historico || []}
                                    />
                                </div>

                                {/* Itens da solicitação */}
                                {solicitacaoSelecionada.itens && solicitacaoSelecionada.itens.length > 0 && (
                                    <div className="mt-4">
                                        <h6>Itens Solicitados ({solicitacaoSelecionada.itens.length})</h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Item</th>
                                                        <th>Quantidade</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {solicitacaoSelecionada.itens.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{item.nome_item}</td>
                                                            <td>{item.quantidade_solicitada}</td>
                                                            <td>
                                                                <span className={`badge bg-${item.status_item === 'aprovado' ? 'success' : 'secondary'}`}>
                                                                    {item.status_item}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setDetalhesVisiveis(false)}
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricoTecnico;