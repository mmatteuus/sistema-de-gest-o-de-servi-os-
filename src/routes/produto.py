from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.produto import Produto

produto_bp = Blueprint('produto', __name__)

@produto_bp.route('/produtos', methods=['GET'])
def listar_produtos():
    """Lista todos os produtos"""
    try:
        ativo = request.args.get('ativo')
        if ativo is not None:
            ativo = ativo.lower() == 'true'
            produtos = Produto.query.filter_by(ativo=ativo).all()
        else:
            produtos = Produto.query.all()
        
        return jsonify([produto.to_dict() for produto in produtos]), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@produto_bp.route('/produtos', methods=['POST'])
def criar_produto():
    """Cria um novo produto"""
    try:
        dados = request.get_json()
        
        produto = Produto(
            nome=dados['nome'],
            descricao=dados.get('descricao'),
            preco_unitario=dados['preco_unitario'],
            categoria=dados.get('categoria'),
            ativo=dados.get('ativo', True)
        )
        
        db.session.add(produto)
        db.session.commit()
        
        return jsonify(produto.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@produto_bp.route('/produtos/<int:produto_id>', methods=['GET'])
def obter_produto(produto_id):
    """Obtém um produto específico"""
    try:
        produto = Produto.query.get_or_404(produto_id)
        return jsonify(produto.to_dict()), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@produto_bp.route('/produtos/<int:produto_id>', methods=['PUT'])
def atualizar_produto(produto_id):
    """Atualiza um produto"""
    try:
        produto = Produto.query.get_or_404(produto_id)
        dados = request.get_json()
        
        produto.nome = dados.get('nome', produto.nome)
        produto.descricao = dados.get('descricao', produto.descricao)
        produto.preco_unitario = dados.get('preco_unitario', produto.preco_unitario)
        produto.categoria = dados.get('categoria', produto.categoria)
        produto.ativo = dados.get('ativo', produto.ativo)
        
        db.session.commit()
        
        return jsonify(produto.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@produto_bp.route('/produtos/<int:produto_id>', methods=['DELETE'])
def deletar_produto(produto_id):
    """Deleta um produto"""
    try:
        produto = Produto.query.get_or_404(produto_id)
        
        # Verificar se produto está sendo usado em ordens de serviço
        if produto.itens_ordem:
            return jsonify({'erro': 'Produto está sendo usado em ordens de serviço e não pode ser deletado'}), 400
        
        db.session.delete(produto)
        db.session.commit()
        
        return jsonify({'mensagem': 'Produto deletado com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

