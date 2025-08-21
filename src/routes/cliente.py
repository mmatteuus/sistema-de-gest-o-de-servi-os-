from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.cliente import Cliente

cliente_bp = Blueprint('cliente', __name__)

@cliente_bp.route('/clientes', methods=['GET'])
def listar_clientes():
    """Lista todos os clientes"""
    try:
        clientes = Cliente.query.all()
        return jsonify([cliente.to_dict() for cliente in clientes]), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@cliente_bp.route('/clientes', methods=['POST'])
def criar_cliente():
    """Cria um novo cliente"""
    try:
        dados = request.get_json()
        
        # Verificar se CPF já existe
        if Cliente.query.filter_by(cpf=dados['cpf']).first():
            return jsonify({'erro': 'CPF já cadastrado'}), 400
        
        cliente = Cliente(
            nome=dados['nome'],
            cpf=dados['cpf'],
            email=dados.get('email'),
            telefone=dados.get('telefone'),
            endereco=dados.get('endereco')
        )
        
        db.session.add(cliente)
        db.session.commit()
        
        return jsonify(cliente.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['GET'])
def obter_cliente(cliente_id):
    """Obtém um cliente específico"""
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        return jsonify(cliente.to_dict()), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['PUT'])
def atualizar_cliente(cliente_id):
    """Atualiza um cliente"""
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        dados = request.get_json()
        
        # Verificar se CPF já existe em outro cliente
        if dados.get('cpf') and dados['cpf'] != cliente.cpf:
            if Cliente.query.filter_by(cpf=dados['cpf']).first():
                return jsonify({'erro': 'CPF já cadastrado'}), 400
        
        cliente.nome = dados.get('nome', cliente.nome)
        cliente.cpf = dados.get('cpf', cliente.cpf)
        cliente.email = dados.get('email', cliente.email)
        cliente.telefone = dados.get('telefone', cliente.telefone)
        cliente.endereco = dados.get('endereco', cliente.endereco)
        
        db.session.commit()
        
        return jsonify(cliente.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['DELETE'])
def deletar_cliente(cliente_id):
    """Deleta um cliente"""
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        
        # Verificar se cliente tem ordens de serviço
        if cliente.ordens_servico:
            return jsonify({'erro': 'Cliente possui ordens de serviço e não pode ser deletado'}), 400
        
        db.session.delete(cliente)
        db.session.commit()
        
        return jsonify({'mensagem': 'Cliente deletado com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@cliente_bp.route('/clientes/buscar', methods=['GET'])
def buscar_cliente_por_cpf():
    """Busca cliente por CPF"""
    try:
        cpf = request.args.get('cpf')
        if not cpf:
            return jsonify({'erro': 'CPF é obrigatório'}), 400
        
        cliente = Cliente.query.filter_by(cpf=cpf).first()
        if not cliente:
            return jsonify({'erro': 'Cliente não encontrado'}), 404
        
        return jsonify(cliente.to_dict()), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

