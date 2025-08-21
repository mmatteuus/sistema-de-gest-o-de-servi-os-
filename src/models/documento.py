from src.models.user import db
from datetime import datetime

class Documento(db.Model):
    __tablename__ = 'documentos'
    
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(50), nullable=False)  # 'prestacao_servico' ou 'venda_produto'
    cliente_id = db.Column(db.Integer, nullable=False)
    produto_id = db.Column(db.Integer, nullable=True)  # Apenas para vendas
    data = db.Column(db.Date, nullable=False)
    descricao = db.Column(db.Text, nullable=True)  # Para prestação de serviço
    quantidade = db.Column(db.Integer, nullable=True)  # Para venda de produto
    valor_unitario = db.Column(db.Float, nullable=True)  # Para venda de produto
    valor_total = db.Column(db.Float, nullable=False)
    forma_pagamento = db.Column(db.String(50), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        # Buscar cliente e produto manualmente para evitar problemas de relacionamento
        from src.models.cliente import Cliente
        from src.models.produto import Produto
        
        cliente = Cliente.query.get(self.cliente_id) if self.cliente_id else None
        produto = Produto.query.get(self.produto_id) if self.produto_id else None
        
        return {
            'id': self.id,
            'tipo': self.tipo,
            'cliente_id': self.cliente_id,
            'cliente_nome': cliente.nome if cliente else None,
            'produto_id': self.produto_id,
            'produto_nome': produto.nome if produto else None,
            'data': self.data.isoformat() if self.data else None,
            'descricao': self.descricao,
            'quantidade': self.quantidade,
            'valor_unitario': self.valor_unitario,
            'valor_total': self.valor_total,
            'forma_pagamento': self.forma_pagamento,
            'token': self.token,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

