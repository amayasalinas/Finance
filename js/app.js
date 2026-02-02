/**
 * Dashboard Financiero Premium
 * Sistema de categorización automática y visualización de datos
 */

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const CATEGORY_KEYWORDS = {
    'Alimentación': [
        'supermercado', 'restaurante', 'mercado', 'exito', 'ara', 'jumbo', 'carulla',
        'olimpica', 'corral', 'burger', 'pizza', 'sushi', 'pollo', 'cafe', 'coffee',
        'panaderia', 'fruver', 'verduras', 'carnes', 'semolina', 'domino', 'archie',
        'wendys', 'wendy', 'subway', 'mcdonalds', 'kfc', 'rappi', 'uber eats', 'ifood',
        'salchichas', 'filandia', 'pastelitos', 'picara', 'olivia', 'voodoo', 'mulera',
        'ko asian', 'club house', 'fort nassau', 'roses cafe', 'jv coffee', 'harbourfront',
        'varietale', 'amarti', 'mis raices', 'loma'
    ],
    'Transporte': [
        'uber', 'didi', 'gasolina', 'terpel', 'texaco', 'esso', 'mobil', 'peaje',
        'estacion', 'parqueadero', 'parking', 'eds', 'combustible', 'taxi', 'cabify',
        'beat', 'indriver', 'sostenibles'
    ],
    'Suscripciones': [
        'spotify', 'netflix', 'disney', 'hbo', 'amazon prime', 'prime video', 'youtube',
        'apple music', 'deezer', 'google one', 'icloud', 'microsoft', 'adobe', 'canva',
        'dropbox', 'notion', 'slack', 'zoom', 'lifemiles', 'suscripcion', 'membership'
    ],
    'Entretenimiento': [
        'cine', 'cinepolis', 'cinecolombia', 'teatro', 'concierto', 'evento', 'steam',
        'playstation', 'xbox', 'nintendo', 'gaming', 'ticket colombia', 'fteatrona'
    ],
    'Viajes': [
        'avianca', 'latam', 'wingo', 'viva', 'hotel', 'marriott', 'hilton', 'airbnb',
        'booking', 'expedia', 'national car', 'hertz', 'avis', 'aeropuerto', 'airalo',
        'entrelazos', 'courtyard', 'curacao'
    ],
    'Compras': [
        'amazon', 'mercado libre', 'mercadolibre', 'mercado pago', 'falabella', 'zara',
        'h&m', 'adidas', 'nike', 'puma', 'pandora', 'bosi', 'tennis', 'gef', 'cueros',
        'cuerosvel', 'uniandinos', 'tiendas punto'
    ],
    'Servicios': [
        'luz', 'agua', 'gas', 'internet', 'claro', 'movistar', 'tigo', 'etb', 'epm',
        'codensa', 'vanti', 'acueducto', 'aseo', 'administracion'
    ],
    'Vivienda': [
        'alquiler', 'renta', 'arriendo', 'hipoteca', 'credito vivienda', 'inmobiliaria'
    ],
    'Salud': [
        'farmacia', 'drogueria', 'cruz verde', 'farmatodo', 'locatel', 'medico',
        'hospital', 'clinica', 'seguro medico', 'eps', 'medicina prepagada', 'consultorio',
        'consultori', 'odontolog', 'dentista'
    ],
    'Transferencias': [
        'transferencia', 'portal internet', 'bre-b', 'pse', 'daviplata', 'nequi'
    ]
};

const CATEGORY_COLORS = {
    'Alimentación': '#22c55e',
    'Transporte': '#f59e0b',
    'Suscripciones': '#8b5cf6',
    'Entretenimiento': '#ec4899',
    'Viajes': '#14b8a6',
    'Compras': '#f97316',
    'Servicios': '#06b6d4',
    'Vivienda': '#6366f1',
    'Salud': '#ef4444',
    'Transferencias': '#3b82f6',
    'Otros': '#64748b',
    'Ingreso': '#10b981'
};

