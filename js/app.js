// =========================================
// APP - Finanzas Familiares Dashboard
// =========================================

// Global State
let allTransactions = [];
let filteredTransactions = [];
let currentView = 'resumen';
let charts = {};
let pagination = {
    gastos: { page: 1, perPage: CONFIG.ITEMS_PER_PAGE, total: 0 },
    ingresos: { page: 1, perPage: CONFIG.ITEMS_PER_PAGE, total: 0 }
};

// =========================================
// INITIALIZATION
// =========================================
function initApp() {
    console.log('🚀 Initializing Finanzas Familiares Dashboard');

    setupNavigation();
    setupFilters();
    setupFileUpload();
    loadData();
}

// Load data from JSON or Supabase
async function loadData() {
    try {
        // Try loading from local JSON first
        const response = await fetch('data/movimientos.json');
        if (response.ok) {
            const rawData = await response.json();
            // Normalize data keys (JSON uses lowercase, app uses PascalCase)
            allTransactions = rawData.map(t => ({
                Fecha: t.fecha || t.Fecha,
                Tipo: t.tipo || t.Tipo,
                Valor: t.valor || t.Valor || 0,
                Categoria: t.categoria || t.Categoria || 'Otros',
                Banco: t.banco || t.Banco || '--',
                Detalle: t.detalle || t.Detalle || '',
                Producto: t.producto || t.Producto || '',
                NumeroProducto: t.numero_producto || t.NumeroProducto || ''
            }));
            console.log(`📊 Loaded ${allTransactions.length} transactions`);
            applyFilters();
            renderAll();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        allTransactions = [];
        renderAll();
    }
}

// =========================================
// NAVIGATION
// =========================================
function setupNavigation() {
    const navLinks = document.querySelectorAll('#main-nav .nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            if (view) navigateTo(view);
        });
    });
}

function navigateTo(view) {
    currentView = view;

    // Update nav active states
    const navLinks = document.querySelectorAll('#main-nav .nav-link');
    navLinks.forEach(link => {
        if (link.dataset.view === view) {
            link.classList.add('text-primary');
            link.classList.remove('text-slate-600', 'dark:text-slate-300');
        } else {
            link.classList.remove('text-primary');
            link.classList.add('text-slate-600', 'dark:text-slate-300');
        }
    });

    // Show/hide sections
    const sections = document.querySelectorAll('section.view-section');
    sections.forEach(section => {
        if (section.id === `section-${view}`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
}

// =========================================
// FILTERS
// =========================================
function setupFilters() {
    // Period filter
    const periodFilter = document.getElementById('period-filter');
    if (periodFilter) {
        periodFilter.addEventListener('change', () => {
            applyFilters();
            renderAll();
        });
    }

    // Search gastos
    const searchGastos = document.getElementById('search-gastos');
    if (searchGastos) {
        searchGastos.addEventListener('input', debounce(() => {
            applyFilters();
            renderGastosTable();
        }, 300));
    }

    // Clear filters
    const clearBtn = document.getElementById('clear-filters-gastos');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('search-gastos').value = '';
            document.getElementById('filter-member-gastos').value = 'all';
            document.getElementById('filter-bank-gastos').value = 'all';
            document.getElementById('filter-category-gastos').value = 'all';
            applyFilters();
            renderGastosTable();
        });
    }

    // Pagination
    document.getElementById('gastos-prev')?.addEventListener('click', () => changePage('gastos', -1));
    document.getElementById('gastos-next')?.addEventListener('click', () => changePage('gastos', 1));
    document.getElementById('ingresos-prev')?.addEventListener('click', () => changePage('ingresos', -1));
    document.getElementById('ingresos-next')?.addEventListener('click', () => changePage('ingresos', 1));
}

