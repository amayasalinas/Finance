// =========================================
// APP - Finanzas Familiares Dashboard
// =========================================

// Global STATE
let allTransactions = [];
let filteredTransactions = []; // For current view
let currentView = 'resumen';
let currentFamilyMembers = []; // Dynamic members from DB
let charts = {};
let selectedMembers = []; // Empty means all members selected
let pagination = {
    gastos: { page: 1, perPage: CONFIG.ITEMS_PER_PAGE, total: 0 },
    ingresos: { page: 1, perPage: CONFIG.ITEMS_PER_PAGE, total: 0 }
};

// Supabase Configuration
const SUPABASE_URL = "https://iikarklhudhsfvkhhyub.supabase.co";
const SUPABASE_KEY = "sb_publishable_PIdI08dSRTLPVauDLxX6Hg_yMEsxwU-";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================================
// INITIALIZATION
// =========================================
async function initApp() {
    console.log('🚀 Initializing App...');

    // 1. Fetch Family Members first
    await fetchFamilyMembers();

    // 2. Load Data
    await loadData();

    // 3. Setup UI
    setupNavigation();
    setupFilters();
    setupFileUpload();
    initMemberFilter(); // This now uses currentFamilyMembers

    // 4. Setup Realtime
    setupRealtime();

    // 5. Initial Render
    renderAll();
}

// FAMILY MEMBERS MANAGEMENT
// =========================================
async function fetchFamilyMembers() {
    const familyId = getCurrentFamilyId();
    console.log(`Pb Fetching members for family: ${familyId} `);

    try {
        const { data, error } = await supabaseClient
            .from('family_members')
            .select('*')
            .eq('family_id', familyId)
        //.eq('active', true); // Optional: if you implement soft delete

        if (error) throw error;

        if (data && data.length > 0) {
            currentFamilyMembers = data;
            console.log('✅ Members loaded:', currentFamilyMembers);
            updateMemberDropdowns(); // Update UI dropdowns
        } else {
            console.warn('⚠️ No members found for this family. Triggering setup.');
            currentFamilyMembers = [];
            showSetupModal();
        }

    } catch (err) {
        console.error('Error fetching members:', err);
        showNotification('Error cargando miembros de la familia', 'error');
    }
}

// REALTIME UPDATES
// =========================================
function setupRealtime() {
    const familyId = getCurrentFamilyId();
    console.log('📡 Setting up Realtime subscription for family:', familyId);

    const subscription = supabaseClient
        .channel('public:movimientos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'movimientos' }, payload => {
            console.log('🔔 Realtime change received:', payload);

            // Check if change belongs to current family
            const record = payload.new || payload.old;
            if (record && record.family_id === familyId) {
                console.log('🔄 Refreshing data due to remote change...');
                showNotification('Sincronizando cambios detectados...', 'success');
                loadData(true); // Silent reload
            }
        })
        .subscribe((status) => {
            console.log('📡 Realtime status:', status);
        });
}

function showSetupModal() {
    const modal = document.getElementById('modal-setup-members');
    if (modal) modal.classList.remove('hidden');
}

function addMemberInput() {
    const container = document.getElementById('setup-members-list');
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `
    <input type = "text" placeholder = "Nombre" class="flex-1 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#111827] text-sm">
        <select class="rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#111827] text-sm">
            <option value="bg-blue-500">Azul</option>
            <option value="bg-purple-500">Morado</option>
            <option value="bg-green-500">Verde</option>
            <option value="bg-orange-500">Naranja</option>
            <option value="bg-pink-500">Rosa</option>
            <option value="bg-red-500">Rojo</option>
        </select>
`;
    container.appendChild(div);
}

async function saveInitialMembers() {
    const container = document.getElementById('setup-members-list');
    const rows = container.querySelectorAll('div.flex');
    const newMembers = [];
    const familyId = getCurrentFamilyId();

    rows.forEach(row => {
        const name = row.querySelector('input').value.trim();
        const color = row.querySelector('select').value;
        if (name) {
            newMembers.push({
                family_id: familyId,
                name: name,
                initials: name.charAt(0).toUpperCase(),
                color: color
            });
        }
    });

    if (newMembers.length === 0) {
        alert('Por favor agrega al menos un miembro');
        return;
    }

    try {
        const { data, error } = await supabaseClient.from('family_members').insert(newMembers).select();
        if (error) throw error;

        currentFamilyMembers = data;
        document.getElementById('modal-setup-members').classList.add('hidden');
        showNotification('¡Familia configurada correctamente!', 'success');
        updateMemberDropdowns(); // Refresh UI

        // Reload data just in case
        await loadData();

    } catch (err) {
        console.error('Error saving members:', err);
        alert('Error guardando miembros: ' + err.message);
    }
}

function updateMemberDropdowns() {
    // 1. Update Filter Dropdown (Resumen & Gastos & Ingresos)
    initMemberFilter(); // Resumen member filter

    const updateSelect = (id) => {
        const select = document.getElementById(id);
        if (!select) return;
        // Keep first option (All/Label)
        const first = select.firstElementChild;
        select.innerHTML = '';
        if (first) select.appendChild(first);

        currentFamilyMembers.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id; // Now using UUID from DB
            opt.textContent = m.name;
            select.appendChild(opt);
        });
    };

    updateSelect('filter-member-gastos');
    updateSelect('filter-member-ingresos');
    updateSelect('upload-member');
}


