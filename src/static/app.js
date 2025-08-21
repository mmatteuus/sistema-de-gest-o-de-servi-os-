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

// Navegação com animações suaves
function showSection(section) {
    // Esconder todas as seções com animação
    document.querySelectorAll('.section').forEach(el => {
        el.style.opacity = '0';
        setTimeout(() => {
            el.classList.add('hidden');
        }, 150);
    });
    
    // Mostrar seção selecionada com animação
    setTimeout(() => {
        const targetSection = document.getElementById(section + '-section');
        if (targetSection) {
            targetSection.classList.remove('hidden');
            setTimeout(() => {
                targetSection.style.opacity = '1';
            }, 50);
        }
    }, 150);
    
    // Atualizar título da página
    const titles = {
        'dashboard': 'Dashboard',
        'clientes': 'Gerenciar Clientes',
        'produtos': 'Gerenciar Produtos',
        'ordens': 'Gerenciar Ordens de Serviço',
        'consulta-publica': 'Consulta Pública',
        'documentos': 'Documentos',
        'configuracoes': 'Configurações'
    };
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[section];
    }
    
    // Atualizar link ativo
    setActiveNavLink(section);
    
    // Fechar sidebar no mobile
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('-translate-x-full');
        }
    }
    
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
        case 'documentos':
            carregarListaDocumentos();
            break;
        case 'configuracoes':
            loadConfiguracoes();
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


// ===== SISTEMA DE TEMAS =====

// Configurações padrão
let currentTheme = localStorage.getItem('theme') || 'light';
let currentAccentColor = localStorage.getItem('accentColor') || 'blue';

// Inicializar tema ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    applyAccentColor();
    loadConfiguracoes();
});

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
    updateThemeButton();
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', currentTheme);
    applyTheme();
    updateThemeButtons();
}

function applyTheme() {
    const body = document.getElementById('app-body');
    const sidebar = document.getElementById('sidebar');
    
    if (currentTheme === 'dark') {
        body.classList.add('dark-theme');
        sidebar.classList.add('dark-sidebar');
    } else {
        body.classList.remove('dark-theme');
        sidebar.classList.remove('dark-sidebar');
    }
    
    updateThemeButton();
}

function updateThemeButton() {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (currentTheme === 'dark') {
        themeIcon.className = 'fas fa-sun mr-3';
        themeText.textContent = 'Tema Claro';
    } else {
        themeIcon.className = 'fas fa-moon mr-3';
        themeText.textContent = 'Tema Escuro';
    }
}

function updateThemeButtons() {
    const lightBtn = document.getElementById('theme-light-btn');
    const darkBtn = document.getElementById('theme-dark-btn');
    
    if (lightBtn && darkBtn) {
        lightBtn.classList.remove('border-blue-500', 'bg-blue-50');
        darkBtn.classList.remove('border-blue-500', 'bg-blue-50');
        
        if (currentTheme === 'light') {
            lightBtn.classList.add('border-blue-500', 'bg-blue-50');
        } else {
            darkBtn.classList.add('border-blue-500', 'bg-blue-50');
        }
    }
}

// ===== SISTEMA DE CORES =====

function setAccentColor(color) {
    currentAccentColor = color;
    localStorage.setItem('accentColor', currentAccentColor);
    applyAccentColor();
    updateColorButtons();
}

function applyAccentColor() {
    const root = document.documentElement;
    const colorMap = {
        blue: { primary: '#2563eb', hover: '#1d4ed8', light: '#dbeafe' },
        green: { primary: '#059669', hover: '#047857', light: '#d1fae5' },
        purple: { primary: '#7c3aed', hover: '#6d28d9', light: '#e9d5ff' },
        red: { primary: '#dc2626', hover: '#b91c1c', light: '#fee2e2' },
        yellow: { primary: '#eab308', hover: '#ca8a04', light: '#fef3c7' },
        indigo: { primary: '#4f46e5', hover: '#4338ca', light: '#e0e7ff' },
        pink: { primary: '#db2777', hover: '#be185d', light: '#fce7f3' },
        teal: { primary: '#0d9488', hover: '#0f766e', light: '#ccfbf1' }
    };
    
    const colors = colorMap[currentAccentColor];
    if (colors) {
        root.style.setProperty('--accent-primary', colors.primary);
        root.style.setProperty('--accent-hover', colors.hover);
        root.style.setProperty('--accent-light', colors.light);
        
        // Atualizar preview
        const previewBtn = document.querySelector('.preview-btn');
        if (previewBtn) {
            previewBtn.style.backgroundColor = colors.primary;
        }
    }
}

