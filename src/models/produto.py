from src.models.user import db
from datetime import datetime

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    preco_unitario = db.Column(db.Float, nullable=False, default=0.0)
    categoria = db.Column(db.String(50), nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Produto {self.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'preco_unitario': self.preco_unitario,
            'categoria': self.categoria,
            'ativo': self.ativo,
            'data_cadastro': self.data_cadastro.isoformat() if self.data_cadastro else None
        }