const MONTH_NAMES = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
};

const MONTH_NAMES_FULL = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
};

// ==========================================
// STATE MANAGEMENT
// ==========================================

let allTransactions = [];
let filteredTransactions = [];
let currentPeriod = '6months';
let currentCategoryFilter = 'all';
let monthlyChartInstance = null;
let categoryChartInstance = null;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const formatCOP = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(num);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const [year, month, day] = dateStr.split('-');
    return `${day} ${MONTH_NAMES[month]} ${year}`;
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return '--';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
};

// ==========================================
// CATEGORIZATION SYSTEM
// ==========================================

function categorizeTransaction(detalle, tipo) {
    // If it's a deposit or income, it's income
    if (['Depósito', 'Ingreso', 'Pago/Abono'].includes(tipo)) {
        return 'Ingreso';
    }

    // Clean and normalize the detail string
    const detail = (detalle || '').toLowerCase().trim();

    // Skip empty or invalid transactions
    if (!detail || detail === '' || detail === 'n/a') {
        return 'Otros';
    }

    // Check against each category's keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (detail.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    // Default category
    return 'Otros';
}

function processTransactions(data) {
    return data
        .filter(tx => tx.valor > 0) // Filter out zero-value transactions
        // Exclude Internal Credit Card Payments from Dashboard (to avoid double counting/income inflation)
        .filter(tx => tx.tipo !== 'Pago/Abono')
        .map(tx => ({
            ...tx,
            // Use pre-computed categoria from JSON, fallback to dynamic categorization
            categoria: tx.categoria || categorizeTransaction(tx.detalle, tx.tipo),
            isIncome: ['Depósito', 'Ingreso'].includes(tx.tipo)
        }));
}

// ==========================================
// PERIOD FILTERING
// ==========================================

function filterByPeriod(transactions, period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case '3months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            break;
        case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            break;
        case 'year':
            // Filter by selected year from year-select dropdown
            const yearSelect = document.getElementById('year-select');
            const selectedYear = yearSelect ? parseInt(yearSelect.value) : now.getFullYear();
            return transactions.filter(tx => {
                const txYear = new Date(tx.fecha).getFullYear();
                return txYear === selectedYear;
            });
        case 'all':
        default:
            return transactions;
    }

    return transactions.filter(tx => {
        const txDate = new Date(tx.fecha);
        return txDate >= startDate;
    });
}

// ==========================================
// KPI CALCULATIONS
// ==========================================

