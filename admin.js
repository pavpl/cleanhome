const ADMIN_PASSWORD = '2222';

function checkPassword() {
    const password = document.getElementById('password').value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadOrders();
    } else {
        alert('Неверный пароль!');
    }
}

function logout() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('password').value = '';
}

let currentTab = 'active';
let ordersCache = [];

function showTab(tabName) {
    currentTab = tabName;
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (tabName === 'active') {
        tabs[0].classList.add('active');
    } else if (tabName === 'archive') {
        tabs[1].classList.add('active');
    } else if (tabName === 'messages') {
        tabs[2].classList.add('active');
    }
    if (tabName === 'messages') {
        document.getElementById('ordersTable').style.display = 'none';
        document.getElementById('messagesList').style.display = 'block';
        renderMessages();
    } else {
        document.getElementById('ordersTable').style.display = '';
        document.getElementById('messagesList').style.display = 'none';
        loadOrders();
    }
}

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    ordersCache = orders;
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    // Фильтрация по вкладке
    let filteredOrders = orders;
    if (currentTab === 'active') {
        filteredOrders = orders.filter(o => o.status !== 'archived');
    } else {
        filteredOrders = orders.filter(o => o.status === 'archived');
    }

    filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'border-t border-t-[#d4dde2]';
        const statusClass = getStatusClass(order.status);
        const statusText = getStatusText(order.status);
        row.innerHTML = `
            <td class="h-[72px] px-4 py-2 w-[400px] text-[#101518] text-sm font-normal leading-normal">#${order.id}</td>
            <td class="h-[72px] px-4 py-2 w-[400px] text-[#5c778a] text-sm font-normal leading-normal">${order.name}</td>
            <td class="h-[72px] px-4 py-2 w-[400px] text-[#5c778a] text-sm font-normal leading-normal">${order.address}</td>
            <td class="h-[72px] px-4 py-2 w-[400px] text-[#5c778a] text-sm font-normal leading-normal">${formatDate(order.date)} ${order.timeStart}</td>
            <td class="h-[72px] px-4 py-2 w-[400px] text-[#5c778a] text-sm font-normal leading-normal">${getServiceName(order.service)}</td>
            <td class="h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                <button class="status-badge ${statusClass}" onclick="cycleStatusById(${order.id}, true)">${statusText}</button>
            </td>
            <td class="h-[72px] px-4 py-2 w-60 text-[#5c778a] text-sm font-bold leading-normal tracking-[0.015em]">
                <button onclick="viewOrderDetails(${order.id})" class="text-[#5c778a] hover:text-[#101518] border border-[#5c778a] rounded px-2 py-1">Просмотр</button>
            </td>
        `;
        ordersList.appendChild(row);
    });
}

function cycleStatusById(orderId, silent) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        let status = orders[idx].status;
        if (status === 'new' || status === undefined) {
            orders[idx].status = 'in-progress';
        } else if (status === 'in-progress') {
            orders[idx].status = 'completed';
        } else if (status === 'completed') {
            orders[idx].status = 'new';
        }
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        updateStats();
        if (document.getElementById('orderModalDetails').style.display === 'flex') {
            setTimeout(() => viewOrderDetails(orderId), 0);
        }
    }
}

function viewOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const modal = document.getElementById('orderModalDetails');
    const modalContent = document.getElementById('orderModalDetailsContent');
    let actionButtons = '';
    if (order.status === 'archived') {
        actionButtons += `<button onclick="restoreOrderById(${order.id})" class="tab-btn">Восстановить</button>`;
    } else {
        actionButtons += `<button onclick="cycleStatusById(${order.id})" class="tab-btn">Сменить статус</button>`;
        actionButtons += `<button onclick="archiveOrderById(${order.id})" class="tab-btn">В архив</button>`;
    }
    actionButtons += `<button onclick="deleteOrderById(${order.id})" class="tab-btn" style="color:#d32f2f;">Удалить</button>`;
    actionButtons += `<button onclick="closeOrderModalDetails()" class="tab-btn">Закрыть</button>`;
    modalContent.innerHTML = `
        <h2>Детали заказа #${order.id}</h2>
        <p><b>Имя:</b> ${order.name}</p>
        <p><b>Телефон:</b> ${order.phone}</p>
        <p><b>Email:</b> ${order.email}</p>
        <p><b>Адрес:</b> ${order.address}</p>
        <p><b>Площадь:</b> ${order.area} м²</p>
        <p><b>Комнат:</b> ${order.rooms}</p>
        <p><b>Услуга:</b> ${getServiceName(order.service)}</p>
        <p><b>Периодичность:</b> ${getFrequencyName(order.frequency)}</p>
        <p><b>Дата:</b> ${order.date}</p>
        <p><b>Время:</b> ${order.timeStart} - ${order.timeEnd}</p>
        <p><b>Комментарии:</b> ${order.comments || '-'}</p>
        <p><b>Статус:</b> <span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></p>
        <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">${actionButtons}</div>
    `;
    modal.style.display = 'flex';
}

