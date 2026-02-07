// =========================================
// CONFIGURATION - Finanzas Familiares
// =========================================

const CONFIG = {
    // Gemini API Configuration
    // API Key is loaded from config.env.js (which is NOT committed to Git)
    GEMINI_API_KEY: typeof ENV_CONFIG !== 'undefined' ? ENV_CONFIG.GEMINI_API_KEY : '',
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',

    // Supabase Configuration (if needed)
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',

    // App Settings
    ITEMS_PER_PAGE: 10,
    DEFAULT_PERIOD: '6months',
    CURRENCY: 'COP',
    LOCALE: 'es-CO',

    // Family Members
    FAMILY_MEMBERS: [
        { id: 'isa', name: 'Isa', initials: 'I', color: 'bg-purple-500' },
        { id: 'sebas', name: 'Sebas', initials: 'S', color: 'bg-blue-500' },
        { id: 'fabio', name: 'Fabio', initials: 'F', color: 'bg-green-500' }
    ],

    // Category Colors
    CATEGORY_COLORS: {
        'Hogar': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
        'Transporte': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
        'Entretenimiento': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
        'Comida': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
        'Salud': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-300' },
        'Servicios': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-300' },
        'Compras': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-300' },
        'Otros': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300' },
        'Sueldo': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
        'Freelance': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300' },
        'Inversión': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
        'Venta': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
        'Regalo': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300' }
    },

    // Chart Colors
    CHART_COLORS: {
        primary: '#135bec',
        secondary: '#0bda5e',
        danger: '#fa6238',
        warning: '#f59e0b',
        purple: '#a78bfa',
        pink: '#ec4899',
        teal: '#14b8a6',
        gray: '#6b7280'
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.FAMILY_MEMBERS);
Object.freeze(CONFIG.CATEGORY_COLORS);
Object.freeze(CONFIG.CHART_COLORS);