function applyFilters() {
    const period = document.getElementById('period-filter')?.value || CONFIG.DEFAULT_PERIOD;
    const now = new Date();
    let startDate = new Date(0);

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
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all':
        default:
            startDate = new Date(0);
    }

    filteredTransactions = allTransactions.filter(t => {
        const date = new Date(t.Fecha);
        return date >= startDate && date <= now;
    });

    // Reset pagination
    pagination.gastos.page = 1;
    pagination.ingresos.page = 1;
}

function changePage(type, delta) {
    const pag = pagination[type];
    const totalPages = Math.ceil(pag.total / pag.perPage);
    const newPage = pag.page + delta;

    if (newPage >= 1 && newPage <= totalPages) {
        pag.page = newPage;
        if (type === 'gastos') renderGastosTable();
        else renderIngresosTable();
    }
}

// =========================================
// RENDER FUNCTIONS
// =========================================
function renderAll() {
    renderKPIs();
    renderCharts();
    renderRecentTransactions();
    renderCategoryDonut();
    renderFamilyIncome();
    renderAccounts();
    renderGastosTable();
    renderIngresosTable();
    fetchAIRecommendations();
}

// KPIs
function renderKPIs() {
    const gastos = filteredTransactions.filter(t => t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito');
    const ingresos = filteredTransactions.filter(t => t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida');

    const totalGastos = gastos.reduce((sum, t) => sum + (parseFloat(t.Valor) || 0), 0);
    const totalIngresos = ingresos.reduce((sum, t) => sum + (parseFloat(t.Valor) || 0), 0);
    const balance = totalIngresos - totalGastos;

    // Update KPI values
    document.getElementById('kpi-balance').textContent = formatCurrency(balance);
    document.getElementById('kpi-income').textContent = formatCurrency(totalIngresos);
    document.getElementById('kpi-expenses').textContent = formatCurrency(totalGastos);

    // Update gastos view stats
    const gastosTotal = document.getElementById('gastos-total-stat');
    if (gastosTotal) gastosTotal.textContent = formatCurrency(totalGastos);

    const daysInPeriod = getDaysInPeriod();
    const dailyAvg = document.getElementById('gastos-daily-avg');
    if (dailyAvg) dailyAvg.textContent = formatCurrency(totalGastos / daysInPeriod);

    // Top category
    const categorySums = {};
    gastos.forEach(t => {
        const cat = t.Categoria || 'Otros';
        categorySums[cat] = (categorySums[cat] || 0) + Math.abs(parseFloat(t.Valor) || 0);
    });
    const topCategory = Object.entries(categorySums).sort((a, b) => b[1] - a[1])[0];
    const topCatEl = document.getElementById('gastos-top-category');
    if (topCatEl && topCategory) {
        topCatEl.textContent = `${topCategory[0]} (${formatCurrency(topCategory[1])})`;
    }

    // Update ingresos view stats
    const ingresosTotal = document.getElementById('ingresos-total-stat');
    if (ingresosTotal) ingresosTotal.textContent = formatCurrency(totalIngresos);
}

// Charts
function renderCharts() {
    renderIncomeVsExpensesChart();
}

function renderIncomeVsExpensesChart() {
    const ctx = document.getElementById('chart-income-vs-expenses');
    if (!ctx) return;

    // Destroy existing chart
    if (charts.incomeVsExpenses) {
        charts.incomeVsExpenses.destroy();
    }

    // Group by month
    const monthlyData = {};
    filteredTransactions.forEach(t => {
        const date = new Date(t.Fecha);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        const value = Math.abs(parseFloat(t.Valor) || 0);
        if (t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida') {
            monthlyData[monthKey].income += value;
        } else {
            monthlyData[monthKey].expenses += value;
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        return new Date(year, month - 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
    });

    charts.incomeVsExpenses = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: sortedMonths.map(m => monthlyData[m].income),
                    borderColor: CONFIG.CHART_COLORS.primary,
                    backgroundColor: CONFIG.CHART_COLORS.primary + '20',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Gastos',
                    data: sortedMonths.map(m => monthlyData[m].expenses),
                    borderColor: CONFIG.CHART_COLORS.danger,
                    backgroundColor: CONFIG.CHART_COLORS.danger + '20',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    grid: { color: '#374151' },
                    ticks: {
                        callback: value => formatCurrencyShort(value)
                    }
                }
            }
        }
    });
}