function closeOrderModalDetails() {
    document.getElementById('orderModalDetails').style.display = 'none';
}

function archiveOrderById(orderId) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = 'archived';
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        updateStats();
        closeOrderModalDetails();
    }
}

function deleteOrderById(orderId) {
    if (confirm('Удалить заказ?')) {
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        updateStats();
        closeOrderModalDetails();
    }
}

function updateStats() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    document.getElementById('stat-orders').textContent = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
    document.getElementById('stat-revenue').textContent = `${revenue} грн`;
    const uniqueUsers = new Set(orders.map(order => order.email)).size;
    document.getElementById('stat-users').textContent = uniqueUsers;
}

function getStatusClass(status) {
    const classes = {
        'new': 'status-new',
        'in-progress': 'status-in-progress',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled',
        'archived': 'status-cancelled'
    };
    return classes[status] || 'status-new';
}

function getStatusText(status) {
    const texts = {
        'new': 'Новый',
        'in-progress': 'В работе',
        'completed': 'Завершен',
        'cancelled': 'Отменен',
        'archived': 'В архиве'
    };
    return texts[status] || 'Новый';
}

function getServiceName(service) {
    const services = {
        'full': 'Полная уборка',
        'dry': 'Химчистка',
        'light': 'Лайт версия',
        'fullpack': 'Полный пак'
    };
    return services[service] || service;
}

function getFrequencyName(frequency) {
    const frequencies = {
        'once': 'Единоразово',
        'weekly': 'Раз в неделю (-15%)',
        'biweekly': 'Раз в 2 недели (-10%)',
        'monthly': 'Раз в месяц (-5%)'
    };
    return frequencies[frequency] || frequency;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function restoreOrderById(orderId) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = 'new';
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        updateStats();
        viewOrderDetails(orderId);
    }
}

function renderMessages() {
    let messages = JSON.parse(localStorage.getItem('messages') || '[]');
    messages = messages.map(msg => ({...msg})).reverse();
    const messagesList = document.getElementById('messagesList');
    if (!messages.length) {
        messagesList.innerHTML = '<div style="color:#888;text-align:center;padding:40px 0;">Нет сообщений</div>';
        return;
    }
    messagesList.innerHTML = messages.map(msg => `
        <div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(30,144,255,0.07);padding:20px 18px;margin-bottom:18px;position:relative;overflow-wrap:break-word;word-break:break-word;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px;flex-wrap:wrap;">
                <span style="font-weight:600;color:#1993e5;max-width:40vw;overflow-wrap:break-word;">${msg.name}</span>
                <span style="color:#888;font-size:13px;">${new Date(msg.date).toLocaleString('ru-RU')}</span>
            </div>
            <div style="color:#4e7a97;font-size:14px;margin-bottom:6px;overflow-wrap:break-word;word-break:break-all;max-width:100%;">${msg.email}</div>
            <div style="color:#101518;font-size:15px;white-space:pre-line;margin-bottom:10px;overflow-wrap:break-word;word-break:break-all;max-width:100%;">${msg.message}</div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <span class="status-badge" style="background:${msg.status==='answered' ? '#e8f5e9' : '#e3f2fd'};color:${msg.status==='answered' ? '#388e3c' : '#1976d2'};">
                    ${msg.status==='answered' ? 'С ответом' : 'Без ответа'}
                </span>
                <button onclick="toggleMessageStatusById(${msg.id})" class="tab-btn" style="font-size:13px;">Сменить статус</button>
                <button onclick="deleteMessageById(${msg.id})" class="tab-btn" style="color:#d32f2f;font-size:13px;">Удалить</button>
            </div>
        </div>
    `).join('');
}

function toggleMessageStatusById(id) {
    let messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const idx = messages.findIndex(m => m.id === id);
    if (idx !== -1) {
        messages[idx].status = messages[idx].status === 'answered' ? 'new' : 'answered';
        localStorage.setItem('messages', JSON.stringify(messages));
        renderMessages();
    }
}

function deleteMessageById(id) {
    if (confirm('Удалить сообщение?')) {
        let messages = JSON.parse(localStorage.getItem('messages') || '[]');
        messages = messages.filter(m => m.id !== id);
        localStorage.setItem('messages', JSON.stringify(messages));
        renderMessages();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Загрузка заказов из localStorage
    loadOrders();
    updateStats();

    // Обработчик для вкладок
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const tab = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showTab(tab);
        });
    });

    // Модальное окно закрытие по клику вне
    document.getElementById('orderModalDetails').addEventListener('click', function(e) {
        if (e.target === this) closeOrderModalDetails();
    });
}); 