// Load data from localStorage (primary) or JSON file (fallback)
// Load data from Supabase
// DATA HANDLING
// =========================================
async function loadData(silent = false) {
    try {
        if (!silent) console.log('📥 Fetching data from Supabase...');
        const familyId = getCurrentFamilyId();

        // Filter by FAMILY ID
        const { data, error } = await supabaseClient
            .from('movimientos')
            .select('*')
            .eq('family_id', familyId);

        if (error) throw error;

        if (data) {
            // Normalize data keys (DB is snake_case, App uses PascalCase)
            allTransactions = data.map(t => ({
                id: t.id, // Keep ID for updates
                Fecha: t.fecha,
                Tipo: t.tipo,
                Valor: typeof t.valor === 'string' ? parseFloat(t.valor.replace(/\./g, '').replace(',', '.')) : (t.valor || 0),
                Categoria: t.categoria || 'Otros',
                Banco: t.banco || '--',
                Detalle: t.detalle || '',
                Producto: t.producto || '',
                NumeroProducto: t.numero_producto || '',
                Miembro: t.miembro || ''
            }));
            if (!silent) console.log(`📊 Loaded ${allTransactions.length} transactions from Supabase for family: ${familyId}`);
        }

    } catch (error) {
        console.error('Error loading data from Supabase:', error);
        showNotification('Error cargando datos: ' + error.message, 'error');
        allTransactions = [];
    }

    // Initialize filteredTransactions with all data (before filters are applied)
    filteredTransactions = allTransactions;

    renderAll();
}

// Save transactions is now handled via direct DB updates
function saveTransactions() {
    // Deprecated for bulk saves, use specific update functions
    console.warn('saveTransactions is deprecated. Use direct Supabase calls.');
}