function updateColorButtons() {
    const colorButtons = document.querySelectorAll('.color-option');
    colorButtons.forEach(btn => {
        btn.classList.remove('border-gray-800', 'border-4');
        if (btn.dataset.color === currentAccentColor) {
            btn.classList.add('border-gray-800', 'border-4');
        }
    });
}

// ===== CONFIGURAÇÕES GERAIS =====

function salvarConfiguracoes() {
    const config = {
        empresaNome: document.getElementById('empresa-nome').value,
        empresaCnpj: document.getElementById('empresa-cnpj').value,
        empresaEndereco: document.getElementById('empresa-endereco').value,
        theme: currentTheme,
        accentColor: currentAccentColor
    };
    
    localStorage.setItem('configuracoes', JSON.stringify(config));
    showNotification('Configurações salvas com sucesso!', 'success');
}

function loadConfiguracoes() {
    const config = JSON.parse(localStorage.getItem('configuracoes') || '{}');
    
    if (config.empresaNome) document.getElementById('empresa-nome').value = config.empresaNome;
    if (config.empresaCnpj) document.getElementById('empresa-cnpj').value = config.empresaCnpj;
    if (config.empresaEndereco) document.getElementById('empresa-endereco').value = config.empresaEndereco;
    
    setTimeout(() => {
        updateThemeButtons();
        updateColorButtons();
    }, 100);
}

// ===== DOCUMENTOS =====

function abrirModalPrestacaoServico() {
    // Criar modal para prestação de serviço
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-800">Nova Prestação de Serviço</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="p-6">
                <form onsubmit="gerarPrestacaoServico(event)">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                            <select id="prestacao-cliente" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Selecione um cliente</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Data</label>
                            <input type="date" id="prestacao-data" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Descrição do Serviço</label>
                        <textarea id="prestacao-descricao" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" required></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                            <input type="number" step="0.01" id="prestacao-valor" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                            <select id="prestacao-pagamento" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao">Cartão</option>
                                <option value="pix">PIX</option>
                                <option value="transferencia">Transferência</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            <i class="fas fa-file-invoice mr-2"></i>Gerar Prestação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    carregarClientesSelect('prestacao-cliente');
    
    // Definir data atual
    document.getElementById('prestacao-data').valueAsDate = new Date();
}

function abrirModalVendaProduto() {
    // Criar modal para venda de produto
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-800">Nova Venda de Produto</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="p-6">
                <form onsubmit="gerarVendaProduto(event)">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                            <select id="venda-cliente" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                <option value="">Selecione um cliente</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Data</label>
                            <input type="date" id="venda-data" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Produto</label>
                        <select id="venda-produto" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Selecione um produto</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                            <input type="number" min="1" id="venda-quantidade" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value="1" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Valor Unitário (R$)</label>
                            <input type="number" step="0.01" id="venda-valor-unitario" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" readonly>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Total (R$)</label>
                            <input type="number" step="0.01" id="venda-total" class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" readonly>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                        <select id="venda-pagamento" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao">Cartão</option>
                            <option value="pix">PIX</option>
                            <option value="transferencia">Transferência</option>
                        </select>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            <i class="fas fa-shopping-cart mr-2"></i>Gerar Venda
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    carregarClientesSelect('venda-cliente');
    carregarProdutosSelect('venda-produto');
    
    // Definir data atual
    document.getElementById('venda-data').valueAsDate = new Date();
    
    // Calcular total automaticamente
    document.getElementById('venda-quantidade').addEventListener('input', calcularTotalVenda);
    document.getElementById('venda-produto').addEventListener('change', function() {
        const produtoId = this.value;
        if (produtoId) {
            fetch(`/api/produtos/${produtoId}`)
                .then(response => response.json())
                .then(produto => {
                    document.getElementById('venda-valor-unitario').value = produto.preco;
                    calcularTotalVenda();
                });
        }
    });
}

function calcularTotalVenda() {
    const quantidade = parseFloat(document.getElementById('venda-quantidade').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('venda-valor-unitario').value) || 0;
    const total = quantidade * valorUnitario;
    document.getElementById('venda-total').value = total.toFixed(2);
}

