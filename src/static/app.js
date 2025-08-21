// Variáveis globais
let currentSection = 'dashboard';
let clientes = [];
let produtos = [];
let ordens = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setActiveNavLink('dashboard');
});

// Navegação
function showSection(section) {
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Mostrar seção selecionada
    document.getElementById(section + '-section').classList.remove('hidden');
    
    // Atualizar título da página
    const titles = {
        'dashboard': 'Dashboard',
        'clientes': 'Gerenciar Clientes',
        'produtos': 'Gerenciar Produtos',
        'ordens': 'Gerenciar Ordens de Serviço',
        'consulta-publica': 'Consulta Pública'
    };
    document.getElementById('page-title').textContent = titles[section];
    
    // Atualizar link ativo
    setActiveNavLink(section);
    
    // Carregar dados da seção
    currentSection = section;
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'clientes':
            loadClientes();
            break;
        case 'produtos':
            loadProdutos();
            break;
        case 'ordens':
            loadOrdens();
            break;
    }
}

function setActiveNavLink(section) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-blue-50', 'text-blue-600');
        link.classList.add('text-gray-700');
    });
    
    const activeLink = document.querySelector(`[onclick="showSection('${section}')"]`);
    if (activeLink) {
        activeLink.classList.add('bg-blue-50', 'text-blue-600');
        activeLink.classList.remove('text-gray-700');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// Dashboard
async function loadDashboard() {
    try {
        // Carregar estatísticas
        const [clientesRes, ordensRes, produtosRes] = await Promise.all([
            fetch('/api/clientes'),
            fetch('/api/ordens-servico'),
            fetch('/api/produtos')
        ]);
        
        const clientesData = await clientesRes.json();
        const ordensData = await ordensRes.json();
        const produtosData = await produtosRes.json();
        
        // Atualizar cards de estatísticas
        document.getElementById('total-clientes').textContent = clientesData.length;
        document.getElementById('total-produtos').textContent = produtosData.length;
        
        const osConcluidas = ordensData.filter(os => os.status === 'concluida').length;
        const osPendentes = ordensData.filter(os => os.status === 'pendente').length;
        
        document.getElementById('os-concluidas').textContent = osConcluidas;
        document.getElementById('os-pendentes').textContent = osPendentes;
        
        // Carregar ordens recentes
        const ordensRecentes = ordensData.slice(0, 5);
        renderOrdensRecentes(ordensRecentes);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function renderOrdensRecentes(ordens) {
    const tbody = document.getElementById('tabela-ordens-recentes');
    
    if (ordens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhuma ordem de serviço encontrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = ordens.map(ordem => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${ordem.numero_os}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ordem.cliente?.nome || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ordem.status)}">
                    ${getStatusText(ordem.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ ${ordem.valor_total.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(ordem.data_abertura)}</td>
        </tr>
    `).join('');
}

// Clientes
async function loadClientes() {
    try {
        const response = await fetch('/api/clientes');
        clientes = await response.json();
        renderClientes();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

function renderClientes() {
    const container = document.getElementById('lista-clientes');
    
    if (clientes.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum cliente cadastrado</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${clientes.map(cliente => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${cliente.nome}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${cliente.cpf}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${cliente.email || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${cliente.telefone || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="editarCliente(${cliente.id})" class="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                            <button onclick="deletarCliente(${cliente.id})" class="text-red-600 hover:text-red-900">Excluir</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Produtos
async function loadProdutos() {
    try {
        const response = await fetch('/api/produtos');
        produtos = await response.json();
        renderProdutos();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function renderProdutos() {
    const container = document.getElementById('lista-produtos');
    
    if (produtos.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum produto cadastrado</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${produtos.map(produto => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${produto.nome}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${produto.categoria || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ ${produto.preco_unitario.toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${produto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${produto.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="editarProduto(${produto.id})" class="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                            <button onclick="deletarProduto(${produto.id})" class="text-red-600 hover:text-red-900">Excluir</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Ordens de Serviço
async function loadOrdens() {
    try {
        const response = await fetch('/api/ordens-servico');
        ordens = await response.json();
        renderOrdens();
    } catch (error) {
        console.error('Erro ao carregar ordens:', error);
    }
}

function renderOrdens() {
    const container = document.getElementById('lista-ordens');
    
    if (ordens.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma ordem de serviço cadastrada</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número OS</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${ordens.map(ordem => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${ordem.numero_os}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ordem.cliente?.nome || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ordem.status)}">
                                ${getStatusText(ordem.status)}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ ${ordem.valor_total.toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(ordem.data_abertura)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="visualizarOrdem(${ordem.id})" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                            <button onclick="compartilharOrdem('${ordem.token_publico}')" class="text-green-600 hover:text-green-900 mr-3">Compartilhar</button>
                            <button onclick="editarOrdem(${ordem.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">Editar</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Modais
function showClienteModal() {
    document.getElementById('cliente-modal').classList.remove('hidden');
}

function hideClienteModal() {
    document.getElementById('cliente-modal').classList.add('hidden');
    document.getElementById('cliente-nome').value = '';
    document.getElementById('cliente-cpf').value = '';
    document.getElementById('cliente-email').value = '';
    document.getElementById('cliente-telefone').value = '';
    document.getElementById('cliente-endereco').value = '';
}

function showProdutoModal() {
    // TODO: Implementar modal de produto
    alert('Modal de produto será implementado');
}

function showOrdemModal() {
    // TODO: Implementar modal de ordem de serviço
    alert('Modal de ordem de serviço será implementado');
}

// Funções de CRUD
async function salvarCliente(event) {
    event.preventDefault();
    
    const cliente = {
        nome: document.getElementById('cliente-nome').value,
        cpf: document.getElementById('cliente-cpf').value,
        email: document.getElementById('cliente-email').value,
        telefone: document.getElementById('cliente-telefone').value,
        endereco: document.getElementById('cliente-endereco').value
    };
    
    try {
        const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cliente)
        });
        
        if (response.ok) {
            hideClienteModal();
            loadClientes();
            showNotification('Cliente cadastrado com sucesso!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.erro || 'Erro ao cadastrar cliente', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showNotification('Erro ao cadastrar cliente', 'error');
    }
}

async function deletarCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clientes/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadClientes();
            showNotification('Cliente excluído com sucesso!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.erro || 'Erro ao excluir cliente', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showNotification('Erro ao excluir cliente', 'error');
    }
}

// Consulta pública
async function consultarOrdensPorCPF(event) {
    event.preventDefault();
    
    const cpf = document.getElementById('cpf-consulta').value;
    const resultadoDiv = document.getElementById('resultado-consulta');
    
    try {
        const response = await fetch('/publico/consultar-ordens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf })
        });
        
        if (response.ok) {
            const data = await response.json();
            renderResultadoConsulta(data);
            resultadoDiv.classList.remove('hidden');
        } else {
            const error = await response.json();
            resultadoDiv.innerHTML = `<p class="text-red-600 text-center">${error.erro}</p>`;
            resultadoDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Erro na consulta:', error);
        resultadoDiv.innerHTML = '<p class="text-red-600 text-center">Erro ao consultar ordens de serviço</p>';
        resultadoDiv.classList.remove('hidden');
    }
}

function renderResultadoConsulta(data) {
    const resultadoDiv = document.getElementById('resultado-consulta');
    
    if (data.ordens_servico.length === 0) {
        resultadoDiv.innerHTML = '<p class="text-gray-600 text-center">Nenhuma ordem de serviço concluída encontrada.</p>';
        return;
    }
    
    resultadoDiv.innerHTML = `
        <div class="border-t pt-4">
            <h4 class="font-semibold text-gray-800 mb-3">Cliente: ${data.cliente.nome}</h4>
            <div class="space-y-3">
                ${data.ordens_servico.map(ordem => `
                    <div class="bg-gray-50 p-3 rounded-md">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-medium">${ordem.numero_os}</p>
                                <p class="text-sm text-gray-600">${ordem.descricao_servico}</p>
                                <p class="text-sm text-gray-500">Data: ${formatDate(ordem.data_abertura)}</p>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold">R$ ${ordem.valor_total.toFixed(2)}</p>
                                <button onclick="abrirOrdemPublica('${ordem.token_publico}')" class="text-blue-600 hover:text-blue-800 text-sm">
                                    Ver detalhes
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Funções auxiliares
function getStatusColor(status) {
    const colors = {
        'pendente': 'bg-yellow-100 text-yellow-800',
        'em_andamento': 'bg-blue-100 text-blue-800',
        'concluida': 'bg-green-100 text-green-800',
        'cancelada': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status) {
    const texts = {
        'pendente': 'Pendente',
        'em_andamento': 'Em Andamento',
        'concluida': 'Concluída',
        'cancelada': 'Cancelada'
    };
    return texts[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function showNotification(message, type = 'info') {
    // Implementação simples de notificação
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function compartilharOrdem(token) {
    const url = `${window.location.origin}/publico/ordem-servico/${token}`;
    navigator.clipboard.writeText(url).then(() => {
        showNotification('Link copiado para a área de transferência!', 'success');
    }).catch(() => {
        prompt('Copie o link abaixo:', url);
    });
}

function abrirOrdemPublica(token) {
    const url = `/publico/ordem-servico/${token}`;
    window.open(url, '_blank');
}

// Funções placeholder para implementação futura
function editarCliente(id) {
    alert('Funcionalidade de edição será implementada');
}

function editarProduto(id) {
    alert('Funcionalidade de edição será implementada');
}

function deletarProduto(id) {
    alert('Funcionalidade de exclusão será implementada');
}

function editarOrdem(id) {
    alert('Funcionalidade de edição será implementada');
}

function visualizarOrdem(id) {
    alert('Funcionalidade de visualização será implementada');
}