// =========================================
// NAVIGATION
// =========================================// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    // Toggle mobile menu
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });
    }

    // Desktop navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            navigateTo(targetView);

            // Update active state
            navLinks.forEach(l => l.classList.remove('text-primary'));
            navLinks.forEach(l => l.classList.add('text-slate-600', 'dark:text-slate-300'));
            link.classList.add('text-primary');
            link.classList.remove('text-slate-600', 'dark:text-slate-300');
        });
    });

    // Mobile navigation
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            navigateTo(targetView);

            // Close mobile menu
            if (mobileNav) {
                mobileNav.classList.add('hidden');
            }

            // Update active state for mobile links
            mobileNavLinks.forEach(l => {
                l.classList.remove('text-primary', 'font-medium');
                l.classList.add('text-slate-600', 'dark:text-slate-300');
            });
            link.classList.add('text-primary', 'font-medium');
            link.classList.remove('text-slate-600', 'dark:text-slate-300');

            // Update desktop nav as well
            navLinks.forEach(l => {
                l.classList.remove('text-primary');
                l.classList.add('text-slate-600', 'dark:text-slate-300');
            });
            const desktopLink = Array.from(navLinks).find(l => l.getAttribute('data-view') === targetView);
            if (desktopLink) {
                desktopLink.classList.add('text-primary');
                desktopLink.classList.remove('text-slate-600', 'dark:text-slate-300');
            }
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

    // Hide all sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`section-${view}`);
    if (targetSection) {
        targetSection.classList.add('active');

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Re-render if switching views that need fresh data
        if (view === 'gastos') renderGastosTable();
        else if (view === 'ingresos') renderIngresosTable();
    }
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

    // Include Abono TC Toggle
    const includeAbonoCheck = document.getElementById('include-abono-check');
    if (includeAbonoCheck) {
        includeAbonoCheck.addEventListener('change', () => {
            // Force re-render of all relevant sections
            renderKPIs();
            renderGastosTable();
            renderDailyExpensesChart();
            renderCategoryDonut();
            renderIncomeVsExpensesChart();
            fetchAIRecommendations();
        });
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

    // Map selectedMembers (which are member IDs) to a set for quick lookup
    const selectedMemberIds = new Set(selectedMembers);

    filteredTransactions = allTransactions.filter(t => {
        const date = new Date(t.Fecha);
        const dateInRange = date >= startDate && date <= endDate;

        // Filter by members if specific members are selected
        // If selectedMembers is empty, it means "all members" are selected.
        const memberMatch = selectedMemberIds.size === 0 || selectedMemberIds.has(t.Miembro);

        // Fallback for legacy data where Miembro might be a name string instead of an ID
        // This checks if the transaction's Miembro (name or ID) corresponds to any of the selected members.
        const legacyMemberMatch = selectedMemberIds.size === 0 || currentFamilyMembers.some(m =>
            selectedMemberIds.has(m.id) && (m.id === t.Miembro || m.name.toLowerCase() === (t.Miembro || '').toLowerCase())
        );

        return dateInRange && (memberMatch || legacyMemberMatch);
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
    // Include all common expense types (including Abono - credit card payments)
    // Include all common expense types (including Abono - credit card payments)
    const gastos = filteredTransactions.filter(t => {
        const includeAbonoTC = document.getElementById('include-abono-check')?.checked ?? false;

        const isExpenseType = t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
            t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo'; // Removed 'Abono' from here to control it via toggle

        // Check for Abono (Credit Card Payment) but EXCLUDE Interest/Yields
        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isAbonoPayment = hasAbonoKeyword && !isInterest;

        return isExpenseType || (includeAbonoTC && isAbonoPayment);
    });

    // Include all common income types (Abono excluded - TC payments are not income)
    const ingresos = filteredTransactions.filter(t => {
        // Base income types
        const isIncomeType = t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida' ||
            t.Tipo === 'Ingreso' || t.Tipo === 'Sueldo' || t.Tipo === 'Salario';

        // STRICT EXCLUSION: Any reference to Abono matches here
        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        // It is a credit card payment (to exclude) ONLY if it says Abono AND is NOT interest
        const isCreditCardPayment = hasAbonoKeyword && !isInterest;

        // Must be income type AND NOT a credit card payment
        return isIncomeType && !isCreditCardPayment;
    });

    const totalGastos = gastos.reduce((sum, t) => sum + (parseFloat(t.Valor) || 0), 0);
    const totalIngresos = ingresos.reduce((sum, t) => sum + (parseFloat(t.Valor) || 0), 0);
    const balance = totalIngresos - totalGastos;

    // Update KPI values
    const kpiBalance = document.getElementById('kpi-balance');
    const kpiIncome = document.getElementById('kpi-income');
    const kpiExpenses = document.getElementById('kpi-expenses');

    if (kpiBalance) kpiBalance.textContent = formatCurrency(balance);
    if (kpiIncome) kpiIncome.textContent = formatCurrency(totalIngresos);
    if (kpiExpenses) kpiExpenses.textContent = formatCurrency(totalGastos);

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
    if (topCatEl) {
        if (topCategory && topCategory[1] > 0) {
            topCatEl.textContent = `${topCategory[0]} (${formatCurrency(topCategory[1])})`;
        } else {
            topCatEl.textContent = 'Sin datos';
        }
    }

    // Update ingresos view stats
    const ingresosTotal = document.getElementById('ingresos-total-stat');
    if (ingresosTotal) ingresosTotal.textContent = formatCurrency(totalIngresos);

    // Update promedio por miembro
    const promedioPorMiembro = document.getElementById('ingresos-avg-per-member');
    if (promedioPorMiembro) {
        const memberCount = currentFamilyMembers.length || 1;
        promedioPorMiembro.textContent = formatCurrency(totalIngresos / memberCount);
    }
}

// Charts
function renderCharts() {
    renderIncomeVsExpensesChart();
    renderIncomeMembersChart();
}

// Income Members Donut Chart
function renderIncomeMembersChart() {
    const canvas = document.getElementById('chart-income-members');
    const legendContainer = document.getElementById('income-members-legend');
    if (!canvas || !legendContainer) return;

    const ctx = canvas.getContext('2d');

    // Filter income transactions
    const ingresos = filteredTransactions.filter(t => {
        const isIncomeType = t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida' ||
            t.Tipo === 'Ingreso' || t.Tipo === 'Sueldo' || t.Tipo === 'Salario';

        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isCreditCardPayment = hasAbonoKeyword && !isInterest;

        return isIncomeType && !isCreditCardPayment;
    });

    // Group by member
    const memberTotals = {};
    ingresos.forEach(t => {
        const memberId = t.Miembro || 'Desconocido';
        if (!memberTotals[memberId]) memberTotals[memberId] = 0;
        memberTotals[memberId] += Math.abs(parseFloat(t.Valor) || 0);
    });

    // Convert member IDs to names for labels
    const memberIds = Object.keys(memberTotals);
    const labels = memberIds.map(memberId => {
        const memberData = currentFamilyMembers.find(m =>
            m.id === memberId || m.name.toLowerCase() === memberId.toLowerCase()
        );
        return memberData ? memberData.name : memberId;
    });

    const data = Object.values(memberTotals);
    const total = data.reduce((sum, val) => sum + val, 0);

    // Get member colors
    const colors = memberIds.map(memberId => {
        const memberData = currentFamilyMembers.find(m =>
            m.id === memberId || m.name.toLowerCase() === memberId.toLowerCase()
        );
        // Extract color from Tailwind class
        const colorMap = {
            'bg-blue-500': 'rgba(59, 130, 246, 0.8)',
            'bg-green-500': 'rgba(34, 197, 94, 0.8)',
            'bg-purple-500': 'rgba(168, 85, 247, 0.8)',
            'bg-orange-500': 'rgba(249, 115, 22, 0.8)',
            'bg-pink-500': 'rgba(236, 72, 153, 0.8)',
            'bg-gray-400': 'rgba(156, 163, 175, 0.8)'
        };
        return memberData ? (colorMap[memberData.color] || 'rgba(156, 163, 175, 0.8)') : 'rgba(156, 163, 175, 0.8)';
    });

    // Destroy previous chart
    if (charts['income-members']) {
        charts['income-members'].destroy();
    }

    // Create donut chart
    charts['income-members'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });

    // Render custom legend (without percentage)
    legendContainer.innerHTML = memberIds.map((memberId, index) => {
        const value = data[index];
        const memberData = currentFamilyMembers.find(m =>
            m.id === memberId || m.name.toLowerCase() === memberId.toLowerCase()
        ) || { name: memberId, initials: memberId[0]?.toUpperCase() || '?', color: 'bg-gray-400' };

        return `
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <div class="size-3 rounded-full ${memberData.color}"></div>
                    <span class="text-sm font-medium">${memberData.name}</span>
                </div>
                <span class="text-sm font-bold">${formatCurrency(value)}</span>
            </div>
        `;
    }).join('');
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
        const monthKey = `${date.getFullYear()} -${String(date.getMonth() + 1).padStart(2, '0')} `;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        const value = Math.abs(parseFloat(t.Valor) || 0);
        // Income types (must match renderKPIs and table logic)
        // Note: 'Abono' removed as TC payments are not income
        const isIncomeType = t.Tipo === 'Depósito' ||
            t.Tipo === 'Transferencia Recibida' ||
            t.Tipo === 'Ingreso' ||
            t.Tipo === 'Sueldo' ||
            t.Tipo === 'Salario';

        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isCreditCardPayment = hasAbonoKeyword && !isInterest;

        const isIncome = isIncomeType && !isCreditCardPayment;

        if (isIncome) {
            monthlyData[monthKey].income += value;
        } else {
            // Expenses: Check toggle
            const includeAbonoTC = document.getElementById('include-abono-check')?.checked ?? false;

            // Check if it is a valid expense
            const isExpenseType = t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
                t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo';

            // It is an expense if it is standard expense OR (it is Abono Payment AND we want to include it)
            if (isExpenseType || (includeAbonoTC && isCreditCardPayment)) {
                monthlyData[monthKey].expenses += value;
            }
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

// Daily Expenses Chart
function renderDailyExpensesChart(expenseData = null) {
    const ctx = document.getElementById('chart-daily-expenses');
    if (!ctx) return;

    // Destroy existing chart
    if (charts.dailyExpenses) {
        charts.dailyExpenses.destroy();
    }

    // Use provided data or filter from global filteredTransactions
    // Use provided data or filter from global filteredTransactions
    const expenses = expenseData || filteredTransactions.filter(t => {
        const includeAbonoTC = document.getElementById('include-abono-check')?.checked ?? false;

        const isExpenseType = t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
            t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo';

        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isAbonoPayment = hasAbonoKeyword && !isInterest;

        return isExpenseType || (includeAbonoTC && isAbonoPayment);
    });

    // Group by date (day level)
    const dailyData = {};
    expenses.forEach(t => {
        const dateKey = t.Fecha; // Already in YYYY-MM-DD format
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = 0;
        }
        dailyData[dateKey] += Math.abs(parseFloat(t.Valor) || 0);
    });

    // Sort dates and prepare data
    const sortedDates = Object.keys(dailyData).sort();
    const labels = sortedDates.map(d => {
        const date = new Date(d + 'T00:00:00'); // Avoid timezone issues
        return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    });
    const data = sortedDates.map(d => dailyData[d]);

    charts.dailyExpenses = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Gastos',
                data,
                borderColor: CONFIG.CHART_COLORS.danger,
                backgroundColor: CONFIG.CHART_COLORS.danger + '20',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Gasto: ${formatCurrency(context.parsed.y)} `
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, minRotation: 45 }
                },
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

    const gastos = filteredTransactions.filter(t => {
        // In Resumen view, we don't include Abono TC by default
        // This matches the default behavior of Gastos view (checkbox unchecked)
        const isExpenseType = t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
            t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo';

        // We explicitly exclude Abono TC payments from Resumen's category donut
        return isExpenseType;
    });
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

    const ingresos = filteredTransactions.filter(t => {
        const isIncomeType = t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida';

        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isCreditCardPayment = hasAbonoKeyword && !isInterest;

        return isIncomeType && !isCreditCardPayment;
    });
    const totalIncome = ingresos.reduce((sum, t) => sum + Math.abs(parseFloat(t.Valor) || 0), 0);

    // Distribute total income among currentFamilyMembers for display purposes
    const familyData = currentFamilyMembers.map((member, index) => {
        // Simple distribution for demo, in real app this would be tracked per member
        const incomeShare = totalIncome * (index === 0 ? 0.55 : 0.45); // Example distribution
        const goalShare = totalIncome * (index === 0 ? 0.6 : 0.5); // Example goal
        return { member, income: incomeShare, goal: goalShare };
    });

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

    // Group by Bank + Member to show member ownership
    const accountBalances = {};
    filteredTransactions.forEach(t => {
        const bank = t.Banco || 'Otro';
        const member = t.Miembro || 'Desconocido';
        const key = `${bank}|${member}`; // Unique key per bank+member
        const value = parseFloat(t.Valor) || 0;
        const isIncomeType = t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida';

        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isCreditCardPayment = hasAbonoKeyword && !isInterest;

        const isIncome = isIncomeType && !isCreditCardPayment;

        if (!accountBalances[key]) {
            accountBalances[key] = { bank, member, balance: 0 };
        }
        accountBalances[key].balance += (isIncome ? value : -value);
    });

    const accounts = Object.values(accountBalances).slice(0, 6);

    if (accounts.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-sm">No hay cuentas para mostrar</p>';
        return;
    }

    container.innerHTML = accounts.map(({ bank, member, balance }) => {
        // Find member data for color/initials
        const memberData = currentFamilyMembers.find(m =>
            m.id === member || m.name.toLowerCase() === member.toLowerCase()
        ) || { name: member, initials: member[0]?.toUpperCase() || '?', color: 'bg-gray-400' };

        return `
        <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#1c2333] hover:bg-slate-100 dark:hover:bg-[#232b3b] transition-colors cursor-pointer">
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                    <span class="material-symbols-outlined">account_balance</span>
                </div>
                <div>
                    <p class="font-medium">${bank}</p>
                    <div class="flex items-center gap-1.5">
                        <div class="size-4 rounded-full ${memberData.color} flex items-center justify-center">
                            <span class="text-[8px] font-bold text-white">${memberData.initials}</span>
                        </div>
                        <p class="text-xs text-slate-500">${memberData.name}</p>
                    </div>
                </div>
            </div>
            <span class="font-bold ${balance >= 0 ? 'text-secondary' : 'text-danger'}">${formatCurrency(balance)}</span>
        </div>
    `;
    }).join('');
}

// Gastos Table
function renderGastosTable() {
    const tbody = document.getElementById('table-gastos-body');
    if (!tbody) return;

    // Get all filter values
    const filters = getGastosFilterValues();

    // Start with expense-type transactions from all (not just filtered by global period)
    // Start with expense-type transactions from all (not just filtered by global period)
    let gastos = allTransactions.filter(t => {
        const includeAbonoTC = document.getElementById('include-abono-check')?.checked ?? false;

        const isExpenseType = t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
            t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo';

        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        // Robust interest check
        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isAbonoPayment = hasAbonoKeyword && !isInterest;

        return isExpenseType || (includeAbonoTC && isAbonoPayment);
    });

    // Apply advanced filters
    gastos = filterByAdvancedCriteria(gastos, filters);

    // Calculate total for filtered expenses
    const totalFiltered = gastos.reduce((sum, t) => sum + (parseFloat(t.Valor) || 0), 0);
    const totalElement = document.getElementById('gastos-filtered-total');
    if (totalElement) {
        totalElement.textContent = formatCurrency(totalFiltered);
    }

    // Update KPI cards
    const totalStatEl = document.getElementById('gastos-total-stat');
    if (totalStatEl) {
        totalStatEl.textContent = formatCurrency(totalFiltered);
    }

    // Find top category
    const categoryTotals = {};
    gastos.forEach(t => {
        const cat = t.Categoria || 'Otros';
        if (!categoryTotals[cat]) categoryTotals[cat] = 0;
        categoryTotals[cat] += parseFloat(t.Valor) || 0;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const topCatEl = document.getElementById('gastos-top-category');
    if (topCatEl && topCategory) {
        topCatEl.textContent = topCategory[0];
    }

    // Calculate daily average
    const uniqueDates = [...new Set(gastos.map(t => t.Fecha))];
    const dailyAvg = uniqueDates.length > 0 ? totalFiltered / uniqueDates.length : 0;
    const dailyAvgEl = document.getElementById('gastos-daily-avg');
    if (dailyAvgEl) {
        dailyAvgEl.textContent = formatCurrency(dailyAvg);
    }

    // Render daily expenses chart with current filtered data
    renderDailyExpensesChart(gastos);

    // Sort by date descending
    gastos.sort((a, b) => parseDateString(b.Fecha) - parseDateString(a.Fecha));

    // Pagination
    pagination.gastos.total = gastos.length;
    const start = (pagination.gastos.page - 1) * pagination.gastos.perPage;
    const pageData = gastos.slice(start, start + pagination.gastos.perPage);

    tbody.innerHTML = pageData.map((t, pageIndex) => {
        const catColors = CONFIG.CATEGORY_COLORS[t.Categoria] || CONFIG.CATEGORY_COLORS['Otros'];
        // Find Dynamic Member
        const memberData = currentFamilyMembers.find(m => m.id === t.Miembro || m.name.toLowerCase() === (t.Miembro || '').toLowerCase()) ||
            { id: '?', name: t.Miembro || 'Desc.', initials: (t.Miembro || '?')[0].toUpperCase(), color: 'bg-gray-400' };

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

    // Start with income-type transactions from all (Abono excluded - TC payments are not income)
    let ingresos = allTransactions.filter(t => {
        const isIncomeType = t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida' ||
            t.Tipo === 'Ingreso' || t.Tipo === 'Sueldo' || t.Tipo === 'Salario';
        // Exclude any transaction with 'Abono' in Tipo, Categoria, or Detalle
        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        // It is a credit card payment (to exclude) ONLY if it says Abono AND is NOT interest
        const isCreditCardPayment = hasAbonoKeyword && !isInterest;

        return isIncomeType && !isCreditCardPayment;
    });

    // Apply advanced filters
    ingresos = filterByAdvancedCriteria(ingresos, filters);

    // Calculate total for filtered income
    const totalFiltered = ingresos.reduce((sum, t) => sum + (parseFloat(t.Valor) || 0), 0);
    const totalElement = document.getElementById('ingresos-filtered-total');
    if (totalElement) {
        totalElement.textContent = formatCurrency(totalFiltered);
    }

    // Update KPI cards
    const totalStatEl = document.getElementById('ingresos-total-stat');
    if (totalStatEl) {
        totalStatEl.textContent = formatCurrency(totalFiltered);
    }

    // Calculate average per member
    const memberTotals = {};
    ingresos.forEach(t => {
        const member = t.Miembro || 'Desconocido';
        if (!memberTotals[member]) memberTotals[member] = 0;
        memberTotals[member] += parseFloat(t.Valor) || 0;
    });
    const avgPerMember = Object.keys(memberTotals).length > 0
        ? totalFiltered / Object.keys(memberTotals).length
        : 0;
    const avgMemberEl = document.getElementById('ingresos-avg-member');
    if (avgMemberEl) {
        avgMemberEl.textContent = formatCurrency(avgPerMember);
    }

    // Find top source (category)
    const categoryTotals = {};
    ingresos.forEach(t => {
        const cat = t.Categoria || t.Tipo || 'Otros';
        if (!categoryTotals[cat]) categoryTotals[cat] = 0;
        categoryTotals[cat] += parseFloat(t.Valor) || 0;
    });
    const topSource = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const topSourceEl = document.getElementById('ingresos-top-source');
    if (topSourceEl && topSource) {
        topSourceEl.textContent = topSource[0];
    }

    // Sort by date descending
    ingresos.sort((a, b) => parseDateString(b.Fecha) - parseDateString(a.Fecha));

    // Pagination
    pagination.ingresos.total = ingresos.length;
    const start = (pagination.ingresos.page - 1) * pagination.ingresos.perPage;
    const pageData = ingresos.slice(start, start + pagination.ingresos.perPage);

    tbody.innerHTML = pageData.map((t, pageIndex) => {
        const sourceColors = CONFIG.CATEGORY_COLORS[t.Categoria] || CONFIG.CATEGORY_COLORS['Sueldo'];
        // Buscar miembro real de la transacción (Dinámico)
        const memberData = currentFamilyMembers.find(m => m.id === t.Miembro || m.name.toLowerCase() === (t.Miembro || '').toLowerCase()) ||
            { id: '?', name: t.Miembro || 'Desc.', initials: (t.Miembro || '?')[0].toUpperCase(), color: 'bg-gray-400' };
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

    // Update result count in filter bar
    const countEl = document.getElementById('ingresos-count');
    if (countEl) {
        countEl.textContent = `${ingresos.length} resultado${ingresos.length !== 1 ? 's' : ''}`;
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
    const gastos = filteredTransactions.filter(t => {
        const includeAbonoTC = document.getElementById('include-abono-check')?.checked ?? false;

        const isExpenseType = t.Tipo === 'Compra' || t.Tipo === 'Retiro' || t.Tipo === 'Débito' ||
            t.Tipo === 'Gasto' || t.Tipo === 'Pago' || t.Tipo === 'Cargo';

        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isAbonoPayment = hasAbonoKeyword && !isInterest;

        return isExpenseType || (includeAbonoTC && isAbonoPayment);
    });



    const ingresos = filteredTransactions.filter(t => {
        const isIncomeType = t.Tipo === 'Depósito' || t.Tipo === 'Transferencia Recibida';

        const hasAbonoKeyword = (t.Tipo && t.Tipo.toLowerCase().includes('abono')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('abono')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('abono'));

        const isInterest = (t.Tipo && t.Tipo.toLowerCase().includes('interes')) ||
            (t.Categoria && t.Categoria.toLowerCase().includes('interes')) ||
            (t.Detalle && t.Detalle.toLowerCase().includes('interes'));

        const isCreditCardPayment = hasAbonoKeyword && !isInterest;

        return isIncomeType && !isCreditCardPayment;
    });
    const totalGastos = gastos.reduce((sum, t) => sum + Math.abs(parseFloat(t.Valor) || 0), 0);
    const totalIngresos = ingresos.reduce((sum, t) => sum + Math.abs(parseFloat(t.Valor) || 0), 0);

    // Get top categories
    const categorySpend = {};
    gastos.forEach(t => {
        const cat = t.Categoria || 'Otros';
        categorySpend[cat] = (categorySpend[cat] || 0) + Math.abs(parseFloat(t.Valor) || 0);
    });
    const topCategories = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Calculate additional financial metrics for expert analysis
    const savingsRate = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos * 100).toFixed(1) : 0;
    const topCategoriesText = topCategories.map(([cat, val]) => {
        const percentage = totalGastos > 0 ? ((val / totalGastos) * 100).toFixed(1) : 0;
        return `${cat}: $${val.toLocaleString('es-CO')} (${percentage}%)`;
    }).join(', ');

    const prompt = `Actúa como un asesor financiero personal certificado (CFP) con más de 15 años de experiencia en planificación financiera familiar en Colombia.

CONTEXTO FINANCIERO DE LA FAMILIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Ingresos mensuales: $${totalIngresos.toLocaleString('es-CO')} COP
💳 Gastos mensuales: $${totalGastos.toLocaleString('es-CO')} COP
📊 Balance: $${(totalIngresos - totalGastos).toLocaleString('es-CO')} COP
📈 Tasa de ahorro: ${savingsRate}%

DISTRIBUCIÓN DE GASTOS POR CATEGORÍA:
${topCategoriesText}

TU OBJETIVO:
Analiza estas finanzas familiares con la profundidad de un experto y proporciona EXACTAMENTE 3 recomendaciones estratégicas y accionables.

CRITERIOS PARA TUS RECOMENDACIONES:
1. Sean ESPECÍFICAS y basadas en los datos reales presentados
2. Incluyan cifras concretas cuando sea relevante (ej: "Reduce gastos en X en $200.000")
3. Sean ACCIONABLES: que la familia pueda implementarlas esta semana
4. Prioricen por impacto financiero (enfócate en las categorías más altas)
5. Consideren el contexto colombiano (COP, inflación, ahorro típico)
6. Sean realistas y alcanzables para una familia promedio

FORMATO OBLIGATORIO:
Cada recomendación debe seguir este formato EXACTO:
[emoji relevante] **[Título corto y específico]:** [Explicación de 1-2 líneas con acción concreta]

TONO:
- Profesional pero cercano
- Directo y sin rodeos
- Empático con la realidad financiera familiar
- Optimista pero realista

PROHIBIDO:
❌ Recomendaciones genéricas como "ahorra más"
❌ Usar frases vagas sin cifras
❌ Consejos que no se basen en los datos
❌ Recomendaciones imposibles de implementar

Responde SOLO con las 3 recomendaciones numeradas (1., 2., 3.), sin introducción ni conclusión.`;

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

    console.log(`📁 Processing file: ${file.name} for member: ${member} `);

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
                // Handle LatAm format: 1.000,00 -> 1000.00
                // 1. Remove dots (thousands)
                // 2. Replace comma with dot (decimal)
                let clean = valor.replace(/\./g, '').replace(',', '.');
                rawValue = parseFloat(clean.replace(/[^0-9.-]/g, '')) || 0;
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

            // Normalize Income types (excluding 'abono' - TC payments are not income)
            if (tipo) {
                const lower = String(tipo).toLowerCase();
                if (lower.includes('crédito') || lower.includes('credito') || lower.includes('entrada') || lower.includes('recibida') || lower.includes('recaudo')) {
                    tipo = 'Depósito';
                }
            }

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
        console.log(`🏦 Banks found: ${Array.from(banksFound).join(', ')} `);

        if (newTransactions.length === 0) {
            throw new Error('No se encontraron transacciones válidas en el archivo');
        }

        // Add to existing transactions
        // Save to Supabase

        // Prepare payload for Supabase (snake_case)
        const payload = newTransactions.map(t => ({
            fecha: t.Fecha,
            tipo: t.Tipo,
            valor: t.Valor,
            categoria: t.Categoria,
            banco: t.Banco,
            detalle: t.Detalle,
            producto: t.Producto,
            numero_producto: t.NumeroProducto,
            miembro: t.Miembro,
            family_id: getCurrentFamilyId() // Add Family ID
        }));

        console.log('📤 Uploading to Supabase...', payload.length);

        // Upload in batches of 100
        const batchSize = 100;
        for (let i = 0; i < payload.length; i += batchSize) {
            const batch = payload.slice(i, i + batchSize);
            const { error } = await supabaseClient.from('movimientos').insert(batch);
            if (error) throw error;
        }

        // Re-load data from server to get persistent state (and IDs)
        await loadData();

        // Update history to success with banks info
        const banksStr = Array.from(banksFound).join(', ') || 'N/A';
        addUploadHistory(file.name, banksStr, member, 'success');
        showNotification(`Se cargaron ${newTransactions.length} transacciones de ${banksStr} y se sincronizaron con la nube`, 'success');

    } catch (error) {
        console.error('Error processing file:', error);
        addUploadHistory(file.name, 'Error', member, 'error');
        showNotification(`Error al procesar archivo: ${error.message} `, 'error');
    }
}

function addUploadHistory(filename, bank, memberId, status) {
    const tbody = document.getElementById('upload-history-body');
    if (!tbody) return;

    const statusBadge = {
        processing: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"><span class="size-1.5 rounded-full bg-blue-500 animate-pulse"></span>Procesando</span>',
        success: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"><span class="size-1.5 rounded-full bg-green-500"></span>Listo</span>',
        error: '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"><span class="size-1.5 rounded-full bg-red-500"></span>Error</span>'
    };

    const memberData = currentFamilyMembers.find(m => m.id === memberId) || { id: memberId, name: 'Desconocido', initials: (memberId || '?')[0].toUpperCase(), color: 'bg-gray-500' };

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
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)} M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)} K`;
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
    populateSelect('filter-member-gastos', currentFamilyMembers.map(m => ({ value: m.id, label: m.name })), 'Miembro: Todos');
    populateSelect('filter-month-gastos', months.map(m => ({ value: m, label: MONTHS_ES[m] })), 'Mes: Todos');
    populateSelect('filter-year-gastos', years.map(y => ({ value: y, label: y })), 'Año: Todos');
    populateSelect('filter-bank-gastos', banks.map(b => ({ value: b, label: b })), 'Banco: Todos');
    populateSelect('filter-category-gastos', categories.map(c => ({ value: c, label: c })), 'Categoría: Todas');

    // Populate Ingresos filters
    populateSelect('filter-member-ingresos', currentFamilyMembers.map(m => ({ value: m.id, label: m.name })), 'Miembro: Todos');
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
        // If selectedMembers is empty, it means "all members" are selected.
        const memberMatch = selectedMembers.length === 0 || selectedMembers.includes(t.Miembro);

        // Fallback for legacy data where Miembro might be a name string instead of an ID
        const legacyMemberMatch = selectedMembers.length === 0 || currentFamilyMembers.some(m =>
            selectedMembers.includes(m.id) && (m.id === t.Miembro || m.name.toLowerCase() === (t.Miembro || '').toLowerCase())
        );

        return memberMatch || legacyMemberMatch;
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

    select.innerHTML = `<option value = "all"> ${defaultLabel}</option> ` +
        options.map(opt => `<option value = "${opt.value}"> ${opt.label}</option> `).join('');
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
    document.getElementById('search-ingresos').value = '';
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
        category: document.getElementById('filter-category-ingresos')?.value || 'all',
        search: document.getElementById('search-ingresos')?.value?.toLowerCase()?.trim() || ''
    };
}

function filterByAdvancedCriteria(transactions, filters) {
    return transactions.filter(t => {
        const date = parseDateString(t.Fecha);

        // Member filter
        // Check if the transaction's member ID matches the filter, or if the member name matches for legacy data
        const memberFilterMatch = filters.member === 'all' ||
            t.Miembro === filters.member ||
            currentFamilyMembers.some(m => m.id === filters.member && m.name.toLowerCase() === (t.Miembro || '').toLowerCase());
        if (!memberFilterMatch) return false;

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

    container.innerHTML = `
    <label class="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-2 -m-1">
        <input type="checkbox" id="member-all" value="all" checked
            class="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
            onchange="onMemberFilterChange('all')">
            <div class="flex items-center gap-2">
                <div class="size-6 rounded-full bg-slate-500 flex items-center justify-center text-[10px] font-bold text-white">ALL</div>
                <span class="text-sm">Todos los Miembros</span>
            </div>
        </label>
`;

    currentFamilyMembers.forEach(member => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2633]';
        div.innerHTML = `
    <label class="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" id="member-${member.id}" value="${member.id}" checked
            class="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
            onchange="onMemberFilterChange('${member.id}')">
            <div class="flex items-center gap-2">
                <div class="size-6 rounded-full ${member.color} flex items-center justify-center text-[10px] text-white font-bold">
                    ${member.initials}
                </div>
                <span class="text-sm font-medium">${member.name}</span>
            </div>
        </label>
`;
        container.appendChild(div);
    });

    // Ensure 'all' is checked initially and selectedMembers is empty
    document.getElementById('member-all').checked = true;
    selectedMembers = [];
    updateMemberFilterLabel();

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
    const memberCheckboxes = currentFamilyMembers.map(m => document.getElementById(`member-${m.id}`));

    if (memberId === 'all') {
        // If "All" is checked, select all members and clear selectedMembers
        if (allCheckbox.checked) {
            selectedMembers = [];
            memberCheckboxes.forEach(cb => { if (cb) cb.checked = true; });
        } else {
            // If "All" is unchecked, deselect all and set selectedMembers to all IDs
            selectedMembers = currentFamilyMembers.map(m => m.id);
            memberCheckboxes.forEach(cb => { if (cb) cb.checked = false; });
        }
    } else {
        // Individual member checkbox changed
        const memberCheckbox = document.getElementById(`member - ${memberId} `);
        if (memberCheckbox.checked) {
            // Add member to selectedMembers if not already there
            if (!selectedMembers.includes(memberId)) {
                selectedMembers.push(memberId);
            }
        } else {
            // Remove member from selectedMembers
            selectedMembers = selectedMembers.filter(id => id !== memberId);
        }

        // Update "All" checkbox state based on individual selections
        const allSelected = memberCheckboxes.every(cb => cb && cb.checked);
        const noneSelected = memberCheckboxes.every(cb => cb && !cb.checked);

        if (allSelected) {
            allCheckbox.checked = true;
            selectedMembers = []; // Empty means all
        } else {
            allCheckbox.checked = false;
        }

        if (noneSelected) {
            // If none selected, default to all and show warning
            allCheckbox.checked = true;
            selectedMembers = [];
            memberCheckboxes.forEach(cb => { if (cb) cb.checked = true; });
            showNotification('Debe seleccionar al menos un miembro. Se han seleccionado todos por defecto.', 'warning');
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
        const member = currentFamilyMembers.find(m => m.id === selectedMembers[0]);
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
    toast.className = `pointer - events - auto flex items - center gap - 3 px - 4 py - 3 rounded - xl ${colors[type]} text - white shadow - lg transform translate - x - full opacity - 0 transition - all duration - 300`;
    toast.innerHTML = `
    <span class="material-symbols-outlined"> ${icons[type]}</span>
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

async function saveEditCategory() {
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
    // Update transaction in Supabase
    const transaction = allTransactions[index];
    if (transaction && transaction.id) {
        const { error } = await supabaseClient
            .from('movimientos')
            .update({ categoria: newCategory })
            .eq('id', transaction.id);

        if (error) {
            console.error('Error updating category:', error);
            showNotification('Error al actualizar: ' + error.message, 'error');
            return;
        }

        // Update local state
        allTransactions[index].Categoria = newCategory;
        applyFilters();
        renderAll();
        closeEditCategoryModal();
        showNotification(`Categoría actualizada a "${newCategory}"`, 'success');
    } else {
        showNotification('Error: Transacción sin ID', 'error');
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