function calculateKPIs(transactions) {
    const income = transactions
        .filter(tx => tx.isIncome)
        .reduce((sum, tx) => sum + tx.valor, 0);

    const expenses = transactions
        .filter(tx => !tx.isIncome)
        .reduce((sum, tx) => sum + tx.valor, 0);

    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const expensePercent = income > 0 ? (expenses / income) * 100 : 0;

    // Calculate daily average
    const dates = [...new Set(transactions.filter(tx => !tx.isIncome).map(tx => tx.fecha))];
    const avgDaily = dates.length > 0 ? expenses / dates.length : 0;

    // Find max expense day
    const expensesByDay = {};
    transactions.filter(tx => !tx.isIncome).forEach(tx => {
        if (!expensesByDay[tx.fecha]) expensesByDay[tx.fecha] = 0;
        expensesByDay[tx.fecha] += tx.valor;
    });

    let maxDay = '--';
    let maxDayValue = 0;
    for (const [date, value] of Object.entries(expensesByDay)) {
        if (value > maxDayValue) {
            maxDayValue = value;
            maxDay = date;
        }
    }

    // Find dominant category
    const categoryTotals = {};
    transactions.filter(tx => !tx.isIncome).forEach(tx => {
        if (!categoryTotals[tx.categoria]) categoryTotals[tx.categoria] = 0;
        categoryTotals[tx.categoria] += tx.valor;
    });

    let dominantCategory = '--';
    let dominantValue = 0;
    for (const [cat, value] of Object.entries(categoryTotals)) {
        if (value > dominantValue) {
            dominantValue = value;
            dominantCategory = cat;
        }
    }

    return {
        income,
        expenses,
        balance,
        savingsRate,
        expensePercent,
        avgDaily,
        maxDay,
        maxDayValue,
        dominantCategory,
        dominantPercent: expenses > 0 ? (dominantValue / expenses) * 100 : 0,
        categoryTotals,
        incomeCount: transactions.filter(tx => tx.isIncome).length,
        expenseCount: transactions.filter(tx => !tx.isIncome).length,
        totalCount: transactions.length
    };
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================

function renderKPIs(kpis) {
    // Balance
    document.getElementById('balance-value').textContent = formatCOP(kpis.balance);
    const balanceIndicator = document.getElementById('balance-indicator');
    balanceIndicator.className = 'kpi-indicator ' + (kpis.balance >= 0 ? 'positive' : 'negative');
    document.getElementById('balance-value').style.color = kpis.balance >= 0 ? 'var(--success)' : 'var(--danger)';

    // Savings Rate
    const savingsRateValue = document.getElementById('savings-rate-value');
    savingsRateValue.textContent = `${kpis.savingsRate.toFixed(1)}%`;

    const savingsIndicator = document.getElementById('savings-indicator');
    const gaugeFill = document.getElementById('gauge-fill');

    let savingsColor, savingsClass;
    if (kpis.savingsRate > 20) {
        savingsColor = 'var(--success)';
        savingsClass = 'positive';
    } else if (kpis.savingsRate >= 10) {
        savingsColor = 'var(--warning)';
        savingsClass = 'warning';
    } else {
        savingsColor = 'var(--danger)';
        savingsClass = 'negative';
    }

    savingsRateValue.style.color = savingsColor;
    savingsIndicator.className = 'kpi-indicator ' + savingsClass;
    gaugeFill.style.width = `${Math.min(kpis.savingsRate, 100)}%`;
    gaugeFill.style.background = savingsColor;

    // Income
    document.getElementById('income-value').textContent = formatCOP(kpis.income);
    document.getElementById('income-value').style.color = 'var(--success)';
    document.getElementById('income-count').textContent = `${kpis.incomeCount} transacciones`;

    // Expenses
    document.getElementById('expenses-value').textContent = formatCOP(kpis.expenses);
    document.getElementById('expenses-percent').textContent = `${kpis.expensePercent.toFixed(0)}% del ingreso`;

    const expensesIndicator = document.getElementById('expenses-indicator');
    const expensesValue = document.getElementById('expenses-value');

    if (kpis.expensePercent < 60) {
        expensesIndicator.className = 'kpi-indicator positive';
        expensesValue.style.color = 'var(--success)';
    } else if (kpis.expensePercent <= 80) {
        expensesIndicator.className = 'kpi-indicator warning';
        expensesValue.style.color = 'var(--warning)';
    } else {
        expensesIndicator.className = 'kpi-indicator negative';
        expensesValue.style.color = 'var(--danger)';
    }

    // Summary
    document.getElementById('avg-daily').textContent = formatCOP(kpis.avgDaily);
    document.getElementById('max-day').textContent = kpis.maxDay !== '--' ? formatDate(kpis.maxDay) : '--';
    document.getElementById('dominant-category').textContent = `${kpis.dominantCategory} (${kpis.dominantPercent.toFixed(0)}%)`;
    document.getElementById('total-transactions').textContent = kpis.totalCount;
    document.getElementById('transaction-count').textContent = `${allTransactions.length} transacciones`;
}

function renderMonthlyChart(transactions) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');

    // Aggregate by month
    const monthlyData = {};
    transactions.forEach(tx => {
        const monthKey = tx.fecha.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        if (tx.isIncome) {
            monthlyData[monthKey].income += tx.valor;
        } else {
            monthlyData[monthKey].expense += tx.valor;
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        return `${MONTH_NAMES[month]} ${year.slice(2)}`;
    });

    const incomeData = sortedMonths.map(m => monthlyData[m].income);
    const expenseData = sortedMonths.map(m => monthlyData[m].expense);
    const balanceData = sortedMonths.map(m => monthlyData[m].income - monthlyData[m].expense);

    // Destroy previous chart if exists
    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 6,
                    order: 2
                },
                {
                    label: 'Gastos',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 6,
                    order: 3
                },
                {
                    label: 'Balance',
                    data: balanceData,
                    type: 'line',
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 11 },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${formatCOP(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 },
                        callback: value => formatCOP(value)
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#64748b', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderCategoryChart(transactions, kpis) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    // Get expense categories only (not income)
    const categoryTotals = {};
    transactions.filter(tx => !tx.isIncome).forEach(tx => {
        if (!categoryTotals[tx.categoria]) categoryTotals[tx.categoria] = 0;
        categoryTotals[tx.categoria] += tx.valor;
    });

    // Sort by value
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedCategories.map(([cat]) => cat);
    const data = sortedCategories.map(([, val]) => val);
    const colors = labels.map(cat => CATEGORY_COLORS[cat] || CATEGORY_COLORS['Otros']);

    // Update donut center
    document.getElementById('donut-total').textContent = formatCOP(kpis.expenses);

    // Destroy previous chart if exists
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 11 },
                        padding: 12,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${formatCOP(context.raw)} (${percentage}%)`;
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const category = labels[index];
                    filterTableByCategory(category);
                }
            }
        }
    });
}

function renderTopCategories(kpis) {
    const container = document.getElementById('top-categories-list');
    const totalExpenses = kpis.expenses;

    // Get top 5 categories
    const sortedCategories = Object.entries(kpis.categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxValue = sortedCategories[0]?.[1] || 0;

    container.innerHTML = sortedCategories.map(([category, value]) => {
        const percent = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0;
        const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['Otros'];

        return `
            <div class="category-bar" data-category="${category}">
                <div class="category-bar-header">
                    <span class="category-bar-name">${category}</span>
                    <span class="category-bar-value">${formatCOP(value)} (${percent.toFixed(1)}%)</span>
                </div>
                <div class="category-bar-track">
                    <div class="category-bar-fill" style="width: ${barWidth}%; background: ${color};"></div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.category-bar').forEach(bar => {
        bar.style.cursor = 'pointer';
        bar.addEventListener('click', () => {
            const category = bar.dataset.category;
            filterTableByCategory(category);
        });
    });
}

