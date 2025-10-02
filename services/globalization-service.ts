import { db } from "../db";
import { users, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { loggingService as logger } from "./logging-service";

// Supported languages and regions
export const SUPPORTED_LANGUAGES = {
  'en-US': { name: 'English (US)', flag: '🇺🇸', rtl: false },
  'en-GB': { name: 'English (UK)', flag: '🇬🇧', rtl: false },
  'es-ES': { name: 'Español (España)', flag: '🇪🇸', rtl: false },
  'es-MX': { name: 'Español (México)', flag: '🇲🇽', rtl: false },
  'fr-FR': { name: 'Français (France)', flag: '🇫🇷', rtl: false },
  'fr-CA': { name: 'Français (Canada)', flag: '🇨🇦', rtl: false },
  'de-DE': { name: 'Deutsch (Deutschland)', flag: '🇩🇪', rtl: false },
  'de-AT': { name: 'Deutsch (Österreich)', flag: '🇦🇹', rtl: false },
  'it-IT': { name: 'Italiano (Italia)', flag: '🇮🇹', rtl: false },
  'pt-BR': { name: 'Português (Brasil)', flag: '🇧🇷', rtl: false },
  'pt-PT': { name: 'Português (Portugal)', flag: '🇵🇹', rtl: false },
  'zh-CN': { name: '简体中文 (中国)', flag: '🇨🇳', rtl: false },
  'zh-TW': { name: '繁體中文 (台灣)', flag: '🇹🇼', rtl: false },
  'ja-JP': { name: '日本語 (日本)', flag: '🇯🇵', rtl: false },
  'ko-KR': { name: '한국어 (대한민국)', flag: '🇰🇷', rtl: false },
  'ar-SA': { name: 'العربية (السعودية)', flag: '🇸🇦', rtl: true },
  'ar-EG': { name: 'العربية (مصر)', flag: '🇪🇬', rtl: true },
  'hi-IN': { name: 'हिन्दी (भारत)', flag: '🇮🇳', rtl: false },
  'ru-RU': { name: 'Русский (Россия)', flag: '🇷🇺', rtl: false },
  'pl-PL': { name: 'Polski (Polska)', flag: '🇵🇱', rtl: false },
  'nl-NL': { name: 'Nederlands (Nederland)', flag: '🇳🇱', rtl: false },
  'sv-SE': { name: 'Svenska (Sverige)', flag: '🇸🇪', rtl: false },
  'no-NO': { name: 'Norsk (Norge)', flag: '🇳🇴', rtl: false },
  'da-DK': { name: 'Dansk (Danmark)', flag: '🇩🇰', rtl: false },
  'fi-FI': { name: 'Suomi (Suomi)', flag: '🇫🇮', rtl: false }
};

// Currency configurations
export const SUPPORTED_CURRENCIES = {
  'USD': { symbol: '$', name: 'US Dollar', decimals: 2 },
  'EUR': { symbol: '€', name: 'Euro', decimals: 2 },
  'GBP': { symbol: '£', name: 'British Pound', decimals: 2 },
  'JPY': { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  'CNY': { symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  'INR': { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  'AUD': { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  'CAD': { symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  'CHF': { symbol: 'Fr', name: 'Swiss Franc', decimals: 2 },
  'SEK': { symbol: 'kr', name: 'Swedish Krona', decimals: 2 },
  'NOK': { symbol: 'kr', name: 'Norwegian Krone', decimals: 2 },
  'DKK': { symbol: 'kr', name: 'Danish Krone', decimals: 2 },
  'PLN': { symbol: 'zł', name: 'Polish Złoty', decimals: 2 },
  'BRL': { symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
  'MXN': { symbol: '$', name: 'Mexican Peso', decimals: 2 },
  'AED': { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
  'SAR': { symbol: 'ر.س', name: 'Saudi Riyal', decimals: 2 }
};

// Time zone configurations
export const SUPPORTED_TIMEZONES = {
  'America/New_York': 'Eastern Time (US)',
  'America/Chicago': 'Central Time (US)',
  'America/Denver': 'Mountain Time (US)',
  'America/Los_Angeles': 'Pacific Time (US)',
  'America/Toronto': 'Eastern Time (Canada)',
  'America/Vancouver': 'Pacific Time (Canada)',
  'America/Sao_Paulo': 'Brasília Time',
  'America/Mexico_City': 'Central Time (Mexico)',
  'Europe/London': 'Greenwich Mean Time',
  'Europe/Paris': 'Central European Time',
  'Europe/Berlin': 'Central European Time',
  'Europe/Rome': 'Central European Time',
  'Europe/Madrid': 'Central European Time',
  'Europe/Amsterdam': 'Central European Time',
  'Europe/Stockholm': 'Central European Time',
  'Europe/Oslo': 'Central European Time',
  'Europe/Copenhagen': 'Central European Time',
  'Europe/Helsinki': 'Eastern European Time',
  'Europe/Warsaw': 'Central European Time',
  'Europe/Moscow': 'Moscow Time',
  'Asia/Tokyo': 'Japan Standard Time',
  'Asia/Seoul': 'Korea Standard Time',
  'Asia/Shanghai': 'China Standard Time',
  'Asia/Hong_Kong': 'Hong Kong Time',
  'Asia/Singapore': 'Singapore Time',
  'Asia/Mumbai': 'India Standard Time',
  'Asia/Dubai': 'Gulf Standard Time',
  'Asia/Riyadh': 'Arabia Standard Time',
  'Australia/Sydney': 'Australian Eastern Time',
  'Australia/Melbourne': 'Australian Eastern Time',
  'Australia/Perth': 'Australian Western Time'
};

// Translation service
export class GlobalizationService {
  
  // Core translation system
  private translations: Record<string, Record<string, string>> = {
    'en-US': {
      'common.welcome': 'Welcome',
      'common.login': 'Login',
      'common.logout': 'Logout',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.create': 'Create',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.import': 'Import',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'navigation.dashboard': 'Dashboard',
      'navigation.jobs': 'Jobs',
      'navigation.schedule': 'Schedule',
      'navigation.timesheets': 'Timesheets',
      'navigation.payments': 'Payments',
      'navigation.reports': 'Reports',
      'navigation.workers': 'Workers',
      'navigation.clients': 'Clients',
      'navigation.settings': 'Settings',
      'jobs.title': 'Job Management',
      'jobs.create': 'Create Job',
      'jobs.edit': 'Edit Job',
      'jobs.status.active': 'Active',
      'jobs.status.paused': 'Paused',
      'jobs.status.completed': 'Completed',
      'workers.title': 'Worker Management',
      'workers.skills': 'Skills',
      'workers.availability': 'Availability',
      'workers.performance': 'Performance',
      'payments.title': 'Payment Management',
      'payments.pending': 'Pending',
      'payments.processing': 'Processing',
      'payments.completed': 'Completed',
      'payments.failed': 'Failed',
      'compliance.gdpr': 'GDPR Compliance',
      'compliance.accessibility': 'Accessibility',
      'compliance.security': 'Security Standards'
    },
    'es-ES': {
      'common.welcome': 'Bienvenido',
      'common.login': 'Iniciar Sesión',
      'common.logout': 'Cerrar Sesión',
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.create': 'Crear',
      'common.search': 'Buscar',
      'common.filter': 'Filtrar',
      'common.export': 'Exportar',
      'common.import': 'Importar',
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.success': 'Éxito',
      'navigation.dashboard': 'Panel de Control',
      'navigation.jobs': 'Trabajos',
      'navigation.schedule': 'Horario',
      'navigation.timesheets': 'Registro de Tiempo',
      'navigation.payments': 'Pagos',
      'navigation.reports': 'Informes',
      'navigation.workers': 'Trabajadores',
      'navigation.clients': 'Clientes',
      'navigation.settings': 'Configuración',
      'jobs.title': 'Gestión de Trabajos',
      'jobs.create': 'Crear Trabajo',
      'jobs.edit': 'Editar Trabajo',
      'jobs.status.active': 'Activo',
      'jobs.status.paused': 'Pausado',
      'jobs.status.completed': 'Completado',
      'workers.title': 'Gestión de Trabajadores',
      'workers.skills': 'Habilidades',
      'workers.availability': 'Disponibilidad',
      'workers.performance': 'Rendimiento',
      'payments.title': 'Gestión de Pagos',
      'payments.pending': 'Pendiente',
      'payments.processing': 'Procesando',
      'payments.completed': 'Completado',
      'payments.failed': 'Fallido',
      'compliance.gdpr': 'Cumplimiento GDPR',
      'compliance.accessibility': 'Accesibilidad',
      'compliance.security': 'Estándares de Seguridad'
    },
    'fr-FR': {
      'common.welcome': 'Bienvenue',
      'common.login': 'Se Connecter',
      'common.logout': 'Se Déconnecter',
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.create': 'Créer',
      'common.search': 'Rechercher',
      'common.filter': 'Filtrer',
      'common.export': 'Exporter',
      'common.import': 'Importer',
      'common.loading': 'Chargement...',
      'common.error': 'Erreur',
      'common.success': 'Succès',
      'navigation.dashboard': 'Tableau de Bord',
      'navigation.jobs': 'Emplois',
      'navigation.schedule': 'Planification',
      'navigation.timesheets': 'Feuilles de Temps',
      'navigation.payments': 'Paiements',
      'navigation.reports': 'Rapports',
      'navigation.workers': 'Travailleurs',
      'navigation.clients': 'Clients',
      'navigation.settings': 'Paramètres',
      'jobs.title': 'Gestion des Emplois',
      'jobs.create': 'Créer un Emploi',
      'jobs.edit': 'Modifier l\'Emploi',
      'jobs.status.active': 'Actif',
      'jobs.status.paused': 'En Pause',
      'jobs.status.completed': 'Terminé',
      'workers.title': 'Gestion des Travailleurs',
      'workers.skills': 'Compétences',
      'workers.availability': 'Disponibilité',
      'workers.performance': 'Performance',
      'payments.title': 'Gestion des Paiements',
      'payments.pending': 'En Attente',
      'payments.processing': 'En Cours',
      'payments.completed': 'Terminé',
      'payments.failed': 'Échoué',
      'compliance.gdpr': 'Conformité RGPD',
      'compliance.accessibility': 'Accessibilité',
      'compliance.security': 'Normes de Sécurité'
    },
    'de-DE': {
      'common.welcome': 'Willkommen',
      'common.login': 'Anmelden',
      'common.logout': 'Abmelden',
      'common.save': 'Speichern',
      'common.cancel': 'Abbrechen',
      'common.delete': 'Löschen',
      'common.edit': 'Bearbeiten',
      'common.create': 'Erstellen',
      'common.search': 'Suchen',
      'common.filter': 'Filter',
      'common.export': 'Exportieren',
      'common.import': 'Importieren',
      'common.loading': 'Lädt...',
      'common.error': 'Fehler',
      'common.success': 'Erfolg',
      'navigation.dashboard': 'Dashboard',
      'navigation.jobs': 'Jobs',
      'navigation.schedule': 'Zeitplan',
      'navigation.timesheets': 'Zeiterfassung',
      'navigation.payments': 'Zahlungen',
      'navigation.reports': 'Berichte',
      'navigation.workers': 'Arbeiter',
      'navigation.clients': 'Kunden',
      'navigation.settings': 'Einstellungen',
      'jobs.title': 'Job-Verwaltung',
      'jobs.create': 'Job Erstellen',
      'jobs.edit': 'Job Bearbeiten',
      'jobs.status.active': 'Aktiv',
      'jobs.status.paused': 'Pausiert',
      'jobs.status.completed': 'Abgeschlossen',
      'workers.title': 'Arbeiter-Verwaltung',
      'workers.skills': 'Fähigkeiten',
      'workers.availability': 'Verfügbarkeit',
      'workers.performance': 'Leistung',
      'payments.title': 'Zahlungs-Verwaltung',
      'payments.pending': 'Ausstehend',
      'payments.processing': 'Verarbeitung',
      'payments.completed': 'Abgeschlossen',
      'payments.failed': 'Fehlgeschlagen',
      'compliance.gdpr': 'DSGVO-Konformität',
      'compliance.accessibility': 'Barrierefreiheit',
      'compliance.security': 'Sicherheitsstandards'
    },
    'zh-CN': {
      'common.welcome': '欢迎',
      'common.login': '登录',
      'common.logout': '登出',
      'common.save': '保存',
      'common.cancel': '取消',
      'common.delete': '删除',
      'common.edit': '编辑',
      'common.create': '创建',
      'common.search': '搜索',
      'common.filter': '筛选',
      'common.export': '导出',
      'common.import': '导入',
      'common.loading': '加载中...',
      'common.error': '错误',
      'common.success': '成功',
      'navigation.dashboard': '仪表板',
      'navigation.jobs': '工作',
      'navigation.schedule': '日程',
      'navigation.timesheets': '工时表',
      'navigation.payments': '支付',
      'navigation.reports': '报告',
      'navigation.workers': '工人',
      'navigation.clients': '客户',
      'navigation.settings': '设置',
      'jobs.title': '工作管理',
      'jobs.create': '创建工作',
      'jobs.edit': '编辑工作',
      'jobs.status.active': '活跃',
      'jobs.status.paused': '暂停',
      'jobs.status.completed': '已完成',
      'workers.title': '工人管理',
      'workers.skills': '技能',
      'workers.availability': '可用性',
      'workers.performance': '表现',
      'payments.title': '支付管理',
      'payments.pending': '待处理',
      'payments.processing': '处理中',
      'payments.completed': '已完成',
      'payments.failed': '失败',
      'compliance.gdpr': 'GDPR合规',
      'compliance.accessibility': '无障碍',
      'compliance.security': '安全标准'
    },
    'ja-JP': {
      'common.welcome': 'ようこそ',
      'common.login': 'ログイン',
      'common.logout': 'ログアウト',
      'common.save': '保存',
      'common.cancel': 'キャンセル',
      'common.delete': '削除',
      'common.edit': '編集',
      'common.create': '作成',
      'common.search': '検索',
      'common.filter': 'フィルター',
      'common.export': 'エクスポート',
      'common.import': 'インポート',
      'common.loading': '読み込み中...',
      'common.error': 'エラー',
      'common.success': '成功',
      'navigation.dashboard': 'ダッシュボード',
      'navigation.jobs': 'ジョブ',
      'navigation.schedule': 'スケジュール',
      'navigation.timesheets': 'タイムシート',
      'navigation.payments': '支払い',
      'navigation.reports': 'レポート',
      'navigation.workers': 'ワーカー',
      'navigation.clients': 'クライアント',
      'navigation.settings': '設定',
      'jobs.title': 'ジョブ管理',
      'jobs.create': 'ジョブ作成',
      'jobs.edit': 'ジョブ編集',
      'jobs.status.active': 'アクティブ',
      'jobs.status.paused': '一時停止',
      'jobs.status.completed': '完了',
      'workers.title': 'ワーカー管理',
      'workers.skills': 'スキル',
      'workers.availability': '可用性',
      'workers.performance': 'パフォーマンス',
      'payments.title': '支払い管理',
      'payments.pending': '保留中',
      'payments.processing': '処理中',
      'payments.completed': '完了',
      'payments.failed': '失敗',
      'compliance.gdpr': 'GDPR準拠',
      'compliance.accessibility': 'アクセシビリティ',
      'compliance.security': 'セキュリティ標準'
    },
    'ar-SA': {
      'common.welcome': 'مرحباً',
      'common.login': 'تسجيل الدخول',
      'common.logout': 'تسجيل الخروج',
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تحرير',
      'common.create': 'إنشاء',
      'common.search': 'بحث',
      'common.filter': 'تصفية',
      'common.export': 'تصدير',
      'common.import': 'استيراد',
      'common.loading': 'جاري التحميل...',
      'common.error': 'خطأ',
      'common.success': 'نجح',
      'navigation.dashboard': 'لوحة القيادة',
      'navigation.jobs': 'الوظائف',
      'navigation.schedule': 'الجدولة',
      'navigation.timesheets': 'أوراق الوقت',
      'navigation.payments': 'المدفوعات',
      'navigation.reports': 'التقارير',
      'navigation.workers': 'العمال',
      'navigation.clients': 'العملاء',
      'navigation.settings': 'الإعدادات',
      'jobs.title': 'إدارة الوظائف',
      'jobs.create': 'إنشاء وظيفة',
      'jobs.edit': 'تحرير الوظيفة',
      'jobs.status.active': 'نشط',
      'jobs.status.paused': 'متوقف',
      'jobs.status.completed': 'مكتمل',
      'workers.title': 'إدارة العمال',
      'workers.skills': 'المهارات',
      'workers.availability': 'التوفر',
      'workers.performance': 'الأداء',
      'payments.title': 'إدارة المدفوعات',
      'payments.pending': 'معلق',
      'payments.processing': 'قيد المعالجة',
      'payments.completed': 'مكتمل',
      'payments.failed': 'فشل',
      'compliance.gdpr': 'امتثال GDPR',
      'compliance.accessibility': 'إمكانية الوصول',
      'compliance.security': 'معايير الأمان'
    }
  };

  // Get translation for a key
  translate(key: string, locale: string = 'en-US', params: Record<string, any> = {}): string {
    const translations = this.translations[locale] || this.translations['en-US'];
    let translation = translations[key] || key;
    
    // Replace parameters in translation
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
    
    return translation;
  }

  // Get all translations for a locale
  getTranslations(locale: string): Record<string, string> {
    return this.translations[locale] || this.translations['en-US'];
  }

  // Add or update translations
  addTranslations(locale: string, translations: Record<string, string>): void {
    if (!this.translations[locale]) {
      this.translations[locale] = {};
    }
    Object.assign(this.translations[locale], translations);
  }

  // Format currency based on locale
  formatCurrency(amount: number, currency: string, locale: string): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency as keyof typeof SUPPORTED_CURRENCIES];
    if (!currencyInfo) return `${amount}`;
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currencyInfo.decimals,
        maximumFractionDigits: currencyInfo.decimals
      }).format(amount);
    } catch (error) {
      return `${currencyInfo.symbol}${amount.toFixed(currencyInfo.decimals)}`;
    }
  }

  // Format date based on locale
  formatDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    try {
      return new Intl.DateTimeFormat(locale, options || defaultOptions).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  // Format time based on locale
  formatTime(date: Date, locale: string, timezone?: string): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    };
    
    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      return date.toLocaleTimeString();
    }
  }

  // Format number based on locale
  formatNumber(number: number, locale: string, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  // Get user's preferred locale from database
  async getUserLocale(userId: string): Promise<string> {
    // Users table doesn't have locale field - would store in future
    return 'en-US';
  }

  // Update user's locale preference
  async updateUserLocale(userId: string, locale: string): Promise<void> {
    // Users table doesn't have locale field - would update in future
    logger.info(`Would update locale for user ${userId} to ${locale}`);
  }

  // Get organization's default locale
  async getOrganizationLocale(organizationId: string): Promise<string> {
    // Organizations table doesn't have defaultLocale field - would store in future
    return 'en-US';
  }

  // Auto-detect locale from request headers
  detectLocale(acceptLanguage: string): string {
    if (!acceptLanguage) return 'en-US';
    
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return { code: code.trim(), quality: parseFloat(q) };
      })
      .sort((a, b) => b.quality - a.quality);
    
    for (const lang of languages) {
      // Exact match
      if (SUPPORTED_LANGUAGES[lang.code as keyof typeof SUPPORTED_LANGUAGES]) {
        return lang.code;
      }
      
      // Language family match (e.g., 'en' matches 'en-US')
      const languageFamily = lang.code.split('-')[0];
      const match = Object.keys(SUPPORTED_LANGUAGES).find(key => 
        key.startsWith(languageFamily + '-')
      );
      if (match) return match;
    }
    
    return 'en-US';
  }

  // Get RTL (Right-to-Left) languages
  isRTL(locale: string): boolean {
    return SUPPORTED_LANGUAGES[locale as keyof typeof SUPPORTED_LANGUAGES]?.rtl || false;
  }

  // Generate locale switcher data
  getLocaleSwitcherData(): Array<{
    code: string;
    name: string;
    flag: string;
    rtl: boolean;
  }> {
    return Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => ({
      code,
      name: config.name,
      flag: config.flag,
      rtl: config.rtl
    }));
  }

  // Pluralization support
  pluralize(key: string, count: number, locale: string): string {
    const rules = new Intl.PluralRules(locale);
    const rule = rules.select(count);
    
    const pluralKey = `${key}.${rule}`;
    const translation = this.translate(pluralKey, locale);
    
    if (translation === pluralKey) {
      // Fallback to base key if plural form not found
      return this.translate(key, locale, { count });
    }
    
    return translation.replace('{{count}}', count.toString());
  }

  // Get currency symbol
  getCurrencySymbol(currency: string): string {
    return SUPPORTED_CURRENCIES[currency as keyof typeof SUPPORTED_CURRENCIES]?.symbol || currency;
  }

  // Get timezone offset
  getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      const targetTime = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
      return (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    } catch (error) {
      return 0;
    }
  }

  // Convert between timezones
  convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
    try {
      const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
      return new Date(utc.toLocaleString("en-US", { timeZone: toTimezone }));
    } catch (error) {
      return date;
    }
  }

  // Validate locale
  isValidLocale(locale: string): boolean {
    return locale in SUPPORTED_LANGUAGES;
  }

  // Validate currency
  isValidCurrency(currency: string): boolean {
    return currency in SUPPORTED_CURRENCIES;
  }

  // Validate timezone
  isValidTimezone(timezone: string): boolean {
    return timezone in SUPPORTED_TIMEZONES;
  }
}

export const globalizationService = new GlobalizationService();