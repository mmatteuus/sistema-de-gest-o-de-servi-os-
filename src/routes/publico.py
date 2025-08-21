from flask import Blueprint, request, jsonify
from src.models.ordem_servico import OrdemServico
from src.models.cliente import Cliente

publico_bp = Blueprint('publico', __name__)

@publico_bp.route('/ordem-servico/<token>', methods=['GET'])
def visualizar_ordem_servico_publica(token):
    """Permite visualizar uma ordem de serviço através do token público"""
    try:
        ordem = OrdemServico.query.filter_by(token_publico=token).first()
        if not ordem:
            return jsonify({'erro': 'Ordem de serviço não encontrada'}), 404
        
        # Retornar dados da ordem sem informações sensíveis
        return jsonify(ordem.to_dict()), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@publico_bp.route('/consultar-ordens', methods=['POST'])
def consultar_ordens_por_cpf():
    """Permite que o cliente consulte suas ordens de serviço usando CPF"""
    try:
        dados = request.get_json()
        cpf = dados.get('cpf')
        
        if not cpf:
            return jsonify({'erro': 'CPF é obrigatório'}), 400
        
        # Buscar cliente pelo CPF
        cliente = Cliente.query.filter_by(cpf=cpf).first()
        if not cliente:
            return jsonify({'erro': 'Nenhuma ordem de serviço encontrada para este CPF'}), 404
        
        # Buscar ordens de serviço do cliente
        ordens = OrdemServico.query.filter_by(cliente_id=cliente.id).order_by(OrdemServico.data_abertura.desc()).all()
        
        # Retornar apenas ordens concluídas para consulta pública
        ordens_publicas = [ordem.to_dict() for ordem in ordens if ordem.status == 'concluida']
        
        return jsonify({
            'cliente': cliente.to_dict(),
            'ordens_servico': ordens_publicas
        }), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@publico_bp.route('/gerar-pdf/<token>', methods=['GET'])
def gerar_pdf_ordem_servico(token):
    """Gera PDF da ordem de serviço (placeholder - implementar geração de PDF)"""
    try:
        ordem = OrdemServico.query.filter_by(token_publico=token).first()
        if not ordem:
            return jsonify({'erro': 'Ordem de serviço não encontrada'}), 404
        
        # TODO: Implementar geração de PDF
        return jsonify({
            'mensagem': 'Funcionalidade de PDF será implementada em breve',
            'ordem': ordem.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

