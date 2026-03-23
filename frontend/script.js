
// Configuração da API
const API_URL = 'http://127.0.0.1:8000/api';

let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));
let pratosData = [];

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

api.interceptors.request.use(config => {
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
           
            logout();
            notify('Sessão expirada. Por favor, faça login novamente.', 'error');
        }
        return Promise.reject(error);
    }
);


const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const userNav = document.getElementById('user-nav');
const userDisplay = document.getElementById('user-display');


const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const pratoForm = document.getElementById('prato-form');


const pratosGrid = document.getElementById('pratos-grid');
const loadingSpinner = document.getElementById('pratos-loading');
const noPratosMessage = document.getElementById('no-pratos-message');
const notificationContainer = document.getElementById('notification-container');

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    if (token) {
        showDashboard();
    } else {
        showAuth();
    }
}

function showAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    userNav.classList.add('hidden');
}

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userNav.classList.remove('hidden');
    
    let displayName = currentUser?.name;
    
    if (!displayName && currentUser?.email) {
        const emailPart = currentUser.email.split('@')[0];
        displayName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
    }
    
    userDisplay.textContent = `Olá, ${displayName || 'Usuário'}`;
    fetchPratos();
}


async function login(email, password) {
    try {
        const response = await api.post('/login', { email, password });
        token = response.data.token;
        currentUser = { email: email };
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        notify('Login realizado com sucesso!', 'success');
        showDashboard();
    } catch (error) {
        console.error('Login error:', error);
        let msg = 'Erro ao fazer login.';
        if (error.response) {
            msg = error.response.data.message || msg;
        } else if (error.request) {
            msg = 'A API não respondeu. Verifique se o servidor Laravel está rodando.';
        }
        notify(msg, 'error');
    }
}

async function register(name, email, password) {
    try {
        const response = await api.post('/register', { 
            name, 
            email, 
            password, 
            password_confirmation: password 
        });
        
 
        if (response.data.token) {
            token = response.data.token;
            currentUser = { name, email };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            notify('Conta criada e login realizado com sucesso!', 'success');
            showDashboard();
        } else {
            notify('Conta criada com sucesso! Por favor, faça login.', 'success');
            switchForm('login');
        }
    } catch (error) {
        console.error('Register error:', error);
        let msg = 'Erro ao registrar.';
        if (error.response) {
            msg = error.response.data.message || msg;
        } else if (error.request) {
            msg = 'Não foi possível conectar à API. Verifique o servidor.';
        }
        notify(msg, 'error');
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuth();
    notify('Sessão encerrada.', 'success');
}


async function fetchPratos() {
    loadingSpinner.classList.remove('hidden');
    pratosGrid.innerHTML = '';
    noPratosMessage.classList.add('hidden');

    try {
        const response = await api.get('/pratos');
        pratosData = response.data;
        renderPratos(pratosData);
    } catch (error) {
        console.error('Fetch pratos error:', error);
        notify('Erro ao carregar pratos da API.', 'error');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

async function savePrato(data) {
    const id = document.getElementById('prato-id').value;
    const isEdit = !!id;

    try {
        let response;
        if (isEdit) {
            response = await api.put(`/pratos/${id}`, data);
            notify('Prato atualizado com sucesso!', 'success');
        } else {
            response = await api.post('/pratos', data);
            notify('Prato criado com sucesso!', 'success');
        }
        
        closeModal();
        fetchPratos();
    } catch (error) {
        console.error('Save prato error:', error);
        notify('Erro ao salvar prato. Verifique os dados.', 'error');
    }
}

async function deletePrato(id) {
    if (!confirm('Tem certeza que deseja excluir este prato?')) return;

    try {
        await api.delete(`/pratos/${id}`);
        notify('Prato excluído com sucesso!', 'success');
        fetchPratos();
    } catch (error) {
        console.error('Delete prato error:', error);
        notify('Erro ao excluir prato.', 'error');
    }
}



function renderPratos(pratos) {
    if (pratos.length === 0) {
        noPratosMessage.classList.remove('hidden');
        return;
    }

    pratosGrid.innerHTML = pratos.map(prato => `
        <div class="prato-card fade-in">
            <div class="prato-category">${prato.categoria}</div>
            <div class="prato-header">
                <h3 class="prato-name">${prato.nome}</h3>
                <span class="prato-price">R$ ${parseFloat(prato.preco).toFixed(2).replace('.', ',')}</span>
            </div>
            <p class="prato-description">${prato.descricao}</p>
            <div class="prato-footer">
                <button onclick="openEditModal(${prato.id})" class="btn btn-primary btn-sm">Editar</button>
                <button onclick="deletePrato(${prato.id})" class="btn btn-danger btn-sm">Excluir</button>
            </div>
        </div>
    `).join('');
}

function openEditModal(id) {
    const prato = pratosData.find(p => p.id === id);
    if (!prato) return;

    document.getElementById('modal-title').textContent = 'Editar Prato';
    document.getElementById('prato-id').value = prato.id;
    document.getElementById('prato-nome').value = prato.nome;
    document.getElementById('prato-descricao').value = prato.descricao;
    document.getElementById('prato-preco').value = prato.preco;
    document.getElementById('prato-categoria').value = prato.categoria;

    document.getElementById('prato-modal').classList.remove('hidden');
}

function openCreateModal() {
    document.getElementById('modal-title').textContent = 'Novo Prato';
    pratoForm.reset();
    document.getElementById('prato-id').value = '';
    document.getElementById('prato-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('prato-modal').classList.add('hidden');
}

function notify(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `notification notification-${type} fade-in`;
    toast.innerHTML = `
        <div style="flex-grow: 1;">${message}</div>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--primary); cursor:pointer; font-size:20px; font-weight: bold;">&times;</button>
    `;
    
    notificationContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 5000);
}

function switchForm(type) {
    const loginCont = document.getElementById('login-form-container');
    const regCont = document.getElementById('register-form-container');
    
    if (type === 'register') {
        loginCont.classList.add('hidden');
        regCont.classList.remove('hidden');
    } else {
        loginCont.classList.remove('hidden');
        regCont.classList.add('hidden');
    }
}


function setupEventListeners() {

    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('register');
    });

    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('login');
    });


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await login(email, password);
    });


    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        if (password !== confirm) {
            return notify('As senhas não coincidem.', 'error');
        }
        await register(name, email, password);
    });


    document.getElementById('btn-logout').addEventListener('click', logout);

    document.getElementById('btn-open-create-modal').addEventListener('click', openCreateModal);
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-prato').addEventListener('click', closeModal);

    pratoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            nome: document.getElementById('prato-nome').value,
            descricao: document.getElementById('prato-descricao').value,
            preco: parseFloat(document.getElementById('prato-preco').value),
            categoria: document.getElementById('prato-categoria').value
        };
        await savePrato(formData);
    });

    document.getElementById('prato-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = pratosData.filter(p => 
            p.nome.toLowerCase().includes(term) || 
            p.categoria.toLowerCase().includes(term)
        );
        renderPratos(filtered);
    });
}