function renderInsights(transactions, kpis) {
    const container = document.getElementById('ai-insights');
    const insights = [];

    // Ticket promedio
    const expenseTransactions = transactions.filter(tx => !tx.isIncome);
    const avgTicket = expenseTransactions.length > 0
        ? kpis.expenses / expenseTransactions.length
        : 0;
    insights.push({
        text: `Ticket promedio: <strong>${formatCOP(avgTicket)}</strong> por transacción`,
        type: 'neutral'
    });

    // Establecimiento más frecuente
    const merchants = {};
    expenseTransactions.forEach(tx => {
        const merchant = tx.detalle?.trim();
        if (merchant && merchant !== '') {
            merchants[merchant] = (merchants[merchant] || 0) + 1;
        }
    });

    const topMerchant = Object.entries(merchants)
        .sort((a, b) => b[1] - a[1])[0];

    if (topMerchant) {
        insights.push({
            text: `Establecimiento frecuente: <strong>${topMerchant[0]}</strong> (${topMerchant[1]} visitas)`,
            type: 'neutral'
        });
    }

    // Ahorro o alerta
    if (kpis.savingsRate > 20) {
        insights.push({
            text: `¡Excelente! Ahorraste <strong>${formatCOP(kpis.balance)}</strong> este período`,
            type: 'positive'
        });
    } else if (kpis.savingsRate > 0) {
        insights.push({
            text: `Ahorraste <strong>${formatCOP(kpis.balance)}</strong>, intenta llegar al 20%`,
            type: 'warning'
        });
    } else if (kpis.balance < 0) {
        insights.push({
            text: `⚠️ Gastaste <strong>${formatCOP(Math.abs(kpis.balance))}</strong> más de lo que ingresaste`,
            type: 'negative'
        });
    }

    // Categoría dominante
    if (kpis.dominantCategory !== '--') {
        insights.push({
            text: `Tu mayor gasto es <strong>${kpis.dominantCategory}</strong> (${kpis.dominantPercent.toFixed(0)}% del total)`,
            type: 'neutral'
        });
    }

    container.innerHTML = insights.map(insight => `
        <div class="insight-item ${insight.type}">${insight.text}</div>
    `).join('');
}

