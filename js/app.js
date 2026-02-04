// =========================================
// APP - Finanzas Familiares Dashboard
// =========================================

// Global State
let allTransactions = [];
let filteredTransactions = [];
let currentView = 'resumen';
let charts = {};
let selectedMembers = []; // Empty means all members selected
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
    initMemberFilter();
    loadData();
}

// Load data from localStorage (primary) or JSON file (fallback)
async function loadData() {
    try {
        // First, try loading from localStorage (previously uploaded data)
        const storedData = localStorage.getItem('finanzas_transactions');

        if (storedData) {
            allTransactions = JSON.parse(storedData);
            console.log(`📊 Loaded ${allTransactions.length} transactions from localStorage`);
        } else {
            // Fallback to JSON file
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
                    NumeroProducto: t.numero_producto || t.NumeroProducto || '',
                    Miembro: t.miembro || t.Miembro || ''
                }));
                console.log(`📊 Loaded ${allTransactions.length} transactions from JSON`);
            }
        }

        applyFilters();
        renderAll();

    } catch (error) {
        console.error('Error loading data:', error);
        allTransactions = [];
        renderAll();
    }
}

// Save transactions to localStorage
function saveTransactions() {
    try {
        localStorage.setItem('finanzas_transactions', JSON.stringify(allTransactions));
        console.log(`💾 Saved ${allTransactions.length} transactions to localStorage`);
    } catch (error) {
        console.error('Error saving transactions:', error);
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
    let endDate = new Date(now.getFullYear() + 1, 11, 31); // Default to far future

    switch (period) {
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
            break;
        case '3months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            break;
        case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
        case 'all':
        default:
            startDate = new Date(0);
    }

    filteredTransactions = allTransactions.filter(t => {
        const date = new Date(t.Fecha);
        const dateInRange = date >= startDate && date <= endDate;

        // Filter by members if specific members are selected
        const memberMatch = selectedMembers.length === 0 || selectedMembers.includes(t.Miembro);

        return dateInRange && memberMatch;
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
    populateAdvancedFilters();
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
    // Include all common expense types
    const gastos = filteredTransactions.filter(t =>
        t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
        t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo'
    );
    // Include all common income types
    const ingresos = filteredTransactions.filter(t =>
        t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida' ||
        t.Tipo === 'Ingreso' || t.Tipo === 'Abono' || t.Tipo === 'Sueldo' || t.Tipo === 'Salario'
    );

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

    const gastos = filteredTransactions.filter(t =>
        t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
        t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo'
    );
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

    // Get all filter values
    const filters = getGastosFilterValues();

    // Start with expense-type transactions from all (not just filtered by global period)
    let gastos = allTransactions.filter(t =>
        t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
        t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo'
    );

    // Apply advanced filters
    gastos = filterByAdvancedCriteria(gastos, filters);

    // Calculate total for filtered expenses
    const totalFiltered = gastos.reduce((sum, t) => sum + (parseFloat(t.Valor) || 0), 0);
    const totalElement = document.getElementById('gastos-filtered-total');
    if (totalElement) {
        totalElement.textContent = formatCurrency(totalFiltered);
    }

    // Sort by date descending
    gastos.sort((a, b) => parseDateString(b.Fecha) - parseDateString(a.Fecha));

    // Pagination
    pagination.gastos.total = gastos.length;
    const start = (pagination.gastos.page - 1) * pagination.gastos.perPage;
    const pageData = gastos.slice(start, start + pagination.gastos.perPage);

    tbody.innerHTML = pageData.map((t, pageIndex) => {
        const catColors = CONFIG.CATEGORY_COLORS[t.Categoria] || CONFIG.CATEGORY_COLORS['Otros'];
        // Buscar miembro real de la transacción
        const memberData = CONFIG.FAMILY_MEMBERS.find(m => m.id === t.Miembro) ||
            { id: t.Miembro || 'N/A', name: t.Miembro || 'N/A', initials: (t.Miembro || '?')[0].toUpperCase(), color: 'bg-gray-500' };
        // Calcular índice global en allTransactions
        const globalIndex = allTransactions.findIndex(tx =>
            tx.Fecha === t.Fecha && tx.Valor === t.Valor && tx.Detalle === t.Detalle
        );

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-[#1f2633] transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">${formatDate(t.Fecha)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <div class="size-6 rounded-full ${memberData.color} flex items-center justify-center text-[10px] font-bold text-white">${memberData.initials}</div>
                        <span>${memberData.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap font-medium">${t.Detalle || t.Tipo}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="openEditCategoryModal(${globalIndex})" class="group inline-flex items-center gap-1 rounded-full ${catColors.bg} px-2.5 py-0.5 text-xs font-medium ${catColors.text} hover:ring-2 hover:ring-primary/50 transition-all">
                        ${t.Categoria || 'Otros'}
                        <span class="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                    </button>
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

    // Get all filter values
    const filters = getIngresosFilterValues();

    // Start with income-type transactions from all
    let ingresos = allTransactions.filter(t =>
        t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida' ||
        t.Tipo === 'Ingreso' || t.Tipo === 'Abono' || t.Tipo === 'Sueldo' || t.Tipo === 'Salario'
    );

    // Apply advanced filters
    ingresos = filterByAdvancedCriteria(ingresos, filters);

    // Calculate total for filtered income
    const totalFiltered = ingresos.reduce((sum, t) => sum + (parseFloat(t.Valor) || 0), 0);
    const totalElement = document.getElementById('ingresos-filtered-total');
    if (totalElement) {
        totalElement.textContent = formatCurrency(totalFiltered);
    }

    // Sort by date descending
    ingresos.sort((a, b) => parseDateString(b.Fecha) - parseDateString(a.Fecha));

    // Pagination
    pagination.ingresos.total = ingresos.length;
    const start = (pagination.ingresos.page - 1) * pagination.ingresos.perPage;
    const pageData = ingresos.slice(start, start + pagination.ingresos.perPage);

    tbody.innerHTML = pageData.map((t, pageIndex) => {
        const sourceColors = CONFIG.CATEGORY_COLORS[t.Categoria] || CONFIG.CATEGORY_COLORS['Sueldo'];
        // Buscar miembro real de la transacción
        const memberData = CONFIG.FAMILY_MEMBERS.find(m => m.id === t.Miembro) ||
            { id: t.Miembro || 'N/A', name: t.Miembro || 'N/A', initials: (t.Miembro || '?')[0].toUpperCase(), color: 'bg-gray-500' };
        // Calcular índice global en allTransactions
        const globalIndex = allTransactions.findIndex(tx =>
            tx.Fecha === t.Fecha && tx.Valor === t.Valor && tx.Detalle === t.Detalle
        );

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-[#232936] transition-colors">
                <td class="py-4 px-6 text-sm font-medium whitespace-nowrap">${formatDate(t.Fecha)}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <div class="size-8 rounded-full ${memberData.color} flex items-center justify-center text-xs font-bold text-white">${memberData.initials}</div>
                        <div class="text-sm font-medium">${memberData.name}</div>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <button onclick="openEditCategoryModal(${globalIndex})" class="group inline-flex items-center gap-1 rounded-full ${sourceColors.bg} px-2.5 py-0.5 text-xs font-medium ${sourceColors.text} hover:ring-2 hover:ring-primary/50 transition-all">
                        ${t.Categoria || t.Tipo}
                        <span class="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                    </button>
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
    const member = document.getElementById('upload-member')?.value;

    if (!member) {
        showNotification('Por favor selecciona un miembro de la familia', 'warning');
        return;
    }

    console.log(`📁 Processing file: ${file.name} for member: ${member}`);

    // Add to upload history (processing state)
    addUploadHistory(file.name, 'Detectando...', member, 'processing');

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
            throw new Error('El archivo está vacío o no tiene datos');
        }

        // Get header row (first row)
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        console.log('📋 Headers found:', headers);

        // Map common column names (including banco)
        const columnMap = {
            fecha: headers.findIndex(h => h.includes('fecha') || h.includes('date')),
            tipo: headers.findIndex(h => h.includes('tipo') || h.includes('type') || h.includes('naturaleza') || h.includes('movimiento')),
            valor: headers.findIndex(h => h.includes('valor') || h.includes('monto') || h.includes('amount') || h.includes('importe')),
            categoria: headers.findIndex(h => h.includes('categoria') || h.includes('category')),
            detalle: headers.findIndex(h => h.includes('detalle') || h.includes('descripcion') || h.includes('description') || h.includes('concepto')),
            producto: headers.findIndex(h => h.includes('producto') || h.includes('cuenta') || h.includes('product')),
            banco: headers.findIndex(h => h.includes('banco') || h.includes('bank') || h.includes('entidad'))
        };

        console.log('🗺️ Column mapping:', columnMap);

        // Process data rows (skip header)
        const newTransactions = [];
        const banksFound = new Set();

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            // Get values from mapped columns
            let fecha = columnMap.fecha >= 0 ? row[columnMap.fecha] : null;
            let valor = columnMap.valor >= 0 ? row[columnMap.valor] : 0;
            let tipo = columnMap.tipo >= 0 ? row[columnMap.tipo] : 'Otro';
            let categoria = columnMap.categoria >= 0 ? row[columnMap.categoria] : 'Otros';
            let detalle = columnMap.detalle >= 0 ? row[columnMap.detalle] : '';
            let producto = columnMap.producto >= 0 ? row[columnMap.producto] : '';
            let banco = columnMap.banco >= 0 ? row[columnMap.banco] : 'Sin banco';

            // Track banks found
            if (banco) banksFound.add(banco);

            // Parse date (handle Excel serial dates)
            if (typeof fecha === 'number') {
                const date = XLSX.SSF.parse_date_code(fecha);
                fecha = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else if (fecha) {
                // Use parseDateString to handle DD/MM/YYYY format correctly
                const parsedDate = parseDateString(fecha);
                if (!isNaN(parsedDate)) {
                    // Format manually as YYYY-MM-DD using local time to avoid timezone shifts
                    const y = parsedDate.getFullYear();
                    const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
                    const d = String(parsedDate.getDate()).padStart(2, '0');
                    fecha = `${y}-${m}-${d}`;
                }
            }

            // Parse value (remove currency symbols, commas, etc.)
            let rawValue = 0;
            if (typeof valor === 'string') {
                rawValue = parseFloat(valor.replace(/[^0-9.-]/g, '')) || 0;
            } else if (typeof valor === 'number') {
                rawValue = valor;
            }

            // Infer type from sign if strictly numerical and type is unknown
            if ((!tipo || tipo === 'Otro') && rawValue !== 0) {
                if (rawValue > 0) {
                    tipo = 'Depósito';
                } else {
                    tipo = 'Compra';
                }
            }

            valor = Math.abs(rawValue);

            // Only add if we have a valid date and value
            if (fecha && valor > 0) {
                newTransactions.push({
                    Fecha: fecha,
                    Tipo: tipo || 'Compra',
                    Valor: valor,
                    Categoria: categoria || 'Otros',
                    Banco: banco || 'Sin banco',
                    Detalle: detalle || '',
                    Producto: producto || '',
                    Miembro: member
                });
            }
        }

        console.log(`✅ Parsed ${newTransactions.length} transactions from Excel`);
        console.log(`🏦 Banks found: ${Array.from(banksFound).join(', ')}`);

        if (newTransactions.length === 0) {
            throw new Error('No se encontraron transacciones válidas en el archivo');
        }

        // Add to existing transactions
        allTransactions = [...allTransactions, ...newTransactions];

        // Save to localStorage for persistence
        saveTransactions();

        // Re-apply filters and render
        applyFilters();
        renderAll();

        // Update history to success with banks info
        const banksStr = Array.from(banksFound).join(', ') || 'N/A';
        addUploadHistory(file.name, banksStr, member, 'success');
        showNotification(`Se cargaron ${newTransactions.length} transacciones de ${banksStr}`, 'success');

    } catch (error) {
        console.error('Error processing file:', error);
        addUploadHistory(file.name, 'Error', member, 'error');
        showNotification(`Error al procesar archivo: ${error.message}`, 'error');
    }
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

// Parse date string handling DD/MM/YYYY format
function parseDateString(dateStr) {
    if (!dateStr) return new Date();

    // If it's already a Date object
    if (dateStr instanceof Date) return dateStr;

    // If it's specifically YYYY-MM-DD (no time), parse as local date to prevent timezone shift
    if (dateStr.length === 10 && dateStr.charAt(4) === '-' && dateStr.charAt(7) === '-') {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    // Other ISO formats (with time) can fall back to standard constructor
    if (dateStr.includes('T') || (dateStr.includes('-') && dateStr.indexOf('-') === 4)) {
        return new Date(dateStr);
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY format
    const separator = dateStr.includes('/') ? '/' : '-';
    const parts = dateStr.split(separator);

    if (parts.length === 3) {
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        const third = parseInt(parts[2], 10);

        // If first part > 12, assume DD/MM/YYYY (Spanish format)
        // If first part has 4 digits, assume YYYY/MM/DD
        if (parts[0].length === 4) {
            // YYYY/MM/DD format
            return new Date(first, second - 1, third);
        } else if (first > 12) {
            // DD/MM/YYYY format (Spanish)
            return new Date(third, second - 1, first);
        } else if (second > 12) {
            // MM/DD/YYYY format (American)
            return new Date(third, first - 1, second);
        } else {
            // Ambiguous - assume DD/MM/YYYY (Spanish format for Colombian context)
            return new Date(third, second - 1, first);
        }
    }

    // Fallback to default parsing
    return new Date(dateStr);
}

function formatDate(dateStr) {
    const date = parseDateString(dateStr);
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
// GASTOS & INGRESOS ADVANCED FILTERS
// =========================================
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function populateAdvancedFilters() {
    // Extract unique values from all transactions
    const years = [...new Set(allTransactions.map(t => parseDateString(t.Fecha).getFullYear()).filter(y => !isNaN(y)))].sort((a, b) => b - a);
    const months = [...new Set(allTransactions.map(t => parseDateString(t.Fecha).getMonth()).filter(m => !isNaN(m)))].sort((a, b) => a - b);
    const banks = [...new Set(allTransactions.map(t => t.Banco).filter(b => b && b !== '--'))];
    const categories = [...new Set(allTransactions.map(t => t.Categoria).filter(c => c))];

    // Populate Gastos filters
    populateSelect('filter-member-gastos', CONFIG.FAMILY_MEMBERS.map(m => ({ value: m.id, label: m.name })), 'Miembro: Todos');
    populateSelect('filter-month-gastos', months.map(m => ({ value: m, label: MONTHS_ES[m] })), 'Mes: Todos');
    populateSelect('filter-year-gastos', years.map(y => ({ value: y, label: y })), 'Año: Todos');
    populateSelect('filter-bank-gastos', banks.map(b => ({ value: b, label: b })), 'Banco: Todos');
    populateSelect('filter-category-gastos', categories.map(c => ({ value: c, label: c })), 'Categoría: Todas');

    // Populate Ingresos filters
    populateSelect('filter-member-ingresos', CONFIG.FAMILY_MEMBERS.map(m => ({ value: m.id, label: m.name })), 'Miembro: Todos');
    populateSelect('filter-month-ingresos', months.map(m => ({ value: m, label: MONTHS_ES[m] })), 'Mes: Todos');
    populateSelect('filter-year-ingresos', years.map(y => ({ value: y, label: y })), 'Año: Todos');
    populateSelect('filter-bank-ingresos', banks.map(b => ({ value: b, label: b })), 'Banco: Todos');
    populateSelect('filter-category-ingresos', categories.map(c => ({ value: c, label: c })), 'Fuente: Todas');

    // Populate Resumen filters
    populateSelect('filter-month-resumen', months.map(m => ({ value: m, label: MONTHS_ES[m] })), 'Mes: Todos');
    populateSelect('filter-year-resumen', years.map(y => ({ value: y, label: y })), 'Año: Todos');
}

function applyResumenFilters() {
    const monthFilter = document.getElementById('filter-month-resumen')?.value || 'all';
    const yearFilter = document.getElementById('filter-year-resumen')?.value || 'all';

    // Filter transactions based on selected month and year
    filteredTransactions = allTransactions.filter(t => {
        const date = parseDateString(t.Fecha);

        // Month filter
        if (monthFilter !== 'all' && date.getMonth() !== parseInt(monthFilter)) return false;

        // Year filter
        if (yearFilter !== 'all' && date.getFullYear() !== parseInt(yearFilter)) return false;

        // Member filter (from selectedMembers global)
        if (selectedMembers.length > 0 && !selectedMembers.includes(t.Miembro)) return false;

        return true;
    });

    // Re-render affected components
    renderKPIs();
    renderCharts();
    renderRecentTransactions();
    renderCategoryDonut();
    renderFamilyIncome();
    renderAccounts();
}

function populateSelect(selectId, options, defaultLabel) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="all">${defaultLabel}</option>` +
        options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
}

function applyGastosFilters() {
    renderGastosTable();
}

function applyIngresosFilters() {
    renderIngresosTable();
}

function clearGastosFilters() {
    document.getElementById('filter-member-gastos').value = 'all';
    document.getElementById('filter-month-gastos').value = 'all';
    document.getElementById('filter-year-gastos').value = 'all';
    document.getElementById('filter-bank-gastos').value = 'all';
    document.getElementById('filter-category-gastos').value = 'all';
    document.getElementById('search-gastos').value = '';
    applyGastosFilters();
    showNotification('Filtros de gastos limpiados', 'info');
}

function clearIngresosFilters() {
    document.getElementById('filter-member-ingresos').value = 'all';
    document.getElementById('filter-month-ingresos').value = 'all';
    document.getElementById('filter-year-ingresos').value = 'all';
    document.getElementById('filter-bank-ingresos').value = 'all';
    document.getElementById('filter-category-ingresos').value = 'all';
    applyIngresosFilters();
    showNotification('Filtros de ingresos limpiados', 'info');
}

function getGastosFilterValues() {
    return {
        member: document.getElementById('filter-member-gastos')?.value || 'all',
        month: document.getElementById('filter-month-gastos')?.value || 'all',
        year: document.getElementById('filter-year-gastos')?.value || 'all',
        bank: document.getElementById('filter-bank-gastos')?.value || 'all',
        category: document.getElementById('filter-category-gastos')?.value || 'all',
        search: document.getElementById('search-gastos')?.value?.toLowerCase()?.trim() || ''
    };
}

function getIngresosFilterValues() {
    return {
        member: document.getElementById('filter-member-ingresos')?.value || 'all',
        month: document.getElementById('filter-month-ingresos')?.value || 'all',
        year: document.getElementById('filter-year-ingresos')?.value || 'all',
        bank: document.getElementById('filter-bank-ingresos')?.value || 'all',
        category: document.getElementById('filter-category-ingresos')?.value || 'all'
    };
}

function filterByAdvancedCriteria(transactions, filters) {
    return transactions.filter(t => {
        const date = parseDateString(t.Fecha);

        // Member filter
        if (filters.member !== 'all' && t.Miembro !== filters.member) return false;

        // Month filter
        if (filters.month !== 'all' && date.getMonth() !== parseInt(filters.month)) return false;

        // Year filter
        if (filters.year !== 'all' && date.getFullYear() !== parseInt(filters.year)) return false;

        // Bank filter
        if (filters.bank !== 'all' && t.Banco !== filters.bank) return false;

        // Category filter
        if (filters.category !== 'all' && t.Categoria !== filters.category) return false;

        // Search filter
        if (filters.search) {
            const searchMatch = (t.Detalle || '').toLowerCase().includes(filters.search) ||
                (t.Categoria || '').toLowerCase().includes(filters.search) ||
                String(t.Valor).includes(filters.search);
            if (!searchMatch) return false;
        }

        return true;
    });
}

// =========================================
// MEMBER FILTER DROPDOWN
// =========================================
function initMemberFilter() {
    const container = document.getElementById('member-checkboxes');
    if (!container) return;

    // Populate checkboxes dynamically from CONFIG
    container.innerHTML = CONFIG.FAMILY_MEMBERS.map(member => `
        <label class="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-2 -m-1">
            <input type="checkbox" id="member-${member.id}" value="${member.id}" checked
                class="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                onchange="onMemberFilterChange('${member.id}')">
            <div class="flex items-center gap-2">
                <div class="size-6 rounded-full ${member.color} flex items-center justify-center text-[10px] font-bold text-white">${member.initials}</div>
                <span class="text-sm">${member.name}</span>
            </div>
        </label>
    `).join('');

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('member-dropdown');
        const btn = document.getElementById('member-filter-btn');
        if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

function toggleMemberDropdown() {
    const dropdown = document.getElementById('member-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function onMemberFilterChange(memberId) {
    const allCheckbox = document.getElementById('member-all');

    if (memberId === 'all') {
        // If "All" is checked, select all members
        if (allCheckbox.checked) {
            selectedMembers = [];
            CONFIG.FAMILY_MEMBERS.forEach(m => {
                const cb = document.getElementById(`member-${m.id}`);
                if (cb) cb.checked = true;
            });
        } else {
            // If "All" is unchecked, deselect all
            CONFIG.FAMILY_MEMBERS.forEach(m => {
                const cb = document.getElementById(`member-${m.id}`);
                if (cb) cb.checked = false;
            });
            selectedMembers = [];
        }
    } else {
        // Individual member checkbox changed
        const memberCheckbox = document.getElementById(`member-${memberId}`);
        if (memberCheckbox.checked) {
            // If checking and "All" was selected, need to switch to specific selection
            if (selectedMembers.length === 0) {
                // Was "All", now switching to specific
                selectedMembers = CONFIG.FAMILY_MEMBERS.map(m => m.id).filter(id => id !== memberId);
                selectedMembers.push(memberId);
            } else {
                selectedMembers.push(memberId);
            }
        } else {
            // Unchecking a member
            if (selectedMembers.length === 0) {
                // Was "All", now switching to all except this one
                selectedMembers = CONFIG.FAMILY_MEMBERS.map(m => m.id).filter(id => id !== memberId);
            } else {
                selectedMembers = selectedMembers.filter(id => id !== memberId);
            }
        }

        // Update "All" checkbox state
        const allSelected = CONFIG.FAMILY_MEMBERS.every(m => {
            const cb = document.getElementById(`member-${m.id}`);
            return cb && cb.checked;
        });
        const noneSelected = CONFIG.FAMILY_MEMBERS.every(m => {
            const cb = document.getElementById(`member-${m.id}`);
            return cb && !cb.checked;
        });

        if (allSelected) {
            allCheckbox.checked = true;
            selectedMembers = []; // Empty means all
        } else {
            allCheckbox.checked = false;
        }

        if (noneSelected) {
            // If none selected, default to all
            allCheckbox.checked = true;
            selectedMembers = [];
            CONFIG.FAMILY_MEMBERS.forEach(m => {
                const cb = document.getElementById(`member-${m.id}`);
                if (cb) cb.checked = true;
            });
            showNotification('Debe seleccionar al menos un miembro', 'warning');
        }
    }

    updateMemberFilterLabel();
    applyFilters();
    renderAll();
}

function updateMemberFilterLabel() {
    const label = document.getElementById('member-filter-label');
    if (!label) return;

    if (selectedMembers.length === 0) {
        label.textContent = 'Todos los Miembros';
    } else if (selectedMembers.length === 1) {
        const member = CONFIG.FAMILY_MEMBERS.find(m => m.id === selectedMembers[0]);
        label.textContent = member ? member.name : 'Un Miembro';
    } else {
        label.textContent = `${selectedMembers.length} Miembros`;
    }
}

// =========================================
// TOAST NOTIFICATIONS
// =========================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl ${colors[type]} text-white shadow-lg transform translate-x-full opacity-0 transition-all duration-300`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${icons[type]}</span>
        <span class="text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors">
            <span class="material-symbols-outlined text-sm">close</span>
        </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// =========================================
// EDIT CATEGORY MODAL
// =========================================
function openEditCategoryModal(transactionIndex) {
    const modal = document.getElementById('modal-edit-category');
    const transaction = allTransactions[transactionIndex];

    if (!modal || !transaction) {
        console.error('No se pudo abrir modal', { transactionIndex, transaction });
        return;
    }

    // Set hidden index
    document.getElementById('edit-transaction-index').value = transactionIndex;

    // Set transaction info
    document.getElementById('edit-transaction-detail').textContent = transaction.Detalle || transaction.Tipo || 'Sin detalle';
    document.getElementById('edit-transaction-valor').textContent = formatCurrency(Math.abs(parseFloat(transaction.Valor) || 0));

    // Set current category in select
    const select = document.getElementById('edit-category-select');
    const currentCategory = transaction.Categoria || '';

    // Check if current category exists in options
    const optionExists = Array.from(select.options).some(opt => opt.value === currentCategory);
    if (optionExists) {
        select.value = currentCategory;
    } else if (currentCategory) {
        // Add as custom option
        const customOption = document.createElement('option');
        customOption.value = currentCategory;
        customOption.textContent = currentCategory;
        select.insertBefore(customOption, select.querySelector('option[value="__nueva__"]'));
        select.value = currentCategory;
    }

    // Reset new category input
    document.getElementById('new-category-container').classList.add('hidden');
    document.getElementById('new-category-input').value = '';

    // Show modal
    modal.classList.remove('hidden');
}

function closeEditCategoryModal() {
    const modal = document.getElementById('modal-edit-category');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function onCategorySelectChange() {
    const select = document.getElementById('edit-category-select');
    const newCategoryContainer = document.getElementById('new-category-container');

    if (select.value === '__nueva__') {
        newCategoryContainer.classList.remove('hidden');
        document.getElementById('new-category-input').focus();
    } else {
        newCategoryContainer.classList.add('hidden');
    }
}

function saveEditCategory() {
    const indexStr = document.getElementById('edit-transaction-index').value;
    const index = parseInt(indexStr, 10);
    const select = document.getElementById('edit-category-select');
    const newCategoryInput = document.getElementById('new-category-input');

    let newCategory = select.value;

    // If new category option selected, use the input value
    if (newCategory === '__nueva__') {
        newCategory = newCategoryInput.value.trim();
        if (!newCategory) {
            showNotification('Por favor ingresa una categoría', 'warning');
            return;
        }
    }

    if (!newCategory) {
        showNotification('Por favor selecciona una categoría', 'warning');
        return;
    }

    // Update transaction
    if (allTransactions[index]) {
        allTransactions[index].Categoria = newCategory;
        saveTransactions();
        applyFilters();
        renderAll();
        closeEditCategoryModal();
        showNotification(`Categoría actualizada a "${newCategory}"`, 'success');
    } else {
        showNotification('Error al actualizar la categoría', 'error');
    }
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