function renderCategoryDonut() {
    const ctx = document.getElementById('chart-categories-donut');
    if (!ctx) return;

    if (charts.categoryDonut) {
        charts.categoryDonut.destroy();
    }

    const gastos = filteredTransactions.filter(t => t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito');
    const categorySums = {};
    gastos.forEach(t => {
        const cat = t.Categoria || 'Otros';
        categorySums[cat] = (categorySums[cat] || 0) + Math.abs(parseFloat(t.Valor) || 0);
    });

    const sorted = Object.entries(categorySums).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, val]) => val);
    const colors = [
        CONFIG.CHART_COLORS.primary,
        CONFIG.CHART_COLORS.secondary,
        CONFIG.CHART_COLORS.danger,
        CONFIG.CHART_COLORS.warning,
        CONFIG.CHART_COLORS.purple,
        CONFIG.CHART_COLORS.teal
    ];

    const total = data.reduce((a, b) => a + b, 0);
    document.getElementById('donut-total').textContent = formatCurrencyShort(total);

    charts.categoryDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '70%',
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Update legend
    const legendContainer = document.getElementById('category-legend');
    if (legendContainer) {
        legendContainer.innerHTML = sorted.map(([cat, val], i) => `
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <span class="size-3 rounded-full" style="background: ${colors[i]}"></span>
                    <span class="text-sm font-medium">${cat}</span>
                </div>
                <span class="text-sm text-slate-500 dark:text-slate-400">${formatCurrency(val)}</span>
            </div>
        `).join('');
    }
}

// Recent Transactions
function renderRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    if (!container) return;

    const recent = [...filteredTransactions]
        .sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha))
        .slice(0, 5);

    container.innerHTML = recent.map(t => {
        const isExpense = t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito';
        const value = parseFloat(t.Valor) || 0;
        const icon = isExpense ? 'shopping_cart' : 'payments';
        const valueClass = isExpense ? 'text-danger' : 'text-secondary';
        const prefix = isExpense ? '-' : '+';

        return `
            <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <span class="material-symbols-outlined text-[20px]">${icon}</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium">${t.Detalle || t.Tipo}</p>
                        <p class="text-xs text-slate-500">${formatDate(t.Fecha)}</p>
                    </div>
                </div>
                <span class="text-sm font-bold ${valueClass}">${prefix}${formatCurrency(Math.abs(value))}</span>
            </div>
        `;
    }).join('');
}