function renderTables(transactions, kpis) {
    const expenseTransactions = transactions.filter(tx => !tx.isIncome);
    const incomeTransactions = transactions.filter(tx => tx.isIncome);

    // Expenses table
    const expensesBody = document.getElementById('table-gastos-body');
    if (expensesBody) {
        expensesBody.innerHTML = expenseTransactions
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map(tx => {
                const color = CATEGORY_COLORS[tx.categoria] || CATEGORY_COLORS['Otros'];
                return `
                    <tr data-category="${tx.categoria}">
                        <td>${formatDateShort(tx.fecha)}</td>
                        <td>${tx.detalle || 'Sin detalle'}</td>
                        <td>
                            <span class="category-badge" style="background: ${color}20; color: ${color};">
                                ${tx.categoria}
                            </span>
                        </td>
                        <td>${tx.banco}</td>
                        <td>${tx.producto}</td>
                        <td class="font-mono text-xs">${tx.numero_producto || '--'}</td>
                        <td class="text-right" style="color: var(--danger); font-weight: 600;">
                            ${formatCOP(tx.valor)}
                        </td>
                    </tr>
                `;
            }).join('');
    }

    // Income table
    const incomeBody = document.getElementById('table-ingresos-body');
    if (incomeBody) {
        incomeBody.innerHTML = incomeTransactions
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map(tx => `
                <tr>
                    <td>${formatDateShort(tx.fecha)}</td>
                    <td>${tx.detalle || 'Depósito / Ingreso'}</td>
                    <td>${tx.banco}</td>
                    <td>${tx.producto}</td>
                    <td class="font-mono text-xs">${tx.numero_producto || '--'}</td>
                    <td class="text-right" style="color: var(--success); font-weight: 600;">
                        ${formatCOP(tx.valor)}
                    </td>
                </tr>
            `).join('');
    }

    // Update footer counts
    document.getElementById('gastos-count').textContent = `${expenseTransactions.length} gastos`;
    document.getElementById('gastos-total').textContent = `Total: ${formatCOP(kpis.expenses)}`;
    document.getElementById('ingresos-count').textContent = `${incomeTransactions.length} ingresos`;
    document.getElementById('ingresos-total').textContent = `Total: ${formatCOP(kpis.income)}`;

    // Populate category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        const categories = [...new Set(expenseTransactions.map(tx => tx.categoria))].sort();
        categoryFilter.innerHTML = `
            <option value="all">Todas las categorías</option>
            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        `;
    }
}

function filterTableByCategory(category) {
    // Switch to expenses view
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === 'gastos') {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById('view-gastos').classList.add('active');

    // Set filter dropdown
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }

    // Apply filter
    applyTableFilters();
}

