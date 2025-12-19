// src/pages/Itens/ItemForm.js - VERSÃO COMPLETAMENTE CORRIGIDA (SEM LIMITE DE VALOR)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itensService, categoriasService } from '../../services/api';
import { Button, Loading } from '../../components/UI';
import { ITEM_STATUS, ITEM_ESTADO, LABELS } from '../../utils/constants';
import './Itens.css';

const ItemForm = () => {
  const { id } = useParams(); // id para edição, undefined para novo
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(!!id);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState([]);
  
  // 🔥 VERIFICAÇÃO DIRETA DAS PERMISSÕES (SOLUÇÃO DEFINITIVA)
  const podeCadastrar = user?.pode_cadastrar || 
                       user?.permissoes?.pode_cadastrar || 
                       ['admin', 'admin_estoque', 'tecnico', 'analista'].includes(user?.perfil);

  const podeEditar = user?.pode_editar || 
                     user?.permissoes?.pode_editar || 
                     ['admin', 'admin_estoque', 'tecnico', 'analista'].includes(user?.perfil);

  const podeDeletar = user?.permissao_gerenciar_usuarios || 
                      user?.permissoes?.permissao_gerenciar_usuarios || 
                      user?.perfil === 'admin';
  
  // 🎯 ESTADO DO FORMULÁRIO
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    numero_serie: '',
    patrimonio: '',
    categoria_id: '',
    localizacao: '',
    status: 'disponivel',
    estado: 'novo',
    data_aquisicao: '',
    valor_compra: '',
    fornecedor: '',
    nota_fiscal: '',
    quantidade: 1,
    estoque_minimo: 0,
    especificacoes: {
      marca: '',
      modelo: '',
      processador: '',
      memoria: '',
      armazenamento: '',
      observacoes: ''
    }
  });

  // 🎯 VERIFICAR PERMISSÕES DO USUÁRIO
  useEffect(() => {
    if (id) {
      // Edição - precisa de permissão para editar
      if (!podeEditar) {
        setError('❌ Você não tem permissão para editar itens');
        setTimeout(() => navigate('/itens'), 2000);
      }
    } else {
      // Criação - precisa de permissão para cadastrar
      if (!podeCadastrar) {
        setError('❌ Você não tem permissão para cadastrar itens');
        setTimeout(() => navigate('/itens'), 2000);
      }
    }
  }, [id, podeCadastrar, podeEditar, navigate]);

  // 📋 CARREGAR DADOS PARA EDIÇÃO
  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      try {
        setCarregando(true);
        
        // Carregar item
        const responseItem = await itensService.getById(id);
        if (responseItem.data.success) {
          const item = responseItem.data.data;
          
          setFormData({
            nome: item.nome || '',
            descricao: item.descricao || '',
            numero_serie: item.numero_serie || '',
            patrimonio: item.patrimonio || '',
            categoria_id: item.categoria_id || '',
            localizacao: item.localizacao || '',
            status: item.status || 'disponivel',
            estado: item.estado || 'novo',
            data_aquisicao: item.data_aquisicao ? item.data_aquisicao.split('T')[0] : '',
            valor_compra: item.valor_compra || '',
            fornecedor: item.fornecedor || '',
            nota_fiscal: item.nota_fiscal || '',
            quantidade: item.quantidade || 1,
            estoque_minimo: item.estoque_minimo || 0,
            especificacoes: item.especificacoes || {
              marca: '',
              modelo: '',
              processador: '',
              memoria: '',
              armazenamento: '',
              observacoes: ''
            }
          });
        }
      } catch (error) {
        console.error('Erro ao carregar item:', error);
        setError('❌ Erro ao carregar dados do item');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [id]);

  // 📋 CARREGAR CATEGORIAS
  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const response = await categoriasService.getAll();
        if (response.data.success) {
          setCategorias(response.data.data);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar categorias:', error);
      }
    };

    carregarCategorias();
  }, []);

  // 🔄 HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🔄 HANDLE ESPECIFICACOES CHANGE
  const handleEspecificacoesChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      especificacoes: {
        ...prev.especificacoes,
        [name]: value
      }
    }));
  };

  // ✅ VALIDAR FORMULÁRIO
  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      setError('❌ Nome do item é obrigatório');
      return false;
    }
    if (!formData.categoria_id) {
      setError('❌ Categoria é obrigatória');
      return false;
    }
    if (formData.quantidade < 0) {
      setError('❌ Quantidade não pode ser negativa');
      return false;
    }
    if (formData.valor_compra && parseFloat(formData.valor_compra) < 0) {
      setError('❌ Valor não pode ser negativo');
      return false;
    }
    return true;
  };

  // 📤 ENVIAR FORMULÁRIO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // 🔥 VERIFICAÇÃO FINAL DE PERMISSÃO
      if (id && !podeEditar) {
        throw new Error('❌ Você não tem permissão para editar itens');
      }
      
      if (!id && !podeCadastrar) {
        throw new Error('❌ Você não tem permissão para cadastrar itens');
      }

      // 🔥 PREPARAR DADOS CORRETAMENTE PARA O BACKEND
      const dadosEnvio = {
        nome: formData.nome?.trim(),
        descricao: formData.descricao?.trim() || null,
        numero_serie: formData.numero_serie?.trim() || null,
        patrimonio: formData.patrimonio?.trim() || null,
        categoria_id: parseInt(formData.categoria_id),
        localizacao: formData.localizacao?.trim() || null,
        status: formData.status,
        estado: formData.estado,
        data_aquisicao: formData.data_aquisicao || null,
        valor_compra: formData.valor_compra ? parseFloat(formData.valor_compra) : null,
        fornecedor: formData.fornecedor?.trim() || null,
        nota_fiscal: formData.nota_fiscal?.trim() || null,
        quantidade: parseInt(formData.quantidade) || 1,
        estoque_minimo: parseInt(formData.estoque_minimo) || 0,
        especificacoes: formData.especificacoes || {}
      };

      // 🔥 LIMPAR OBJETO ESPECIFICAÇÕES (remover campos vazios)
      if (dadosEnvio.especificacoes) {
        const especsLimpo = {};
        for (const [key, value] of Object.entries(dadosEnvio.especificacoes)) {
          if (value && value.toString().trim() !== '') {
            especsLimpo[key] = value;
          }
        }
        dadosEnvio.especificacoes = Object.keys(especsLimpo).length > 0 ? especsLimpo : null;
      }

      let response;
      if (id) {
        response = await itensService.update(id, dadosEnvio);
      } else {
        response = await itensService.create(dadosEnvio);
      }

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        navigate('/itens');
      } else {
        throw new Error(response.data.message || 'Erro desconhecido no servidor');
      }
    } catch (error) {
      console.error('💥 ERRO COMPLETO AO SALVAR ITEM:', error);
      
      let mensagemErro = error.message;
      
      if (error.response?.status === 400) {
        if (error.response?.data?.errors) {
          const erros = error.response.data.errors.map(e => e.message).join(', ');
          mensagemErro = `Erros de validação: ${erros}`;
        } else if (error.response?.data?.message) {
          mensagemErro = error.response.data.message;
        } else {
          mensagemErro = 'Erro 400: Dados inválidos enviados ao servidor';
        }
      } else if (error.response?.status === 403) {
        mensagemErro = '❌ Acesso negado. Você não tem permissão para esta ação.';
      } else if (!error.response) {
        mensagemErro = '❌ Não foi possível conectar ao servidor. Verifique sua conexão.';
      }
      
      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 BOTÃO DE DELETAR (APENAS ADMIN/ESTOQUE)
  const handleDelete = async () => {
    if (!id) return;
    
    if (!podeDeletar) {
      alert('❌ Apenas administradores podem excluir itens');
      return;
    }
    
    if (!window.confirm('⚠️ Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await itensService.delete(id);
      
      if (response.data.success) {
        alert('✅ Item excluído com sucesso!');
        navigate('/itens');
      }
    } catch (error) {
      console.error('❌ Erro ao excluir item:', error);
      setError(error.response?.data?.message || error.message || '❌ Erro ao excluir item');
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <div className="page-loading">
        <Loading size="large" text="Carregando dados do item..." />
      </div>
    );
  }

  // 🔥 SE NÃO TEM PERMISSÃO, MOSTRAR MENSAGEM CLARA
  if ((id && !podeEditar) || (!id && !podeCadastrar)) {
    return (
      <div className="access-denied-page">
        <div className="denied-content">
          <h1>🔒 Acesso Negado</h1>
          <p className="denied-message">
            {id 
              ? 'Você não tem permissão para editar itens.'
              : 'Você não tem permissão para cadastrar novos itens.'
            }
          </p>
          <p className="perfil-info">
            Seu perfil: <strong>{user?.perfil || 'Não identificado'}</strong>
          </p>
          <div className="permissions-info">
            <h3>📋 Permissões do seu perfil:</h3>
            <ul>
              <li>✅ Consultar itens: <strong>SIM</strong></li>
              <li>✅ Cadastrar itens: <strong>{podeCadastrar ? 'SIM' : 'NÃO'}</strong></li>
              <li>✅ Editar itens: <strong>{podeEditar ? 'SIM' : 'NÃO'}</strong></li>
              <li>❌ Excluir itens: <strong>{podeDeletar ? 'SIM' : 'NÃO'}</strong></li>
            </ul>
          </div>
          <Button 
            onClick={() => navigate('/itens')}
            variant="primary"
            className="mt-4"
          >
            ← Voltar para Lista de Itens
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="item-form-page">
      {/* 🎯 CABEÇALHO */}
      <header className="page-header">
        <div className="header-content">
          <h1>{id ? '✏️ Editar Item' : '📦 Novo Item'}</h1>
          <p>
            {id ? 'Atualize as informações do item' : 'Cadastre um novo equipamento no sistema'}
          </p>
          
          <div className="permission-badge">
            <span className={`badge ${user?.perfil === 'admin' ? 'badge-admin' : 
                                        user?.perfil === 'admin_estoque' ? 'badge-estoque' : 
                                        user?.perfil === 'coordenador' ? 'badge-coordenador' : 
                                        user?.perfil === 'gerente' ? 'badge-gerente' : 
                                        user?.perfil === 'tecnico' ? 'badge-tecnico' : 
                                        user?.perfil === 'analista' ? 'badge-analista' : 'badge-default'}`}>
              👤 {user?.perfil?.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <Link to="/itens" className="btn btn--secondary">
            ← Voltar para Lista
          </Link>
        </div>
      </header>

      {/* ❌ ERRO */}
      {error && (
        <div className="alert alert--error">
          <div className="alert__icon">❌</div>
          <div className="alert__content">
            <strong>Erro:</strong> {error}
          </div>
        </div>
      )}

      {/* 📝 FORMULÁRIO */}
      <form onSubmit={handleSubmit} className="item-form">
        <div className="form-sections">
          
          {/* 📋 INFORMAÇÕES BÁSICAS */}
          <section className="form-section">
            <h3>📋 Informações Básicas</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Nome do Item *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Notebook Dell Latitude 5420"
                  disabled={id && !podeEditar}
                />
              </div>
              
              <div className="form-group">
                <label>Categoria *</label>
                <select 
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={handleChange}
                  required
                  disabled={id && !podeEditar}
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Número de Série</label>
                <input
                  type="text"
                  name="numero_serie"
                  value={formData.numero_serie}
                  onChange={handleChange}
                  placeholder="Número único de série"
                  disabled={id && !podeEditar}
                />
              </div>
              
              <div className="form-group">
                <label>Patrimônio</label>
                <input
                  type="text"
                  name="patrimonio"
                  value={formData.patrimonio}
                  onChange={handleChange}
                  placeholder="Código de patrimônio"
                  disabled={id && !podeEditar}
                />
              </div>
            </div>
            
            <div className="form-group full-width">
              <label>Descrição</label>
              <textarea 
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descrição detalhada do item..."
                rows="3"
                disabled={id && !podeEditar}
              />
            </div>
          </section>

          {/* 🏷️ STATUS E LOCALIZAÇÃO */}
          <section className="form-section">
            <h3>🏷️ Status e Localização</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Status</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={id && !podeEditar}
                >
                  {Object.entries(ITEM_STATUS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {LABELS[key] || key}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Estado</label>
                <select 
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={id && !podeEditar}
                >
                  {Object.entries(ITEM_ESTADO).map(([key, value]) => (
                    <option key={key} value={key}>
                      {LABELS[key] || key}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Localização</label>
                <input
                  type="text"
                  name="localizacao"
                  value={formData.localizacao}
                  onChange={handleChange}
                  placeholder="Ex: Almoxarifado TI, Sala 205"
                  disabled={id && !podeEditar}
                />
              </div>
            </div>
          </section>

          {/* 💰 AQUISIÇÃO E VALOR - CORRIGIDO (SEM LIMITE) */}
          <section className="form-section">
            <h3>💰 Aquisição e Valor</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Data de Aquisição</label>
                <input
                  type="date"
                  name="data_aquisicao"
                  value={formData.data_aquisicao}
                  onChange={handleChange}
                  disabled={id && !podeEditar}
                />
              </div>
              
              {/* 🔥 CORREÇÃO AQUI: REMOVER O MAX="2000" */}
              <div className="form-group">
                <label>Valor de Compra (R$)</label>
                <input
                  type="number"
                  name="valor_compra"
                  step="0.01"
                  min="0"
                  value={formData.valor_compra}
                  onChange={handleChange}
                  placeholder="0,00"
                  disabled={id && !podeEditar}
                />
                {/* 🔥 MENSAGEM ATUALIZADA - SEM LIMITE */}
                <small className="text-muted">Informe o valor total do item</small>
              </div>
              
              <div className="form-group">
                <label>Fornecedor</label>
                <input
                  type="text"
                  name="fornecedor"
                  value={formData.fornecedor}
                  onChange={handleChange}
                  placeholder="Nome do fornecedor"
                  disabled={id && !podeEditar}
                />
              </div>
              
              <div className="form-group">
                <label>Nota Fiscal</label>
                <input
                  type="text"
                  name="nota_fiscal"
                  value={formData.nota_fiscal}
                  onChange={handleChange}
                  placeholder="Número da nota fiscal"
                  disabled={id && !podeEditar}
                />
              </div>
            </div>
          </section>

          {/* 📊 ESTOQUE */}
          <section className="form-section">
            <h3>📊 Controle de Estoque</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Quantidade em Estoque *</label>
                <input
                  type="number"
                  name="quantidade"
                  min="0"
                  value={formData.quantidade}
                  onChange={handleChange}
                  required
                  disabled={id && !podeEditar}
                />
              </div>
              
              <div className="form-group">
                <label>Estoque Mínimo</label>
                <input
                  type="number"
                  name="estoque_minimo"
                  min="0"
                  value={formData.estoque_minimo}
                  onChange={handleChange}
                  placeholder="Quantidade mínima para alerta"
                  disabled={id && !podeEditar}
                />
              </div>
            </div>
          </section>

          {/* 🔧 ESPECIFICAÇÕES TÉCNICAS */}
          <section className="form-section">
            <h3>🔧 Especificações Técnicas</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.especificacoes.marca}
                  onChange={handleEspecificacoesChange}
                  placeholder="Ex: Dell, HP, Lenovo"
                  disabled={id && !podeEditar}
                />
              </div>
              
              <div className="form-group">
                <label>Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.especificacoes.modelo}
                  onChange={handleEspecificacoesChange}
                  placeholder="Ex: Latitude 5420, ThinkPad T14"
                  disabled={id && !podeEditar}
                />
              </div>
              
              <div className="form-group">
                <label>Processador</label>
                <input
                  type="text"
                  name="processador"
                  value={formData.especificacoes.processador}
                  onChange={handleEspecificacoesChange}
                  placeholder="Ex: Intel i5 10ª geração"
                  disabled={id && !podeEditar}
                />
              </div>
              
              <div className="form-group">
                <label>Memória RAM</label>
                <input
                  type="text"
                  name="memoria"
                  value={formData.especificacoes.memoria}
                  onChange={handleEspecificacoesChange}
                  placeholder="Ex: 8GB DDR4"
                  disabled={id && !podeEditar}
                />
              </div>
              
              <div className="form-group">
                <label>Armazenamento</label>
                <input
                  type="text"
                  name="armazenamento"
                  value={formData.especificacoes.armazenamento}
                  onChange={handleEspecificacoesChange}
                  placeholder="Ex: 256GB SSD"
                  disabled={id && !podeEditar}
                />
              </div>
            </div>
            
            <div className="form-group full-width">
              <label>Observações</label>
              <textarea 
                name="observacoes"
                value={formData.especificacoes.observacoes}
                onChange={handleEspecificacoesChange}
                placeholder="Observações adicionais..."
                rows="3"
                disabled={id && !podeEditar}
              />
            </div>
          </section>
        </div>

        {/* 📤 AÇÕES */}
        <div className="form-actions">
          <Link to="/itens" className="btn btn--secondary">
            Cancelar
          </Link>
          
          <div className="action-buttons">
            {id && podeDeletar && (
              <Button 
                type="button"
                onClick={handleDelete}
                loading={loading}
                variant="danger"
                className="mr-2"
              >
                🗑️ Excluir Item
              </Button>
            )}
            
            <Button 
              type="submit" 
              loading={loading}
              variant="primary"
              disabled={loading}
            >
              {id ? '💾 Atualizar Item' : '📦 Cadastrar Item'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;