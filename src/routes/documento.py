from flask import Blueprint, request, jsonify, render_template_string
from src.models.documento import Documento
from src.models.cliente import Cliente
from src.models.produto import Produto
from src.models.user import db
import uuid
from datetime import datetime

documento_bp = Blueprint('documento', __name__)

@documento_bp.route('/api/documentos', methods=['GET'])
def listar_documentos():
    try:
        documentos = Documento.query.order_by(Documento.created_at.desc()).all()
        return jsonify([doc.to_dict() for doc in documentos])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documento_bp.route('/api/documentos', methods=['POST'])
def criar_documento():
    try:
        data = request.get_json()
        
        # Gerar token único
        token = str(uuid.uuid4())
        
        # Converter string de data para objeto date
        data_obj = datetime.strptime(data['data'], '%Y-%m-%d').date()
        
        documento = Documento(
            tipo=data['tipo'],
            cliente_id=data['cliente_id'],
            produto_id=data.get('produto_id'),
            data=data_obj,
            descricao=data.get('descricao'),
            quantidade=data.get('quantidade'),
            valor_unitario=data.get('valor_unitario'),
            valor_total=data.get('valor_total', data.get('valor')),
            forma_pagamento=data['forma_pagamento'],
            token=token
        )
        
        db.session.add(documento)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'documento': documento.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@documento_bp.route('/api/documentos/<int:documento_id>', methods=['GET'])
