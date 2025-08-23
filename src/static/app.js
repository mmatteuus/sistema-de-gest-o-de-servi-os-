// Variáveis globais
let currentSection = 'dashboard';
let clientes = [];
let produtos = [];
let ordens = [];
let sidebarPinned = localStorage.getItem('sidebarPinned') === 'true'; // Carrega o estado salvo

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setActiveNavLink('dashboard');
    initializeSidebar(); // Inicializa a sidebar com o estado salvo
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
            body: JSON.stringify({ cpf: cpf })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.ordens && data.ordens.length > 0) {
                resultadoDiv.innerHTML = `
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Ordens de Serviço para ${cpf}</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número OS</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Público</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${data.ordens.map(ordem => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${ordem.numero_os}</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ordem.status)}">
                                                ${getStatusText(ordem.status)}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ ${ordem.valor_total.toFixed(2)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(ordem.data_abertura)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                                            <a href="/publico/ordem/${ordem.token_publico}" target="_blank">Ver Ordem</a>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                resultadoDiv.innerHTML = '<p class="text-center text-gray-500">Nenhuma ordem de serviço encontrada para este CPF.</p>';
            }
        } else {
            const error = await response.json();
            showNotification(error.erro || 'Erro ao consultar ordens', 'error');
            resultadoDiv.innerHTML = '<p class="text-center text-red-500">Erro ao consultar ordens.</p>';
        }
    } catch (error) {
        console.error('Erro ao consultar ordens:', error);
        showNotification('Erro ao consultar ordens', 'error');
        resultadoDiv.innerHTML = '<p class="text-center text-red-500">Erro ao consultar ordens.</p>';
    }
}

// Funções de utilidade
function getStatusColor(status) {
    switch (status) {
        case 'pendente': return 'bg-yellow-100 text-yellow-800';
        case 'em_andamento': return 'bg-blue-100 text-blue-800';
        case 'concluida': return 'bg-green-100 text-green-800';
        case 'cancelada': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pendente': return 'Pendente';
        case 'em_andamento': return 'Em Andamento';
        case 'concluida': return 'Concluída';
        case 'cancelada': return 'Cancelada';
        default: return 'Desconhecido';
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

// Notificações Toast
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type} p-3 rounded-md shadow-md mb-3 flex items-center justify-between`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="ml-4 text-white opacity-75 hover:opacity-100" onclick="this.parentElement.remove()">
            &times;
        </button>
    `;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('hide');
        notification.addEventListener('transitionend', () => notification.remove());
    }, 5000);
}

// Tema e Cores
let currentTheme = localStorage.getItem('theme') || 'light';
let customColor = localStorage.getItem('customColor') || '';

function applyTheme() {
    const html = document.documentElement;
    if (currentTheme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    applyCustomColor();
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
    updateThemeButton();
}

function applyCustomColor() {
    const root = document.documentElement;
    if (customColor && isValidHexColor(customColor)) {
        root.style.setProperty('--primary-color', customColor);
        root.style.setProperty('--primary-light-color', lightenColor(customColor, 20));
        root.style.setProperty('--primary-dark-color', darkenColor(customColor, 20));
    } else {
        // Reset para cores padrão se customColor for inválido ou vazio
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--primary-light-color');
        root.style.removeProperty('--primary-dark-color');
    }
}

function selectColor(color) {
    customColor = color;
    localStorage.setItem('customColor', customColor);
    applyTheme();
    showNotification(`Cor ${color} selecionada!`, 'info');
}

function applyCustomColorInput() {
    const customColorInput = document.getElementById('custom-color-input').value;
    if (isValidHexColor(customColorInput)) {
        customColor = customColorInput;
        localStorage.setItem('customColor', customColor);
        applyTheme();
        showNotification(`Cor personalizada ${customColor} aplicada!`, 'success');
    } else {
        showNotification('Código hexadecimal inválido. Use o formato #RRGGBB.', 'error');
    }
}

function isValidHexColor(hex) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

function lightenColor(hex, percent) {
    let f=parseInt(hex.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=(f>>8)&0x00ff,B=f&0x0000ff;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function darkenColor(hex, percent) {
    let f=parseInt(hex.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=(f>>8)&0x00ff,B=f&0x0000ff;
    return "#"+(0x1000000+(Math.round((t-R)*-p)+R)*0x10000+(Math.round((t-G)*-p)+G)*0x100+(Math.round((t-B)*-p)+B)).toString(16).slice(1);
}

function updateThemeButton() {
    const themeButton = document.getElementById('theme-toggle-btn');
    if (themeButton) {
        if (currentTheme === 'dark') {
            themeButton.innerHTML = '<i class="fas fa-sun"></i> Tema Claro';
        } else {
            themeButton.innerHTML = '<i class="fas fa-moon"></i> Tema Escuro';
        }
    }
}

// Sidebar
function initializeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const pinBtn = document.getElementById("sidebar-pin-btn");

    // Carrega o estado salvo
    sidebarPinned = localStorage.getItem("sidebarPinned") === "true";

    if (window.innerWidth >= 1024) { // Desktop
        if (sidebarPinned) {
            sidebar.classList.add("sidebar-pinned");
            pinBtn.classList.add("text-blue-300");
            pinBtn.title = "Desafixar sidebar";
        } else {
            sidebar.classList.remove("sidebar-pinned");
            sidebar.classList.add("lg:w-20"); // Recolhida por padrão
            pinBtn.classList.remove("text-blue-300");
            pinBtn.title = "Fixar sidebar";
        }
    } else { // Mobile
        sidebar.classList.add("-translate-x-full");
        pinBtn.classList.remove("text-blue-300");
        pinBtn.title = "Fixar sidebar";
    }
    adjustMainContentMargin();
}

function toggleSidebarPin() {
    const sidebar = document.getElementById("sidebar");
    const pinBtn = document.getElementById("sidebar-pin-btn");

    sidebarPinned = !sidebarPinned;
    localStorage.setItem("sidebarPinned", sidebarPinned.toString());

    if (window.innerWidth >= 1024) { // Desktop
        if (sidebarPinned) {
            sidebar.classList.remove("lg:w-20");
            sidebar.classList.add("sidebar-pinned");
            pinBtn.classList.add("text-blue-300");
            pinBtn.title = "Desafixar sidebar";
            showNotification("Sidebar fixada", "info");
        } else {
            sidebar.classList.remove("sidebar-pinned");
            sidebar.classList.add("lg:w-20");
            pinBtn.classList.remove("text-blue-300");
            pinBtn.title = "Fixar sidebar";
            showNotification("Sidebar desafixada", "info");
        }
    } else { // Mobile
        // Comportamento padrão de toggle para mobile
        sidebar.classList.toggle("-translate-x-full");
        if (sidebar.classList.contains("-translate-x-full")) {
            pinBtn.classList.remove("text-blue-300");
            pinBtn.title = "Fixar sidebar";
        } else {
            pinBtn.classList.add("text-blue-300");
            pinBtn.title = "Desafixar sidebar";
        }
    }
    adjustMainContentMargin();
}

function adjustMainContentMargin() {
    const sidebar = document.getElementById("sidebar");
    const mainContentDiv = document.querySelector(".lg\\:ml-64");

    if (window.innerWidth >= 1024) { // Desktop
        if (sidebar.classList.contains("sidebar-pinned")) {
            mainContentDiv.style.marginLeft = "256px";
        } else {
            mainContentDiv.style.marginLeft = "80px";
        }
    } else { // Mobile
        mainContentDiv.style.marginLeft = "0";
    }
}

// Listener para redimensionamento da janela (ajusta a margem do conteúdo principal)
window.addEventListener("resize", () => {
    adjustMainContentMargin();
    // Se a tela for redimensionada para desktop e a sidebar não estiver fixada, recolhe
    if (window.innerWidth >= 1024 && !sidebarPinned) {
        document.getElementById("sidebar").classList.add("lg:w-20");
        document.getElementById("sidebar").classList.remove("sidebar-pinned");
    } else if (window.innerWidth < 1024) {
        // Em mobile, garante que a sidebar esteja recolhida por padrão
        document.getElementById("sidebar").classList.add("-translate-x-full");
        document.getElementById("sidebar").classList.remove("sidebar-pinned");
    }
});

// Funções de Configurações
let empresaNome = localStorage.getItem('empresaNome') || '';

function loadConfiguracoes() {
    document.getElementById('empresa-nome-input').value = empresaNome;
    document.getElementById('custom-color-input').value = customColor;
    // Renderizar paleta de cores
    const colorPaletteDiv = document.getElementById('color-palette');
    const colors = ['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6B7280', '#06B6D4'];
    colorPaletteDiv.innerHTML = colors.map(color => `
        <div class="w-8 h-8 rounded-full cursor-pointer border-2 border-transparent hover:border-blue-500" 
             style="background-color: ${color};" onclick="selectColor('${color}')"></div>
    `).join('');
}

function salvarConfiguracoes() {
    empresaNome = document.getElementById('empresa-nome-input').value;
    localStorage.setItem('empresaNome', empresaNome);
    atualizarNomeEmpresaDashboard();
    applyCustomColorInput(); // Aplica a cor personalizada do input
    showNotification('Configurações salvas com sucesso!', 'success');
}

function atualizarNomeEmpresaDashboard() {
    const dashboardTitle = document.getElementById('dashboard-title');
    const sidebarTitle = document.getElementById('sidebar-title');
    if (empresaNome) {
        dashboardTitle.textContent = `${empresaNome} - Dashboard`;
        sidebarTitle.textContent = empresaNome;
    } else {
        dashboardTitle.textContent = 'Dashboard';
        sidebarTitle.textContent = 'Meu Sistema';
    }
}

// Funções de Documentos
async function carregarListaDocumentos() {
    try {
        const response = await fetch('/api/documentos');
        const documentos = await response.json();
        renderListaDocumentos(documentos);
    } catch (error) {
        console.error('Erro ao carregar documentos:', error);
        showNotification('Erro ao carregar documentos.', 'error');
    }
}

function renderListaDocumentos(documentos) {
    const container = document.getElementById('lista-documentos');
    if (documentos.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum documento gerado ainda.</p>';
        return;
    }
    container.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${documentos.map(doc => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${doc.tipo === 'prestacao_servico' ? 'Prestação de Serviço' : 'Venda de Produto'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${doc.cliente_nome || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ ${doc.valor.toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(doc.data_emissao)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="visualizarDocumento('${doc.token_publico}')" class="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                            <button onclick="compartilharDocumento('${doc.token_publico}')" class="text-green-600 hover:text-green-900 mr-3">Compartilhar</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function gerarDocumento() {
    const tipoDocumento = document.getElementById('tipo-documento').value;
    const clienteId = document.getElementById('cliente-documento').value;
    const valor = parseFloat(document.getElementById('valor-documento').value);

    if (!tipoDocumento || !clienteId || isNaN(valor) || valor <= 0) {
        showNotification('Por favor, preencha todos os campos corretamente.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/documentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo: tipoDocumento,
                cliente_id: parseInt(clienteId),
                valor: valor
            })
        });

        if (response.ok) {
            showNotification('Documento gerado com sucesso!', 'success');
            carregarListaDocumentos();
            // Limpar formulário
            document.getElementById('tipo-documento').value = '';
            document.getElementById('cliente-documento').value = '';
            document.getElementById('valor-documento').value = '';
        } else {
            const error = await response.json();
            showNotification(error.erro || 'Erro ao gerar documento.', 'error');
        }
    } catch (error) {
        console.error('Erro ao gerar documento:', error);
        showNotification('Erro ao gerar documento.', 'error');
    }
}

function visualizarDocumento(token) {
    window.open(`/publico/documento/${token}`, '_blank');
}

function compartilharDocumento(token) {
    const url = `${window.location.origin}/publico/documento/${token}`;
    navigator.clipboard.writeText(url).then(() => {
        showNotification('Link do documento copiado para a área de transferência!', 'success');
    }).catch(err => {
        console.error('Erro ao copiar link:', err);
        showNotification('Erro ao copiar link. Por favor, copie manualmente: ' + url, 'error');
    });
}

// Funções de formatação de input
function formatarCPF(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 9) value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    else if (value.length > 6) value = value.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3');
    else if (value.length > 3) value = value.replace(/^(\d{3})(\d{3})$/, '$1.$2');
    input.value = value;
}

function formatarTelefone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
    else if (value.length > 6) value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    else if (value.length > 2) value = value.replace(/^(\d\d)(\d{0,5})/, '($1) $2');
    input.value = value;
}

// Inicialização das funções
applyTheme();
updateThemeButton();
atualizarNomeEmpresaDashboard();

// Event Listeners para inputs de formatação
document.getElementById('cliente-cpf')?.addEventListener('input', (e) => formatarCPF(e.target));
document.getElementById('cliente-telefone')?.addEventListener('input', (e) => formatarTelefone(e.target));
document.getElementById('cpf-consulta')?.addEventListener('input', (e) => formatarCPF(e.target));

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') { // Ctrl+K para alternar tema
        e.preventDefault();
        toggleTheme();
    }
    if (e.key === 'Escape') { // Esc para fechar modais
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }
});

// Detecção de modo offline
window.addEventListener('offline', () => {
    showNotification('Você está offline. Algumas funcionalidades podem não estar disponíveis.', 'warning');
});

window.addEventListener('online', () => {
    showNotification('Você está online novamente!', 'success');
});

// Exemplo de uso de exportação/importação (apenas para demonstração)
function exportarDados() {
    const data = {
        clientes: clientes,
        produtos: produtos,
        ordens: ordens
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_sistema_os.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Dados exportados com sucesso!', 'success');
}

function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            // Aqui você precisaria de rotas de API para importar esses dados para o backend
            // Por simplicidade, vamos apenas carregar no frontend para demonstração
            clientes = importedData.clientes || [];
            produtos = importedData.produtos || [];
            ordens = importedData.ordens || [];
            showNotification('Dados importados com sucesso! (Apenas frontend)', 'success');
            // Recarregar todas as seções para refletir os novos dados
            loadClientes();
            loadProdutos();
            loadOrdens();
            loadDashboard();
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            showNotification('Erro ao importar dados. Verifique o formato do arquivo.', 'error');
        }
    };
    reader.readAsText(file);
}

// Adicionar listeners para botões de exportar/importar (se existirem no HTML)
document.getElementById('export-data-btn')?.addEventListener('click', exportarDados);
document.getElementById('import-data-input')?.addEventListener('change', importarDados);

// Funções para alternar a visibilidade da sidebar em mobile
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// Adicionar listener para o botão de menu mobile (se existir no HTML)
document.getElementById('mobile-menu-button')?.addEventListener('click', toggleMobileSidebar);

// Adicionar listener para fechar sidebar ao clicar fora (apenas mobile)
document.addEventListener('click', (event) => {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    
    if (window.innerWidth < 1024 && 
        !sidebar.classList.contains('-translate-x-full') && 
        !sidebar.contains(event.target) && 
        !mobileMenuButton.contains(event.target)) {
        
        sidebar.classList.add('-translate-x-full');
    }
});

// Garante que a sidebar esteja visível em desktop ao carregar
window.addEventListener('load', () => {
    if (window.innerWidth >= 1024) {
        const sidebar = document.getElementById('sidebar');
        const pinBtn = document.getElementById('sidebar-pin-btn');
        if (sidebarPinned) {
            sidebar.classList.remove('lg:w-20');
            sidebar.classList.add('sidebar-pinned');
            pinBtn.classList.add('text-blue-300');
        } else {
            sidebar.classList.add('lg:w-20');
            sidebar.classList.remove('sidebar-pinned');
            pinBtn.classList.remove('text-blue-300');
        }
        adjustMainContentMargin();
    }
});

// Adicionar listener para hover na sidebar (apenas desktop e quando não fixada)
document.getElementById('sidebar').addEventListener('mouseenter', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 1024 && !sidebarPinned) {
        sidebar.classList.remove('lg:w-20');
        sidebar.classList.add('sidebar-hover-expanded');
    }
});

document.getElementById('sidebar').addEventListener('mouseleave', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 1024 && !sidebarPinned) {
        sidebar.classList.add('lg:w-20');
        sidebar.classList.remove('sidebar-hover-expanded');
    }
});

// Chamar a função de inicialização da sidebar no carregamento da página
initializeSidebar();
applyTheme();
updateThemeButton();
atualizarNomeEmpresaDashboard();