// Family Income
function renderFamilyIncome() {
    const container = document.getElementById('family-income-list');
    if (!container) return;

    const ingresos = filteredTransactions.filter(t => t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida');
    const totalIncome = ingresos.reduce((sum, t) => sum + Math.abs(parseFloat(t.Valor) || 0), 0);

    // Mock family data - in production this would be per-member tracking
    const familyData = [
        { member: CONFIG.FAMILY_MEMBERS[0], income: totalIncome * 0.55, goal: totalIncome * 0.6 },
        { member: CONFIG.FAMILY_MEMBERS[1], income: totalIncome * 0.45, goal: totalIncome * 0.5 }
    ];

    container.innerHTML = familyData.map(({ member, income, goal }) => {
        const progress = Math.min((income / goal) * 100, 100);
        return `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#1c2333] border border-slate-100 dark:border-slate-800">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full ${member.color} text-white font-bold text-sm">
                            ${member.initials}
                        </div>
                        <div>
                            <p class="font-medium">${member.name}</p>
                            <p class="text-xs text-slate-500">Meta: ${formatCurrency(goal)}</p>
                        </div>
                    </div>
                    <span class="text-lg font-bold text-secondary">${formatCurrency(income)}</span>
                </div>
                <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Accounts
function renderAccounts() {
    const container = document.getElementById('accounts-list');
    if (!container) return;

    // Extract unique banks from transactions
    const bankBalances = {};
    filteredTransactions.forEach(t => {
        const bank = t.Banco || 'Otro';
        const value = parseFloat(t.Valor) || 0;
        const isIncome = t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida';
        bankBalances[bank] = (bankBalances[bank] || 0) + (isIncome ? value : -value);
    });

    const banks = Object.entries(bankBalances).slice(0, 4);

    if (banks.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-sm">No hay cuentas para mostrar</p>';
        return;
    }

    container.innerHTML = banks.map(([bank, balance]) => `
        <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#1c2333] hover:bg-slate-100 dark:hover:bg-[#232b3b] transition-colors cursor-pointer">
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                    <span class="material-symbols-outlined">account_balance</span>
                </div>
                <div>
                    <p class="font-medium">${bank}</p>
                    <p class="text-xs text-slate-500">Cuenta</p>
                </div>
            </div>
            <span class="font-bold ${balance >= 0 ? 'text-secondary' : 'text-danger'}">${formatCurrency(balance)}</span>
        </div>
    `).join('');
}

// Gastos Table
function renderGastosTable() {
    const tbody = document.getElementById('table-gastos-body');
    if (!tbody) return;

    const searchTerm = document.getElementById('search-gastos')?.value?.toLowerCase() || '';

    let gastos = filteredTransactions.filter(t =>
        t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito'
    );

    // Apply search
    if (searchTerm) {
        gastos = gastos.filter(t =>
            (t.Detalle || '').toLowerCase().includes(searchTerm) ||
            (t.Categoria || '').toLowerCase().includes(searchTerm) ||
            String(t.Valor).includes(searchTerm)
        );
    }

    // Sort by date descending
    gastos.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

    // Pagination
    pagination.gastos.total = gastos.length;
    const start = (pagination.gastos.page - 1) * pagination.gastos.perPage;
    const pageData = gastos.slice(start, start + pagination.gastos.perPage);

    tbody.innerHTML = pageData.map(t => {
        const catColors = CONFIG.CATEGORY_COLORS[t.Categoria] || CONFIG.CATEGORY_COLORS['Otros'];
        const member = CONFIG.FAMILY_MEMBERS[0]; // Default for demo

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-[#1f2633] transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">${formatDate(t.Fecha)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <div class="size-6 rounded-full ${member.color} flex items-center justify-center text-[10px] font-bold text-white">${member.initials}</div>
                        <span>${member.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap font-medium">${t.Detalle || t.Tipo}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center rounded-full ${catColors.bg} px-2.5 py-0.5 text-xs font-medium ${catColors.text}">
                        ${t.Categoria || 'Otros'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-slate-500">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg">account_balance</span>
                        <span>${t.Banco || '--'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right font-bold text-danger">-${formatCurrency(Math.abs(parseFloat(t.Valor) || 0))}</td>
            </tr>
        `;
    }).join('');

    // Update pagination info
    const info = document.getElementById('gastos-pagination-info');
    if (info) {
        const end = Math.min(start + pagination.gastos.perPage, pagination.gastos.total);
        info.textContent = `Mostrando ${start + 1} a ${end} de ${pagination.gastos.total} resultados`;
    }

    // Update pagination buttons
    document.getElementById('gastos-prev').disabled = pagination.gastos.page <= 1;
    document.getElementById('gastos-next').disabled = start + pagination.gastos.perPage >= pagination.gastos.total;
}

// Ingresos Table
function renderIngresosTable() {
    const tbody = document.getElementById('table-ingresos-body');
    if (!tbody) return;

    let ingresos = filteredTransactions.filter(t =>
        t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida'
    );

    // Sort by date descending
    ingresos.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

    // Pagination
    pagination.ingresos.total = ingresos.length;
    const start = (pagination.ingresos.page - 1) * pagination.ingresos.perPage;
    const pageData = ingresos.slice(start, start + pagination.ingresos.perPage);

    tbody.innerHTML = pageData.map(t => {
        const sourceColors = CONFIG.CATEGORY_COLORS[t.Categoria] || CONFIG.CATEGORY_COLORS['Sueldo'];
        const member = CONFIG.FAMILY_MEMBERS[Math.floor(Math.random() * 2)]; // Random for demo

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-[#232936] transition-colors">
                <td class="py-4 px-6 text-sm font-medium whitespace-nowrap">${formatDate(t.Fecha)}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <div class="size-8 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white">${member.initials}</div>
                        <div class="text-sm font-medium">${member.name}</div>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <span class="inline-flex items-center rounded-full ${sourceColors.bg} px-2.5 py-0.5 text-xs font-medium ${sourceColors.text}">
                        ${t.Categoria || t.Tipo}
                    </span>
                </td>
                <td class="py-4 px-6 text-sm text-slate-500">${t.Banco || '--'} ${t.Producto ? '••••' + t.Producto.slice(-4) : ''}</td>
                <td class="py-4 px-6 text-right">
                    <span class="text-secondary font-bold text-sm">+${formatCurrency(Math.abs(parseFloat(t.Valor) || 0))}</span>
                </td>
            </tr>
        `;
    }).join('');

    // Update pagination info
    const info = document.getElementById('ingresos-pagination-info');
    if (info) {
        const end = Math.min(start + pagination.ingresos.perPage, pagination.ingresos.total);
        info.textContent = `Mostrando ${start + 1} a ${end} de ${pagination.ingresos.total} resultados`;
    }

    // Update pagination buttons
    document.getElementById('ingresos-prev').disabled = pagination.ingresos.page <= 1;
    document.getElementById('ingresos-next').disabled = start + pagination.ingresos.perPage >= pagination.ingresos.total;
}

// =========================================
// AI RECOMMENDATIONS (Gemini)
// =========================================
async function fetchAIRecommendations() {
    const container = document.getElementById('ai-recommendations');
    if (!container) return;

    container.innerHTML = `
        <div class="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/20 border border-slate-100 dark:border-slate-800">
            <p class="text-sm text-slate-500 dark:text-slate-400 animate-pulse">✨ Analizando tus finanzas...</p>
        </div>
    `;

    // Calculate summary data
    const gastos = filteredTransactions.filter(t => t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito');
    const ingresos = filteredTransactions.filter(t => t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida');
    const totalGastos = gastos.reduce((sum, t) => sum + Math.abs(parseFloat(t.Valor) || 0), 0);
    const totalIngresos = ingresos.reduce((sum, t) => sum + Math.abs(parseFloat(t.Valor) || 0), 0);

    // Get top categories
    const categorySpend = {};
    gastos.forEach(t => {
        const cat = t.Categoria || 'Otros';
        categorySpend[cat] = (categorySpend[cat] || 0) + Math.abs(parseFloat(t.Valor) || 0);
    });
    const topCategories = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const prompt = `Eres un asesor financiero familiar experto. Analiza estos datos y da 3 recomendaciones CORTAS (máximo 2 líneas cada una) y ACCIONABLES:

Ingresos del mes: $${totalIngresos.toLocaleString()}
Gastos del mes: $${totalGastos.toLocaleString()}
Balance: $${(totalIngresos - totalGastos).toLocaleString()}
Gastos por categoría: ${topCategories.map(([cat, val]) => `${cat}: $${val.toLocaleString()}`).join(', ')}

Responde en español, con emojis, formato: "1. [emoji] [consejo corto]" para cada recomendación.`;

    try {
        const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo obtener recomendaciones.';

            const recommendations = text.split('\n').filter(line => line.trim().match(/^\d\./));
            container.innerHTML = recommendations.map(rec => `
                <div class="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/20 border border-slate-100 dark:border-slate-800">
                    <p class="text-sm">${rec.replace(/^\d\.\s*/, '')}</p>
                </div>
            `).join('');
        } else {
            throw new Error('API error');
        }
    } catch (error) {
        console.error('AI Recommendations error:', error);
        container.innerHTML = `
            <div class="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/20 border border-slate-100 dark:border-slate-800">
                <p class="text-sm">💡 Mantén un ahorro del 20% de tus ingresos mensuales.</p>
            </div>
            <div class="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/20 border border-slate-100 dark:border-slate-800">
                <p class="text-sm">📊 Revisa tus gastos por categoría para identificar oportunidades.</p>
            </div>
        `;
    }

    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-ai-btn');
    if (refreshBtn) {
        refreshBtn.onclick = fetchAIRecommendations;
    }
}

// =========================================
// FILE UPLOAD
// =========================================
function setupFileUpload() {
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('border-primary', 'bg-primary/5');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('border-primary', 'bg-primary/5');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('border-primary', 'bg-primary/5');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
}

async function handleFile(file) {
    const bank = document.getElementById('upload-bank')?.value;
    const member = document.getElementById('upload-member')?.value;

    if (!bank || !member) {
        alert('Por favor selecciona un banco y un miembro de la familia');
        return;
    }

    console.log(`📁 Processing file: ${file.name} for ${bank} / ${member}`);

    // Add to upload history
    addUploadHistory(file.name, bank, member, 'processing');

    // TODO: Implement actual file parsing (CSV/XLSX)
    setTimeout(() => {
        addUploadHistory(file.name, bank, member, 'success');
        alert(`✅ Archivo "${file.name}" procesado correctamente`);
        loadData(); // Reload data
    }, 2000);
}

function addUploadHistory(filename, bank, member, status) {
    const tbody = document.getElementById('upload-history-body');
    if (!tbody) return;

    const statusBadge = {
        processing: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"><span class="size-1.5 rounded-full bg-blue-500 animate-pulse"></span>Procesando</span>',
        success: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"><span class="size-1.5 rounded-full bg-green-500"></span>Listo</span>',
        error: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"><span class="size-1.5 rounded-full bg-red-500"></span>Error</span>'
    };

    const memberData = CONFIG.FAMILY_MEMBERS.find(m => m.id === member) || CONFIG.FAMILY_MEMBERS[0];

    const row = `
        <tr class="hover:bg-slate-50 dark:hover:bg-[#1c2333]/50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined ${status === 'success' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-blue-500 animate-pulse'}">${status === 'success' ? 'description' : status === 'error' ? 'error' : 'sync'}</span>
                    <span class="font-medium">${filename}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-slate-500">${bank}</td>
            <td class="px-6 py-4 text-slate-500">${new Date().toLocaleDateString('es-CO')}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <div class="size-6 rounded-full ${memberData.color} flex items-center justify-center text-[10px] font-bold text-white">${memberData.initials}</div>
                </div>
            </td>
            <td class="px-6 py-4 text-right">${statusBadge[status]}</td>
        </tr>
    `;

    // Clear "no uploads" message if present
    if (tbody.querySelector('td[colspan]')) {
        tbody.innerHTML = '';
    }

    tbody.insertAdjacentHTML('afterbegin', row);
}

// =========================================
// UTILITY FUNCTIONS
// =========================================
function formatCurrency(value) {
    return new Intl.NumberFormat(CONFIG.LOCALE, {
        style: 'currency',
        currency: CONFIG.CURRENCY,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatCurrencyShort(value) {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDaysInPeriod() {
    const period = document.getElementById('period-filter')?.value || 'month';
    switch (period) {
        case 'month': return 30;
        case '3months': return 90;
        case '6months': return 180;
        case 'year': return 365;
        default: return 30;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =========================================
// Initialize on DOM Ready
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // Only init app if user is logged in
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        initApp();
    }
});
