from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.ordem_servico import OrdemServico, ItemOrdemServico, Gasto
from src.models.cliente import Cliente
from src.models.produto import Produto
from datetime import datetime
import uuid

ordem_servico_bp = Blueprint('ordem_servico', __name__)

def gerar_numero_os():
    """Gera um número único para a ordem de serviço"""
    import time
    timestamp = str(int(time.time()))[-6:]  # Últimos 6 dígitos do timestamp
    return f"OS{timestamp}"

@ordem_servico_bp.route('/ordens-servico', methods=['GET'])
def listar_ordens_servico():
    """Lista todas as ordens de serviço"""
    try:
        status = request.args.get('status')
        cliente_id = request.args.get('cliente_id')
        
        query = OrdemServico.query
        
        if status:
            query = query.filter_by(status=status)
        if cliente_id:
            query = query.filter_by(cliente_id=cliente_id)
        
        ordens = query.order_by(OrdemServico.data_abertura.desc()).all()
        return jsonify([ordem.to_dict() for ordem in ordens]), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@ordem_servico_bp.route('/ordens-servico', methods=['POST'])
def criar_ordem_servico():
    """Cria uma nova ordem de serviço"""
    try:
        dados = request.get_json()
        
        # Verificar se cliente existe
        cliente = Cliente.query.get(dados['cliente_id'])
        if not cliente:
            return jsonify({'erro': 'Cliente não encontrado'}), 404
        
        ordem = OrdemServico(
            numero_os=gerar_numero_os(),
            cliente_id=dados['cliente_id'],
            descricao_servico=dados['descricao_servico'],
            observacoes=dados.get('observacoes'),
            valor_servico=dados.get('valor_servico', 0.0),
            data_prazo=datetime.fromisoformat(dados['data_prazo']) if dados.get('data_prazo') else None
        )
        
        db.session.add(ordem)
        db.session.flush()  # Para obter o ID da ordem
        
        # Adicionar itens se fornecidos
        if dados.get('itens'):
            for item_data in dados['itens']:
                produto = Produto.query.get(item_data['produto_id'])
                if not produto:
                    continue
                
                item = ItemOrdemServico(
                    ordem_servico_id=ordem.id,
                    produto_id=item_data['produto_id'],
                    quantidade=item_data['quantidade'],
                    preco_unitario=item_data.get('preco_unitario', produto.preco_unitario)
                )
                item.calcular_subtotal()
                db.session.add(item)
        
        # Calcular total
        ordem.calcular_total()
        
        db.session.commit()
        
        return jsonify(ordem.to_dict(incluir_token=True)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@ordem_servico_bp.route('/ordens-servico/<int:ordem_id>', methods=['GET'])
def obter_ordem_servico(ordem_id):
    """Obtém uma ordem de serviço específica"""
    try:
        ordem = OrdemServico.query.get_or_404(ordem_id)
        return jsonify(ordem.to_dict(incluir_token=True)), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@ordem_servico_bp.route('/ordens-servico/<int:ordem_id>', methods=['PUT'])
def atualizar_ordem_servico(ordem_id):
    """Atualiza uma ordem de serviço"""
    try:
        ordem = OrdemServico.query.get_or_404(ordem_id)
        dados = request.get_json()
        
        ordem.descricao_servico = dados.get('descricao_servico', ordem.descricao_servico)
        ordem.observacoes = dados.get('observacoes', ordem.observacoes)
        ordem.status = dados.get('status', ordem.status)
        ordem.valor_servico = dados.get('valor_servico', ordem.valor_servico)
        
        if dados.get('data_prazo'):
            ordem.data_prazo = datetime.fromisoformat(dados['data_prazo'])
        
        if dados.get('status') == 'concluida' and not ordem.data_conclusao:
            ordem.data_conclusao = datetime.utcnow()
        
        # Recalcular total
        ordem.calcular_total()
        
        db.session.commit()
        
        return jsonify(ordem.to_dict(incluir_token=True)), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@ordem_servico_bp.route('/ordens-servico/<int:ordem_id>/itens', methods=['POST'])
def adicionar_item_ordem(ordem_id):
    """Adiciona um item à ordem de serviço"""
    try:
        ordem = OrdemServico.query.get_or_404(ordem_id)
        dados = request.get_json()
        
        produto = Produto.query.get(dados['produto_id'])
        if not produto:
            return jsonify({'erro': 'Produto não encontrado'}), 404
        
        item = ItemOrdemServico(
            ordem_servico_id=ordem_id,
            produto_id=dados['produto_id'],
            quantidade=dados['quantidade'],
            preco_unitario=dados.get('preco_unitario', produto.preco_unitario)
        )
        item.calcular_subtotal()
        
        db.session.add(item)
        ordem.calcular_total()
        db.session.commit()
        
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@ordem_servico_bp.route('/ordens-servico/<int:ordem_id>/gastos', methods=['POST'])
def adicionar_gasto_ordem(ordem_id):
    """Adiciona um gasto à ordem de serviço"""
    try:
        ordem = OrdemServico.query.get_or_404(ordem_id)
        dados = request.get_json()
        
        gasto = Gasto(
            ordem_servico_id=ordem_id,
            descricao=dados['descricao'],
            valor=dados['valor'],
            categoria=dados.get('categoria')
        )
        
        db.session.add(gasto)
        db.session.commit()
        
        return jsonify(gasto.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@ordem_servico_bp.route('/ordens-servico/<int:ordem_id>/itens/<int:item_id>', methods=['DELETE'])
def remover_item_ordem(ordem_id, item_id):
    """Remove um item da ordem de serviço"""
    try:
        item = ItemOrdemServico.query.filter_by(id=item_id, ordem_servico_id=ordem_id).first_or_404()
        ordem = item.ordem_servico
        
        db.session.delete(item)
        ordem.calcular_total()
        db.session.commit()
        
        return jsonify({'mensagem': 'Item removido com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@ordem_servico_bp.route('/ordens-servico/<int:ordem_id>/gastos/<int:gasto_id>', methods=['DELETE'])
def remover_gasto_ordem(ordem_id, gasto_id):
    """Remove um gasto da ordem de serviço"""
    try:
        gasto = Gasto.query.filter_by(id=gasto_id, ordem_servico_id=ordem_id).first_or_404()
        
        db.session.delete(gasto)
        db.session.commit()
        
        return jsonify({'mensagem': 'Gasto removido com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

