document.addEventListener('DOMContentLoaded', function() {
    // Обработка кнопок +/- для количества комнат
    const roomsInput = document.getElementById('rooms');
    const minusBtn = document.querySelector('.number-btn.minus');
    const plusBtn = document.querySelector('.number-btn.plus');
    const areaInput = document.getElementById('area');
    const serviceSelect = document.getElementById('service');
    const frequencyInputs = document.querySelectorAll('input[name="frequency"]');
    const commentsInput = document.getElementById('comments');
    const priceDisplay = document.createElement('div');
    priceDisplay.className = 'price-display';
    document.querySelector('.order-form').insertBefore(priceDisplay, document.querySelector('.order-btn'));

    // Базовые цены для разных типов уборки
    const basePrices = {
        'full': 15, // Полная уборка
        'dry': 18,  // Химчистка
        'light': 12, // Лайт версия
        'fullpack': 20 // Полный пак
    };

    // Скидки для разных типов периодичности
    const discounts = {
        'once': 0,
        'weekly': 0.15,
        'biweekly': 0.10,
        'monthly': 0.05
    };

    function getOrderPrice({area, rooms, service, frequency, hasComments}) {
        area = parseFloat(area) || 0;
        rooms = parseInt(rooms) || 0;
        if (!area || !service) return 0;
        let price = area * basePrices[service];
        if (rooms > 5) price += (rooms - 5) * 20;
        if (area > 100) price += 100;
        const discount = discounts[frequency];
        if (discount > 0) price = price * (1 - discount);
        return Math.round(price);
    }

    function calculatePrice() {
        const area = areaInput.value;
        const rooms = roomsInput.value;
        const service = serviceSelect.value;
        const frequency = document.querySelector('input[name="frequency"]:checked').value;
        const hasComments = commentsInput.value.trim().length > 0;
        if (!area || !service) {
            priceDisplay.innerHTML = '';
            return;
        }
        const formattedPrice = getOrderPrice({area, rooms, service, frequency, hasComments});
        let priceHTML = `
            <div class="price-info">
                <h3>Расчет стоимости:</h3>
                <p>Базовая стоимость: ${formattedPrice} грн</p>
        `;
        if (hasComments) {
            priceHTML += `
                <p class="price-note">* Итоговая стоимость может быть изменена после уточнения деталей с менеджером</p>
            `;
        }
        priceHTML += '</div>';
        priceDisplay.innerHTML = priceHTML;
    }

    // Добавляем обработчики событий для пересчета цены
    [roomsInput, areaInput, serviceSelect, commentsInput].forEach(element => {
        element.addEventListener('input', calculatePrice);
    });

    frequencyInputs.forEach(input => {
        input.addEventListener('change', calculatePrice);
    });

    minusBtn.addEventListener('click', () => {
        const currentValue = parseInt(roomsInput.value);
        if (currentValue > 1) {
            roomsInput.value = currentValue - 1;
            calculatePrice();
        }
    });

    plusBtn.addEventListener('click', () => {
        const currentValue = parseInt(roomsInput.value);
        if (currentValue < 10) {
            roomsInput.value = currentValue + 1;
            calculatePrice();
        }
    });

    // Маска для телефона
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
        e.target.value = !x[2] ? x[1] : '+38 (' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '') + (x[4] ? '-' + x[4] : '');
    });

    // Обработка формы
    document.getElementById('orderForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const area = document.getElementById('area').value;
        const rooms = document.getElementById('rooms').value;
        const service = document.getElementById('service').value;
        const frequency = document.querySelector('input[name="frequency"]:checked').value;
        const comments = document.getElementById('comments').value;
        const price = getOrderPrice({area, rooms, service, frequency, hasComments: comments.trim().length > 0});
        const order = {
            id: Date.now(),
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            rooms,
            area,
            service,
            frequency,
            date: document.getElementById('date').value,
            timeStart: document.getElementById('timeStart').value,
            timeEnd: document.getElementById('timeEnd').value,
            comments,
            status: 'active',
            createdAt: new Date().toISOString(),
            price
        };

        // Получаем существующие заказы
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Очищаем форму
        this.reset();
        roomsInput.value = 1;
        priceDisplay.innerHTML = '';

        // Показываем сообщение об успехе
        alert('Заказ успешно создан! Мы свяжемся с вами в ближайшее время.');
    });

    // Установка минимальной даты (сегодня)
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
});

// Функции для работы с модальным окном
function openOrderModal() {
    document.getElementById('orderModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        closeOrderModal();
    }
}

// Обработка формы заказа
document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Здесь можно добавить валидацию и отправку данных на сервер
    alert('Спасибо за заказ! Мы свяжемся с вами в ближайшее время.');
    closeOrderModal();
});

// Обработка кнопок +/- для количества комнат
document.querySelectorAll('.number-btn').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const currentValue = parseInt(input.value);
        
        if (this.classList.contains('minus') && currentValue > 1) {
            input.value = currentValue - 1;
        } else if (this.classList.contains('plus') && currentValue < 10) {
            input.value = currentValue + 1;
        }
    });
});

// Маска для телефона
document.getElementById('phone').addEventListener('input', function(e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    e.target.value = !x[2] ? x[1] : '+38 (' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '') + (x[4] ? '-' + x[4] : '');
});

// Функция проверки существования страницы
function checkPage(url) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                window.location.href = '404.html';
                return false;
            }
            return true;
        })
        .catch(() => {
            window.location.href = '404.html';
            return false;
        });
    return false; // Предотвращаем стандартное поведение ссылки
} 