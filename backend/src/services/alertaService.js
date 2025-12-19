// services/alertaService.js - SERVIÇO DE ALERTAS
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { Item, Movimentacao, Manutencao, AlertasEstoque } = require('../models/associations');

class AlertaService {
  
  // Verificar estoque baixo
  static async verificarEstoqueBaixo() {
    try {
      const itensComEstoqueBaixo = await Item.findAll({
        where: {
          quantidade: { [Op.lte]: sequelize.col('estoque_minimo') }
        }
      });

      let alertasCriados = 0;

      for (const item of itensComEstoqueBaixo) {
        const quantidade = item.quantidade;
        const estoqueMinimo = item.estoque_minimo;
        
        let nivelAlerta = null;
        if (quantidade === 0) {
          nivelAlerta = 'zero';
        } else if (quantidade <= 2) {
          nivelAlerta = 'critico';
        } else if (quantidade <= estoqueMinimo) {
          nivelAlerta = 'baixo';
        }

        if (nivelAlerta) {
          const alertaExistente = await AlertasEstoque.findOne({
            where: {
              item_id: item.id,
              nivel_alerta: nivelAlerta,
              lido: false
            }
          });

          if (!alertaExistente) {
            await AlertasEstoque.create({
              item_id: item.id,
              nivel_alerta: nivelAlerta,
              quantidade_atual: quantidade,
              estoque_minimo: estoqueMinimo,
              mensagem: `${item.nome} está com estoque ${nivelAlerta}. Quantidade atual: ${quantidade}, Mínimo: ${estoqueMinimo}`
            });
            alertasCriados++;
          }
        }
      }

      return { tipo: 'estoque', total: alertasCriados };
    } catch (error) {
      console.error('❌ Erro ao verificar estoque baixo:', error);
      throw error;
    }
  }

  // Verificar devoluções atrasadas
  static async verificarDevolucoesAtrasadas() {
    try {
      const hoje = new Date();
      
      const movimentacoesAtrasadas = await Movimentacao.findAll({
        where: {
          tipo: 'saida',
          data_devolucao_prevista: {
            [Op.lt]: hoje
          }
        },
        include: [
          {
            model: Item,
            as: 'item',
            attributes: ['id', 'nome']
          }
        ]
      });

      let alertasCriados = 0;

      for (const mov of movimentacoesAtrasadas) {
        const alertaExistente = await AlertasEstoque.findOne({
          where: {
            item_id: mov.item_id,
            mensagem: { [Op.like]: `%${mov.item.nome}%devolução atrasada%` },
            lido: false
          }
        });

        if (!alertaExistente) {
          await AlertasEstoque.create({
            item_id: mov.item_id,
            nivel_alerta: 'critico',
            quantidade_atual: mov.quantidade,
            estoque_minimo: 0,
            mensagem: `Devolução atrasada: ${mov.item.nome} com ${mov.destinatario}. Data prevista: ${mov.data_devolucao_prevista}`
          });
          alertasCriados++;
        }
      }

      return { tipo: 'devolucao', total: alertasCriados };
    } catch (error) {
      console.error('❌ Erro ao verificar devoluções atrasadas:', error);
      throw error;
    }
  }

  // Executar todas as verificações
  static async executarVerificacoes() {
    try {
      console.log('🔄 Executando verificações de alertas...');
      
      const [estoqueResult, devolucaoResult] = await Promise.all([
        this.verificarEstoqueBaixo(),
        this.verificarDevolucoesAtrasadas()
      ]);

      const total = estoqueResult.total + devolucaoResult.total;
      
      console.log(`✅ Verificações concluídas: ${total} alertas criados`);
      
      return {
        total: total,
        detalhes: [estoqueResult, devolucaoResult],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Erro ao executar verificações:', error);
      throw error;
    }
  }
}

module.exports = AlertaService;