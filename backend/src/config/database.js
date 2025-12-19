const { Sequelize } = require('sequelize');

// 🔥 CONEXÃO DIRETA - SEM .env aqui
const sequelize = new Sequelize(
  'controle_estoque_ti',  // Nome do banco DIRETO
  'root',                 // Usuário DIRETO  
  '',                     // Senha VAZIA diretamente
  {
    host: '127.0.0.1',    // Host DIRETO
    dialect: 'mysql',
    logging: false,
    port: 3306,
    timezone: '-03:00'
  }
);

// Testar conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ CONEXÃO COM BANCO DE DADOS ESTABELECIDA!');
    console.log('📊 Banco: controle_estoque_ti');
    console.log('🎯 Host: 127.0.0.1:3306');
    console.log('👤 Usuário: root');
    console.log('🔐 Senha: [VAZIA]');
    return true;
  } catch (error) {
    console.error('❌ ERRO AO CONECTAR NO BANCO:', error.message);
    console.log('🔧 Dica: Verifique se:');
    console.log('   - MySQL está rodando');
    console.log('   - Banco "controle_estoque_ti" existe');
    console.log('   - Usuário "root" tem acesso sem senha');
    return false;
  }
};

// Sincronizar modelos
const syncModels = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ MODELOS SINCRONIZADOS COM O BANCO!');
    return true;
  } catch (error) {
    console.error('❌ ERRO AO SINCRONIZAR MODELOS:', error.message);
    return false;
  }
};

module.exports = { 
  sequelize, 
  testConnection, 
  syncModels 
};