function applyTableFilters() {
    const searchTerm = document.getElementById('search-gastos')?.value.toLowerCase() || '';
    const categoryValue = document.getElementById('category-filter')?.value || 'all';

    const rows = document.querySelectorAll('#table-gastos-body tr');
    let visibleCount = 0;
    let visibleTotal = 0;

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const category = row.dataset.category;

        const matchesSearch = text.includes(searchTerm);
        const matchesCategory = categoryValue === 'all' || category === categoryValue;

        if (matchesSearch && matchesCategory) {
            row.style.display = '';
            visibleCount++;
            // Extract value from last cell
            const valueCell = row.querySelector('td:last-child');
            if (valueCell) {
                const valueText = valueCell.textContent.replace(/[^0-9]/g, '');
                visibleTotal += parseInt(valueText) || 0;
            }
        } else {
            row.style.display = 'none';
        }
    });

    document.getElementById('gastos-count').textContent = `${visibleCount} gastos`;
    document.getElementById('gastos-total').textContent = `Total: ${formatCOP(visibleTotal)}`;
}

function updateLastUpdateIndicator(transactions) {
    const dates = transactions.map(tx => tx.fecha).sort();
    const lastDate = dates[dates.length - 1];

    if (lastDate) {
        const [year, month, day] = lastDate.split('-');
        document.getElementById('last-update').textContent =
            `Datos hasta: ${day} ${MONTH_NAMES_FULL[month]} ${year}`;
    }
}

// ==========================================
// NAVIGATION & FILTERS
// ==========================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.content-view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${targetView}`) {
                    view.classList.add('active');
                }
            });
        });
    });
}

function setupFilters() {
    // Period selector
    const periodSelect = document.getElementById('period-select');
    const yearSelect = document.getElementById('year-select');

    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            currentPeriod = e.target.value;

            // Toggle year selector visibility
            if (yearSelect) {
                if (currentPeriod === 'year') {
                    yearSelect.classList.remove('hidden');
                } else {
                    yearSelect.classList.add('hidden');
                }
            }

            refreshDashboard();
        });
    }

    // Year selector
    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            if (currentPeriod === 'year') {
                refreshDashboard();
            }
        });
    }

    // Search filters
    const searchGastos = document.getElementById('search-gastos');
    if (searchGastos) {
        searchGastos.addEventListener('input', applyTableFilters);
    }

    const searchIngresos = document.getElementById('search-ingresos');
    if (searchIngresos) {
        searchIngresos.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#table-ingresos-body tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyTableFilters);
    }
}

// ==========================================
// YEAR DROPDOWN POPULATION
// ==========================================

function populateYearDropdown(transactions) {
    const yearSelect = document.getElementById('year-select');
    if (!yearSelect) return;

    // Extract unique years from transactions
    const years = [...new Set(transactions.map(tx => new Date(tx.fecha).getFullYear()))].sort((a, b) => b - a);

    yearSelect.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');
}

// ==========================================
// MAIN REFRESH FUNCTION
// ==========================================

function refreshDashboard() {
    filteredTransactions = filterByPeriod(allTransactions, currentPeriod);
    const kpis = calculateKPIs(filteredTransactions);

    renderKPIs(kpis);
    renderMonthlyChart(filteredTransactions);
    renderCategoryChart(filteredTransactions, kpis);
    renderTopCategories(kpis);
    renderInsights(filteredTransactions, kpis);
    renderTables(filteredTransactions, kpis);

    // Re-init lucide icons for any new elements
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==========================================
// DATA LOADING
// ==========================================

async function loadData() {
    try {
        // Load transaction data with cache busting
        const response = await fetch('data/movimientos.json?v=' + new Date().getTime());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Process and categorize transactions
        allTransactions = processTransactions(data);

        // Update last update indicator
        updateLastUpdateIndicator(allTransactions);

        // Populate year dropdown
        populateYearDropdown(allTransactions);

        // Initial render
        refreshDashboard();

        // Setup interactions
        setupNavigation();
        setupFilters();

    } catch (error) {
        console.error("Error loading data:", error);
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            topBar.innerHTML += `
                <p style="color: var(--danger); font-size: 0.85rem; margin-left: 1rem;">
                    Error cargando datos. Ejecuta: python -m http.server 8000
                </p>
            `;
        }
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