function carregarClientesSelect(selectId) {
    fetch('/api/clientes')
        .then(response => response.json())
        .then(clientes => {
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">Selecione um cliente</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = cliente.nome;
                select.appendChild(option);
            });
        });
}

function carregarProdutosSelect(selectId) {
    fetch('/api/produtos')
        .then(response => response.json())
        .then(produtos => {
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">Selecione um produto</option>';
            produtos.forEach(produto => {
                const option = document.createElement('option');
                option.value = produto.id;
                option.textContent = `${produto.nome} - R$ ${produto.preco}`;
                select.appendChild(option);
            });
        });
}

function gerarPrestacaoServico(event) {
    event.preventDefault();
    
    const dados = {
        cliente_id: document.getElementById('prestacao-cliente').value,
        data: document.getElementById('prestacao-data').value,
        descricao: document.getElementById('prestacao-descricao').value,
        valor: parseFloat(document.getElementById('prestacao-valor').value),
        forma_pagamento: document.getElementById('prestacao-pagamento').value,
        tipo: 'prestacao_servico'
    };
    
    fetch('/api/documentos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Prestação de serviço gerada com sucesso!', 'success');
            document.querySelector('.fixed').remove();
            carregarListaDocumentos();
        } else {
            showNotification('Erro ao gerar prestação de serviço', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao gerar prestação de serviço', 'error');
    });
}

function gerarVendaProduto(event) {
    event.preventDefault();
    
    const dados = {
        cliente_id: document.getElementById('venda-cliente').value,
        produto_id: document.getElementById('venda-produto').value,
        data: document.getElementById('venda-data').value,
        quantidade: parseInt(document.getElementById('venda-quantidade').value),
        valor_unitario: parseFloat(document.getElementById('venda-valor-unitario').value),
        valor_total: parseFloat(document.getElementById('venda-total').value),
        forma_pagamento: document.getElementById('venda-pagamento').value,
        tipo: 'venda_produto'
    };
    
    fetch('/api/documentos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Venda de produto gerada com sucesso!', 'success');
            document.querySelector('.fixed').remove();
            carregarListaDocumentos();
        } else {
            showNotification('Erro ao gerar venda de produto', 'error');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showNotification('Erro ao gerar venda de produto', 'error');
    });
}

function carregarListaDocumentos() {
    fetch('/api/documentos')
        .then(response => response.json())
        .then(documentos => {
            const container = document.getElementById('lista-documentos');
            
            if (documentos.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum documento gerado ainda</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${documentos.map(doc => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            doc.tipo === 'prestacao_servico' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }">
                                            ${doc.tipo === 'prestacao_servico' ? 'Prestação' : 'Venda'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${doc.cliente_nome}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(doc.data).toLocaleDateString('pt-BR')}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ ${doc.valor_total.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onclick="visualizarDocumento(${doc.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="compartilharDocumento(${doc.id})" class="text-green-600 hover:text-green-900">
                                            <i class="fas fa-share"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });
}

function visualizarDocumento(id) {
    window.open(`/api/documentos/${id}/pdf`, '_blank');
}

function compartilharDocumento(id) {
    const url = `${window.location.origin}/publico/documento/${id}`;
    navigator.clipboard.writeText(url).then(() => {
        showNotification('Link do documento copiado!', 'success');
    });
}

// Carregar documentos quando a seção for exibida
document.addEventListener('DOMContentLoaded', function() {
    const originalShowSection = window.showSection;
    window.showSection = function(section) {
        originalShowSection(section);
        if (section === 'documentos') {
            carregarListaDocumentos();
        }
    };
});


// ===== MELHORIAS GERAIS =====

// Função para mostrar loading
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="flex justify-center items-center py-8"><div class="spinner"></div><span class="ml-2">Carregando...</span></div>';
    }
}

// Função para formatar CPF
function formatCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para formatar CNPJ
function formatCNPJ(cnpj) {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Função para formatar telefone
function formatPhone(phone) {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para validar CPF
function isValidCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.charAt(10));
}

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Auto-formatação de campos
document.addEventListener('DOMContentLoaded', function() {
    // Formatação automática de CPF
    document.addEventListener('input', function(e) {
        if (e.target.id === 'cpf' || e.target.id === 'cpf-consulta' || e.target.placeholder === '000.000.000-00') {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            }
        }
        
        // Formatação automática de CNPJ
        if (e.target.id === 'empresa-cnpj' || e.target.placeholder === '00.000.000/0000-00') {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 14) {
                value = value.replace(/(\d{2})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1/$2');
                value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            }
        }
        
        // Formatação automática de telefone
        if (e.target.id === 'telefone' || e.target.type === 'tel') {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                } else {
                    value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
                e.target.value = value;
            }
        }
    });
});

