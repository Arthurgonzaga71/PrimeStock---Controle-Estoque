import React, { useState } from 'react';
import './PesquisaAvancada.css';

const PesquisaAvancada = ({ onSearch, loading = false, filtrosIniciais = {} }) => {
    const [filtros, setFiltros] = useState({
        search: '',
        status: '',
        prioridade: '',
        tipo: '',
        departamento: '',
        dataInicio: '',
        dataFim: '',
        ...filtrosIniciais
    });

    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Limpar campos vazios antes de enviar
        const filtrosLimpos = Object.fromEntries(
            Object.entries(filtros).filter(([_, value]) => 
                value !== '' && value !== null && value !== undefined
            )
        );
        onSearch(filtrosLimpos);
    };

    const handleClear = () => {
        const filtrosLimpos = {
            search: '',
            status: '',
            prioridade: '',
            tipo: '',
            departamento: '',
            dataInicio: '',
            dataFim: '',
        };
        setFiltros(filtrosLimpos);
        onSearch(filtrosLimpos);
    };

    return (
        <div className="pesquisa-avancada">
            <form onSubmit={handleSearch} className="pesquisa-form">
                {/* BARRA DE PESQUISA RÁPIDA */}
                <div className="pesquisa-rapida">
                    <div className="search-input-container">
                        <input
                            type="text"
                            name="search"
                            placeholder="Buscar por código, título, descrição..."
                            value={filtros.search}
                            onChange={handleChange}
                            className="search-input"
                        />
                        <button type="submit" className="search-btn" disabled={loading}>
                            {loading ? '🔍' : '🔍'} Buscar
                        </button>
                    </div>
                    
                    <button
                        type="button"
                        className="btn-filtros"
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    >
                        {mostrarFiltros ? '▲' : '▼'} Filtros Avançados
                    </button>
                </div>

                {/* FILTROS AVANÇADOS */}
                {mostrarFiltros && (
                    <div className="filtros-avancados">
                        <div className="filtros-grid">
                            {/* STATUS */}
                            <div className="filtro-group">
                                <label>Status</label>
                                <select name="status" value={filtros.status} onChange={handleChange}>
                                    <option value="">Todos os status</option>
                                    <option value="rascunho">Rascunho</option>
                                    <option value="pendente">Pendente</option>
                                    <option value="aprovada">Aprovada</option>
                                    <option value="rejeitada">Rejeitada</option>
                                    <option value="entregue">Entregue</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>

                            {/* PRIORIDADE */}
                            <div className="filtro-group">
                                <label>Prioridade</label>
                                <select name="prioridade" value={filtros.prioridade} onChange={handleChange}>
                                    <option value="">Todas as prioridades</option>
                                    <option value="urgente">Urgente</option>
                                    <option value="alta">Alta</option>
                                    <option value="media">Média</option>
                                    <option value="baixa">Baixa</option>
                                </select>
                            </div>

                            {/* TIPO */}
                            <div className="filtro-group">
                                <label>Tipo</label>
                                <select name="tipo" value={filtros.tipo} onChange={handleChange}>
                                    <option value="">Todos os tipos</option>
                                    <option value="equipamento">Equipamento</option>
                                    <option value="material">Material</option>
                                    <option value="servico">Serviço</option>
                                    <option value="outros">Outros</option>
                                </select>
                            </div>

                            {/* DEPARTAMENTO */}
                            <div className="filtro-group">
                                <label>Departamento</label>
                                <select name="departamento" value={filtros.departamento} onChange={handleChange}>
                                    <option value="">Todos departamentos</option>
                                    <option value="comercial">Comercial</option>
                                    <option value="ti">TI</option>
                                    <option value="rh">RH</option>
                                    <option value="financeiro">Financeiro</option>
                                    <option value="operacoes">Operações</option>
                                </select>
                            </div>

                            {/* DATA INÍCIO */}
                            <div className="filtro-group">
                                <label>Data Início</label>
                                <input
                                    type="date"
                                    name="dataInicio"
                                    value={filtros.dataInicio}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* DATA FIM */}
                            <div className="filtro-group">
                                <label>Data Fim</label>
                                <input
                                    type="date"
                                    name="dataFim"
                                    value={filtros.dataFim}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* BOTÕES DE AÇÃO */}
                        <div className="filtros-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Aplicando...' : 'Aplicar Filtros'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleClear}>
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default PesquisaAvancada;