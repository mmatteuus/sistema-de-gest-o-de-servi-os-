from src.models.user import db
from datetime import datetime
import uuid

class OrdemServico(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero_os = db.Column(db.String(20), unique=True, nullable=False)
    token_publico = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    # Relacionamento com cliente
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)
    
    # Informações da OS
    descricao_servico = db.Column(db.Text, nullable=False)
    observacoes = db.Column(db.Text, nullable=True)
    
    # Status e datas
    status = db.Column(db.String(20), default='pendente')  # pendente, em_andamento, concluida, cancelada
    data_abertura = db.Column(db.DateTime, default=datetime.utcnow)
    data_conclusao = db.Column(db.DateTime, nullable=True)
    data_prazo = db.Column(db.DateTime, nullable=True)
    
    # Valores
    valor_servico = db.Column(db.Float, default=0.0)
    valor_produtos = db.Column(db.Float, default=0.0)
    valor_total = db.Column(db.Float, default=0.0)
    
    # Relacionamentos
    itens = db.relationship('ItemOrdemServico', backref='ordem_servico', lazy=True, cascade='all, delete-orphan')
    gastos = db.relationship('Gasto', backref='ordem_servico', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<OrdemServico {self.numero_os}>'

    def calcular_total(self):
        """Calcula o valor total da ordem de serviço"""
        self.valor_produtos = sum([item.subtotal for item in self.itens])
        self.valor_total = self.valor_servico + self.valor_produtos
        return self.valor_total

    def to_dict(self, incluir_token=False):
        data = {
            'id': self.id,
            'numero_os': self.numero_os,
            'cliente_id': self.cliente_id,
            'descricao_servico': self.descricao_servico,
            'observacoes': self.observacoes,
            'status': self.status,
            'data_abertura': self.data_abertura.isoformat() if self.data_abertura else None,
            'data_conclusao': self.data_conclusao.isoformat() if self.data_conclusao else None,
            'data_prazo': self.data_prazo.isoformat() if self.data_prazo else None,
            'valor_servico': self.valor_servico,
            'valor_produtos': self.valor_produtos,
            'valor_total': self.valor_total,
            'cliente': self.cliente.to_dict() if self.cliente else None,
            'itens': [item.to_dict() for item in self.itens],
            'gastos': [gasto.to_dict() for gasto in self.gastos]
        }
        
        if incluir_token:
            data['token_publico'] = self.token_publico
            
        return data


class ItemOrdemServico(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ordem_servico_id = db.Column(db.Integer, db.ForeignKey('ordem_servico.id'), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'), nullable=False)
    quantidade = db.Column(db.Float, nullable=False, default=1.0)
    preco_unitario = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    
    # Relacionamento
    produto = db.relationship('Produto', backref='itens_ordem', lazy=True)

    def __repr__(self):
        return f'<ItemOrdemServico OS:{self.ordem_servico_id} Produto:{self.produto_id}>'

    def calcular_subtotal(self):
        """Calcula o subtotal do item"""
        self.subtotal = self.quantidade * self.preco_unitario
        return self.subtotal

    def to_dict(self):
        return {
            'id': self.id,
            'produto_id': self.produto_id,
            'quantidade': self.quantidade,
            'preco_unitario': self.preco_unitario,
            'subtotal': self.subtotal,
            'produto': self.produto.to_dict() if self.produto else None
        }


class Gasto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ordem_servico_id = db.Column(db.Integer, db.ForeignKey('ordem_servico.id'), nullable=False)
    descricao = db.Column(db.String(200), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    data_gasto = db.Column(db.DateTime, default=datetime.utcnow)
    categoria = db.Column(db.String(50), nullable=True)

    def __repr__(self):
        return f'<Gasto {self.descricao}: R$ {self.valor}>'

    def to_dict(self):
        return {
            'id': self.id,
            'descricao': self.descricao,
            'valor': self.valor,
            'data_gasto': self.data_gasto.isoformat() if self.data_gasto else None,
            'categoria': self.categoria
        }