def obter_documento(documento_id):
    try:
        documento = Documento.query.get_or_404(documento_id)
        return jsonify(documento.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documento_bp.route('/api/documentos/<int:documento_id>/pdf', methods=['GET'])
def gerar_pdf_documento(documento_id):
    try:
        documento = Documento.query.get_or_404(documento_id)
        
        # Template HTML para o documento
        if documento.tipo == 'prestacao_servico':
            template = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Prestação de Serviço</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info { margin-bottom: 20px; }
                    .label { font-weight: bold; }
                    .value { margin-left: 10px; }
                    .footer { margin-top: 40px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>PRESTAÇÃO DE SERVIÇO</h1>
                    <p>Documento Nº: {{ documento.id }}</p>
                </div>
                
                <div class="info">
                    <p><span class="label">Cliente:</span><span class="value">{{ documento.cliente.nome }}</span></p>
                    <p><span class="label">CPF:</span><span class="value">{{ documento.cliente.cpf }}</span></p>
                    <p><span class="label">Data:</span><span class="value">{{ documento.data.strftime('%d/%m/%Y') }}</span></p>
                </div>
                
                <div class="info">
                    <p><span class="label">Descrição do Serviço:</span></p>
                    <p>{{ documento.descricao }}</p>
                </div>
                
                <div class="info">
                    <p><span class="label">Valor:</span><span class="value">R$ {{ "%.2f"|format(documento.valor_total) }}</span></p>
                    <p><span class="label">Forma de Pagamento:</span><span class="value">{{ documento.forma_pagamento.title() }}</span></p>
                </div>
                
                <div class="footer">
                    <p>Documento gerado em {{ datetime.now().strftime('%d/%m/%Y às %H:%M') }}</p>
                </div>
            </body>
            </html>
            """
        else:  # venda_produto
            template = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Venda de Produto</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info { margin-bottom: 20px; }
                    .label { font-weight: bold; }
                    .value { margin-left: 10px; }
                    .footer { margin-top: 40px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>VENDA DE PRODUTO</h1>
                    <p>Documento Nº: {{ documento.id }}</p>
                </div>
                
                <div class="info">
                    <p><span class="label">Cliente:</span><span class="value">{{ documento.cliente.nome }}</span></p>
                    <p><span class="label">CPF:</span><span class="value">{{ documento.cliente.cpf }}</span></p>
                    <p><span class="label">Data:</span><span class="value">{{ documento.data.strftime('%d/%m/%Y') }}</span></p>
                </div>
                
                <div class="info">
                    <p><span class="label">Produto:</span><span class="value">{{ documento.produto.nome if documento.produto else 'N/A' }}</span></p>
                    <p><span class="label">Quantidade:</span><span class="value">{{ documento.quantidade }}</span></p>
                    <p><span class="label">Valor Unitário:</span><span class="value">R$ {{ "%.2f"|format(documento.valor_unitario) }}</span></p>
                </div>
                
                <div class="info">
                    <p><span class="label">Valor Total:</span><span class="value">R$ {{ "%.2f"|format(documento.valor_total) }}</span></p>
                    <p><span class="label">Forma de Pagamento:</span><span class="value">{{ documento.forma_pagamento.title() }}</span></p>
                </div>
                
                <div class="footer">
                    <p>Documento gerado em {{ datetime.now().strftime('%d/%m/%Y às %H:%M') }}</p>
                </div>
            </body>
            </html>
            """
        
        html_content = render_template_string(template, documento=documento, datetime=datetime)
        
        return html_content, 200, {
            'Content-Type': 'text/html; charset=utf-8'
        }
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documento_bp.route('/publico/documento/<int:documento_id>', methods=['GET'])
def visualizar_documento_publico(documento_id):
    try:
        documento = Documento.query.get_or_404(documento_id)
        
        # Template HTML público para visualização
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{ 'Prestação de Serviço' if documento.tipo == 'prestacao_servico' else 'Venda de Produto' }}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body class="bg-gray-50 min-h-screen py-8">
            <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <div class="text-center mb-8">
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">
                        {{ 'PRESTAÇÃO DE SERVIÇO' if documento.tipo == 'prestacao_servico' else 'VENDA DE PRODUTO' }}
                    </h1>
                    <p class="text-gray-600">Documento Nº: {{ documento.id }}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 class="font-semibold text-gray-800 mb-3">Dados do Cliente</h3>
                        <p><span class="font-medium">Nome:</span> {{ documento.cliente.nome }}</p>
                        <p><span class="font-medium">CPF:</span> {{ documento.cliente.cpf }}</p>
                        {% if documento.cliente.email %}
                        <p><span class="font-medium">Email:</span> {{ documento.cliente.email }}</p>
                        {% endif %}
                    </div>
                    
                    <div>
                        <h3 class="font-semibold text-gray-800 mb-3">Dados do Documento</h3>
                        <p><span class="font-medium">Data:</span> {{ documento.data.strftime('%d/%m/%Y') }}</p>
                        <p><span class="font-medium">Pagamento:</span> {{ documento.forma_pagamento.title() }}</p>
                    </div>
                </div>
                
                {% if documento.tipo == 'prestacao_servico' %}
                <div class="mb-6">
                    <h3 class="font-semibold text-gray-800 mb-3">Descrição do Serviço</h3>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p>{{ documento.descricao }}</p>
                    </div>
                </div>
                {% else %}
                <div class="mb-6">
                    <h3 class="font-semibold text-gray-800 mb-3">Detalhes do Produto</h3>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p><span class="font-medium">Produto:</span> {{ documento.produto.nome if documento.produto else 'N/A' }}</p>
                        <p><span class="font-medium">Quantidade:</span> {{ documento.quantidade }}</p>
                        <p><span class="font-medium">Valor Unitário:</span> R$ {{ "%.2f"|format(documento.valor_unitario) }}</p>
                    </div>
                </div>
                {% endif %}
                
                <div class="border-t pt-6">
                    <div class="text-right">
                        <p class="text-2xl font-bold text-gray-800">
                            Total: R$ {{ "%.2f"|format(documento.valor_total) }}
                        </p>
                    </div>
                </div>
                
                <div class="mt-8 text-center text-sm text-gray-500">
                    <p>Documento gerado em {{ datetime.now().strftime('%d/%m/%Y às %H:%M') }}</p>
                </div>
                
                <div class="mt-6 text-center">
                    <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-print mr-2"></i>Imprimir
                    </button>
                </div>
            </div>
        </body>
        </html>
        """
        
        return render_template_string(template, documento=documento, datetime=datetime)
        
    except Exception as e:
        return f"Erro ao carregar documento: {str(e)}", 500