// Função para exportar dados
function exportarDados(tipo) {
    let dados = [];
    let filename = '';
    
    switch(tipo) {
        case 'clientes':
            dados = clientes;
            filename = 'clientes.json';
            break;
        case 'produtos':
            dados = produtos;
            filename = 'produtos.json';
            break;
        case 'ordens':
            dados = ordens;
            filename = 'ordens.json';
            break;
    }
    
    const dataStr = JSON.stringify(dados, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = filename;
    link.click();
    
    showNotification(`Dados de ${tipo} exportados com sucesso!`, 'success');
}

// Função para backup dos dados
function fazerBackup() {
    const backup = {
        clientes: clientes,
        produtos: produtos,
        ordens: ordens,
        configuracoes: JSON.parse(localStorage.getItem('configuracoes') || '{}'),
        data_backup: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Backup realizado com sucesso!', 'success');
}

// Função para pesquisa global
function pesquisarGlobal(termo) {
    if (!termo) return;
    
    const resultados = {
        clientes: clientes.filter(c => 
            c.nome.toLowerCase().includes(termo.toLowerCase()) ||
            c.cpf.includes(termo) ||
            (c.email && c.email.toLowerCase().includes(termo.toLowerCase()))
        ),
        produtos: produtos.filter(p => 
            p.nome.toLowerCase().includes(termo.toLowerCase()) ||
            p.categoria.toLowerCase().includes(termo.toLowerCase())
        ),
        ordens: ordens.filter(o => 
            o.numero_os.toString().includes(termo) ||
            o.cliente_nome.toLowerCase().includes(termo.toLowerCase())
        )
    };
    
    console.log('Resultados da pesquisa:', resultados);
    showNotification(`Encontrados: ${resultados.clientes.length} clientes, ${resultados.produtos.length} produtos, ${resultados.ordens.length} ordens`, 'info');
}

// Função para estatísticas avançadas
function calcularEstatisticas() {
    const stats = {
        totalClientes: clientes.length,
        totalProdutos: produtos.length,
        totalOrdens: ordens.length,
        ordensCompletas: ordens.filter(o => o.status === 'Concluída').length,
        ordensPendentes: ordens.filter(o => o.status === 'Pendente').length,
        faturamentoTotal: ordens.reduce((total, ordem) => total + (ordem.valor_total || 0), 0),
        ticketMedio: ordens.length > 0 ? ordens.reduce((total, ordem) => total + (ordem.valor_total || 0), 0) / ordens.length : 0
    };
    
    return stats;
}

// Função para melhorar a responsividade
function ajustarLayout() {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    // Ajustar cards do dashboard
    const dashboardCards = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    dashboardCards.forEach(grid => {
        if (isMobile) {
            grid.className = grid.className.replace('lg:grid-cols-4', 'lg:grid-cols-2');
        }
    });
    
    // Ajustar tabelas
    const tables = document.querySelectorAll('.overflow-x-auto');
    tables.forEach(table => {
        if (isMobile) {
            table.style.fontSize = '0.875rem';
        }
    });
}

// Event listeners para melhorias
window.addEventListener('resize', ajustarLayout);

// Atalhos de teclado
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K para pesquisa
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Esc para fechar modais
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.fixed.inset-0');
        modals.forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.remove();
            }
        });
    }
});

// Função para detectar modo offline
function detectarModoOffline() {
    if (!navigator.onLine) {
        showNotification('Você está offline. Algumas funcionalidades podem não funcionar.', 'warning');
    }
}

window.addEventListener('online', () => {
    showNotification('Conexão restaurada!', 'success');
});

window.addEventListener('offline', detectarModoOffline);

// Inicializar melhorias
document.addEventListener('DOMContentLoaded', function() {
    ajustarLayout();
    detectarModoOffline();
});

