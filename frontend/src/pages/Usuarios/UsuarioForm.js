// 📁 frontend/src/pages/Usuarios/UsuarioForm.js - VERSÃO COMPLETAMENTE CORRIGIDA
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usuariosService } from '../../services/api';
import './UsuarioForm.css';

const UsuarioForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit] = useState(!!id);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: 'tecnico', // ✅ Padrão do seu modelo
    departamento: 'TI', // ✅ Campo do seu modelo
    ativo: true, // ✅ Seu modelo usa "ativo" em vez de "status"
    senha: '',
    confirmarSenha: ''
  });
// ✅ ADICIONE ISSO NO TOPO DO COMPONENTE, DEPOIS DO useState
const [debugInfo, setDebugInfo] = useState('');

useEffect(() => {
  if (!isEdit) {
    console.log('🔍 === DEBUG INICIADO ===');
    console.log('1. Dados COMPLETOS do usuário logado:');
    console.log(JSON.stringify(user, null, 2));
    
    console.log('2. Verificando propriedades específicas:');
    console.log('user?.perfil:', user?.perfil);
    console.log('user?.permissao_gerenciar_usuarios:', user?.permissao_gerenciar_usuarios);
    console.log('user?.pode_cadastrar:', user?.pode_cadastrar);
    console.log('user?.permissoes:', user?.permissoes);
    console.log('user?.permissoesResumo:', user?.permissoesResumo);
    
    console.log('3. Testando diretamente o switch:');
    let resultadoSwitch = '';
    switch (user?.perfil) {
      case 'coordenador':
        resultadoSwitch = 'coordenador - DEVERIA MOSTRAR 4 PERFIS';
        break;
      default:
        resultadoSwitch = `outro perfil: ${user?.perfil}`;
    }
    console.log('Resultado do switch:', resultadoSwitch);
    
    console.log('4. Executando getPerfisPermitidos:');
    const perfisTeste = getPerfisPermitidos();
    console.log('Perfis retornados:', perfisTeste);
    
    console.log('=== FIM DEBUG ===');
    
    // Mostra na tela também
    setDebugInfo(`
      Perfil: ${user?.perfil}
      Pode gerenciar: ${user?.permissao_gerenciar_usuarios}
      Pode cadastrar: ${user?.pode_cadastrar}
      Número de perfis: ${perfisTeste.length}
      Perfis: ${JSON.stringify(perfisTeste)}
    `);
  }
}, [isEdit]);



  // ✅✅✅ CORREÇÃO DEFINITIVA: PERFIS QUE CADA USUÁRIO PODE CRIAR
  const getPerfisPermitidos = () => {
    console.log('🔍 Definindo perfis permitidos para usuário logado:', {
      perfil: user?.perfil,
      nome: user?.nome,
      permissao_gerenciar_usuarios: user?.permissao_gerenciar_usuarios,
      pode_cadastrar: user?.pode_cadastrar
    });

    // PERFIS DISPONÍVEIS NO SEU SISTEMA (conforme seu modelo)
    const todosPerfis = [
      { value: 'aprendiz', label: '👶 Aprendiz' },
      { value: 'estagiario', label: '🎓 Estagiário' },
      { value: 'tecnico', label: '🔧 Técnico' },
      { value: 'analista', label: '📊 Analista' },
      { value: 'coordenador', label: '👔 Coordenador' },
      { value: 'gerente', label: '👨‍💼 Gerente' },
      { value: 'admin_estoque', label: '📦 Admin Estoque' },
      { value: 'admin', label: '👑 Administrador' }
    ];

    let perfisPermitidos = [];

    // BASEADO NO PERFIL DO USUÁRIO LOGADO
    switch (user?.perfil) {
      case 'admin':
        // ✅ ADMIN pode criar TODOS os perfis (exceto outro admin por segurança)
        perfisPermitidos = todosPerfis.filter(p => p.value !== 'admin');
        console.log('👑 Admin - Pode criar:', perfisPermitidos.map(p => p.value));
        break;
        
      case 'coordenador':
        // ✅ COORDENADOR pode criar: aprendiz, estagiário, técnico, analista
        perfisPermitidos = todosPerfis.filter(p => 
          ['aprendiz', 'estagiario', 'tecnico', 'analista'].includes(p.value)
        );
        console.log('👔 Coordenador - Pode criar:', perfisPermitidos.map(p => p.value));
        break;
        
      case 'gerente':
        // ✅ GERENTE pode criar: aprendiz, estagiário, técnico, analista
        perfisPermitidos = todosPerfis.filter(p => 
          ['aprendiz', 'estagiario', 'tecnico', 'analista'].includes(p.value)
        );
        console.log('👨‍💼 Gerente - Pode criar:', perfisPermitidos.map(p => p.value));
        break;
        
      case 'admin_estoque':
        // ✅ ADMIN ESTOQUE pode criar: técnico, analista
        perfisPermitidos = todosPerfis.filter(p => 
          ['tecnico', 'analista'].includes(p.value)
        );
        console.log('📦 Admin Estoque - Pode criar:', perfisPermitidos.map(p => p.value));
        break;
        
      case 'tecnico':
      case 'analista':
        // ✅ TÉCNICO/ANALISTA pode criar: estagiário, aprendiz (conforme seu banco)
        perfisPermitidos = todosPerfis.filter(p => 
          ['aprendiz', 'estagiario'].includes(p.value)
        );
        console.log(`${user?.perfil} - Pode criar:`, perfisPermitidos.map(p => p.value));
        break;
        
      default:
        // ❌ Outros perfis NÃO podem criar usuários
        perfisPermitidos = [];
        console.log(`❌ ${user?.perfil} - Não pode criar usuários`);
    }

    // Se nenhum perfil permitido, usar pelo menos técnico como padrão
    if (perfisPermitidos.length === 0) {
      perfisPermitidos = todosPerfis.filter(p => p.value === 'tecnico');
    }

    return perfisPermitidos;
  };

  // Carregar dados do usuário se for edição
  useEffect(() => {
    if (isEdit) {
      loadUsuario();
    }
  }, [isEdit, id]);

  const loadUsuario = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando usuário para edição...');
      
      const response = await usuariosService.getById(id);
      console.log('✅ Dados do usuário:', response.data);
      
      // ✅ COMPATIBILIDADE: Acessar response.data.data ou response.data
      const usuarioData = response.data.data || response.data;
      
      setFormData({
        nome: usuarioData.nome || '',
        email: usuarioData.email || '',
        perfil: usuarioData.perfil || 'tecnico',
        departamento: usuarioData.departamento || 'TI',
        ativo: usuarioData.ativo !== undefined ? usuarioData.ativo : true,
        senha: '',
        confirmarSenha: ''
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar usuário:', error);
      setError('Erro ao carregar dados do usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!isEdit && !formData.senha) {
      setError('Senha é obrigatória para novo usuário');
      return;
    }

    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.senha && formData.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      
      // ✅ PREPARAR DADOS COMPATÍVEIS COM SEU MODELO
      const dadosEnvio = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        perfil: formData.perfil,
        departamento: formData.departamento,
        ativo: formData.ativo
      };

      // Adicionar senha apenas se for nova ou alterada
      if (formData.senha) {
        dadosEnvio.senha = formData.senha;
      }

      console.log('📤 Enviando dados para o servidor:', dadosEnvio);
      console.log('👤 Usuário que está criando:', {
        nome: user?.nome,
        perfil: user?.perfil
      });

      let response;
      if (isEdit) {
        response = await usuariosService.update(id, dadosEnvio);
        console.log('✅ Usuário atualizado:', response.data);
      } else {
        response = await usuariosService.create(dadosEnvio);
        console.log('✅ Usuário criado:', response.data);
      }

      alert(`✅ Usuário ${isEdit ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/usuarios');

    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message;
      setError('Erro ao salvar usuário: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const perfisPermitidos = getPerfisPermitidos();

  if (loading && isEdit) {
    return (
      <div className="usuario-form-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados do usuário...</p>
      </div>
    );
  }

  return (
    <div className="usuario-form">
      <div className="usuario-form-header">
        <h1>{isEdit ? '✏️ Editar Usuário' : '👤 Novo Usuário'}</h1>
        <p>{isEdit ? 'Atualize os dados do usuário' : 'Cadastre um novo usuário no sistema'}</p>
        
        <div className="user-info-logado">
          <small>👋 Logado como: <strong>{user?.nome}</strong> ({user?.perfil})</small>
          <small>🔧 Pode criar: <strong>{perfisPermitidos.length} perfis</strong></small>
        </div>
        
        <Link to="/usuarios" className="btn btn--secondary">
          ↩️ Voltar para Lista
        </Link>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="usuario-form-content">
        <div className="form-grid">
          {/* Nome */}
          <div className="form-group">
            <label htmlFor="nome">Nome Completo *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="Digite o nome completo"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Digite o email"
            />
          </div>

          {/* Perfil - ✅ CORREÇÃO COMPLETA */}
          <div className="form-group">
            <label htmlFor="perfil">Perfil *</label>
            <select
              id="perfil"
              name="perfil"
              value={formData.perfil}
              onChange={handleChange}
              required
              disabled={perfisPermitidos.length === 0}
            >
              {perfisPermitidos.length === 0 ? (
                <option value="">❌ Você não tem permissão para criar usuários</option>
              ) : (
                perfisPermitidos.map(perfil => (
                  <option key={perfil.value} value={perfil.value}>
                    {perfil.label}
                  </option>
                ))
              )}
            </select>
            <small className="help-text">
              Perfis disponíveis para <strong>{user?.perfil}</strong>: {perfisPermitidos.length} opções
            </small>
          </div>

          {/* Departamento */}
          <div className="form-group">
            <label htmlFor="departamento">Departamento</label>
            <select
              id="departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
            >
              <option value="TI">💻 TI</option>
              <option value="Suporte">🔧 Suporte Técnico</option>
              <option value="Infraestrutura">🏗️ Infraestrutura</option>
              <option value="Desenvolvimento">⚙️ Desenvolvimento</option>
              <option value="Manutenção">🔩 Manutenção</option>
              <option value="RH">👥 Recursos Humanos</option>
            </select>
          </div>

          {/* Status (Ativo/Inativo) */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
              />
              <span className="checkbox-custom"></span>
              ✅ Usuário Ativo
            </label>
            <small className="help-text">
              Usuários inativos não podem fazer login no sistema
            </small>
          </div>

          {/* Senha */}
          <div className="form-group">
            <label htmlFor="senha">
              {isEdit ? 'Nova Senha' : 'Senha *'} 
              {isEdit && <span className="optional">(deixe em branco para manter a atual)</span>}
            </label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder={isEdit ? "Digite nova senha (opcional)" : "Digite a senha (mín. 6 caracteres)"}
              minLength="6"
            />
            <small className="help-text">
              💡 Dica: Use "123456" para teste (senha temporária)
            </small>
          </div>

          {/* Confirmar Senha */}
          <div className="form-group">
            <label htmlFor="confirmarSenha">
              {isEdit ? 'Confirmar Nova Senha' : 'Confirmar Senha *'}
              {isEdit && <span className="optional">(deixe em branco para manter a atual)</span>}
            </label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              placeholder={isEdit ? "Confirme nova senha (opcional)" : "Confirme a senha"}
              minLength="6"
            />
          </div>
        </div>

        <div className="form-info">
          <h4>ℹ️ Informações do Sistema:</h4>
          <ul>
            <li><strong>Usuário Logado:</strong> {user?.nome} ({user?.perfil})</li>
            <li><strong>Status:</strong> {formData.ativo ? '✅ Ativo' : '❌ Inativo'}</li>
            <li><strong>Privilégios:</strong> Baseados no perfil atribuído</li>
            <li><strong>Senha padrão para teste:</strong> 123456</li>
            <li><strong>Perfis que você pode criar:</strong> {
              perfisPermitidos.map(p => p.value).join(', ') || 'Nenhum'
            }</li>
          </ul>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading || perfisPermitidos.length === 0}
          >
            {loading ? '⏳ Salvando...' : 
             (perfisPermitidos.length === 0 ? '❌ Sem Permissão' : 
              (isEdit ? '💾 Atualizar Usuário' : '✨ Criar Usuário'))}
          </button>
          
          <Link to="/usuarios" className="btn btn--secondary">
            ❌ Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
};

export default UsuarioForm;