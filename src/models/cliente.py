from src.models.user import db
from datetime import datetime

class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    email = db.Column(db.String(120), nullable=True)
    telefone = db.Column(db.String(20), nullable=True)
    endereco = db.Column(db.Text, nullable=True)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com ordens de serviço
    ordens_servico = db.relationship('OrdemServico', backref='cliente', lazy=True)

    def __repr__(self):
        return f'<Cliente {self.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'email': self.email,
            'telefone': self.telefone,
            'endereco': self.endereco,
            'data_cadastro': self.data_cadastro.isoformat() if self.data_cadastro else None
        }

