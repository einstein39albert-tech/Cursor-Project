const translations = {
  en: {
    "app.name": "Unified Operations, Reporting & Management System",
    "nav.home": "Home",
    "nav.features": "Features",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "nav.dashboard": "Dashboard",
    "nav.branches": "Branches",
    "nav.files": "Files",
    "nav.messages": "Messages",
    "nav.profiles": "Profiles",
    "nav.reports": "Reports",
    "nav.users": "Users",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    "home.tagline": "Modern bilingual operations, reporting, and management platform",
    "home.subtitle":
      "Built from your two prototypes into one real full-stack platform with secure access, auditability, and reporting.",
    "home.cta.primary": "Open Dashboard",
    "home.cta.secondary": "Sign In",
    "home.hero.kpi1": "Role-based access",
    "home.hero.kpi2": "Reporting analytics",
    "home.hero.kpi3": "Operational modules",
    "home.hero.kpi4": "Audit readiness",
    "auth.title": "Secure Sign In",
    "auth.username": "Username",
    "auth.password": "Password",
    "auth.language": "Language",
    "auth.roleHelp": "Internal user accounts are created by administrators.",
    "auth.submit": "Sign In",
    "dashboard.welcome": "Welcome back",
    "dashboard.overview": "Operational overview",
    "dashboard.calendar": "Calendar and fiscal context",
    "common.save": "Save",
    "common.create": "Create",
    "common.update": "Update",
    "common.delete": "Delete",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.search": "Search",
    "common.upload": "Upload",
    "common.download": "Download",
    "common.language": "Language",
    "common.status": "Status",
    "common.actions": "Actions",
    "common.name": "Name",
    "common.description": "Description",
    "common.email": "Email",
    "common.phone": "Phone",
    "common.branch": "Branch",
    "common.role": "Role",
    "common.created": "Created",
    "common.none": "None",
  },
  am: {
    "app.name": "የተዋሃደ የአሰራር፣ ሪፖርትና አስተዳደር ስርዓት",
    "nav.home": "መነሻ",
    "nav.features": "ባህሪያት",
    "nav.contact": "አግኙን",
    "nav.login": "ግባ",
    "nav.dashboard": "ዳሽቦርድ",
    "nav.branches": "ቅርንጫፎች",
    "nav.files": "ፋይሎች",
    "nav.messages": "መልዕክቶች",
    "nav.profiles": "ፕሮፋይሎች",
    "nav.reports": "ሪፖርቶች",
    "nav.users": "ተጠቃሚዎች",
    "nav.settings": "ቅንብሮች",
    "nav.logout": "ውጣ",
    "home.tagline": "ዘመናዊ ሁለት ቋንቋ የአሰራር፣ ሪፖርትና አስተዳደር መድረክ",
    "home.subtitle":
      "ሁለቱን ፕሮቶታይፖች በአንድ የእውነተኛ ኋላ አገልግሎት፣ የደህንነት መዳረሻ እና ሪፖርት ያለው ስርዓት አድርጎ የተገነባ።",
    "home.cta.primary": "ዳሽቦርድ ክፈት",
    "home.cta.secondary": "ግባ",
    "home.hero.kpi1": "በሚና የተመሰረተ መዳረሻ",
    "home.hero.kpi2": "የሪፖርት ትንታኔ",
    "home.hero.kpi3": "የስራ ሞጁሎች",
    "home.hero.kpi4": "የኦዲት ዝግጁነት",
    "auth.title": "ደህንነታዊ መግቢያ",
    "auth.username": "የተጠቃሚ ስም",
    "auth.password": "የይለፍ ቃል",
    "auth.language": "ቋንቋ",
    "auth.roleHelp": "የውስጥ ተጠቃሚ መለያዎች በአስተዳዳሪዎች ይፈጠራሉ።",
    "auth.submit": "ግባ",
    "dashboard.welcome": "እንኳን ደህና መጡ",
    "dashboard.overview": "የስራ አጠቃላይ እይታ",
    "dashboard.calendar": "የቀን መቁጠሪያ እና የበጀት አመት አውድ",
    "common.save": "አስቀምጥ",
    "common.create": "ፍጠር",
    "common.update": "አዘምን",
    "common.delete": "ሰርዝ",
    "common.cancel": "ተወው",
    "common.confirm": "አረጋግጥ",
    "common.search": "ፈልግ",
    "common.upload": "ጫን",
    "common.download": "አውርድ",
    "common.language": "ቋንቋ",
    "common.status": "ሁኔታ",
    "common.actions": "እርምጃዎች",
    "common.name": "ስም",
    "common.description": "መግለጫ",
    "common.email": "ኢሜይል",
    "common.phone": "ስልክ",
    "common.branch": "ቅርንጫፍ",
    "common.role": "ሚና",
    "common.created": "የተፈጠረበት",
    "common.none": "የለም",
  },
};

function getLocale(requestedLocale, fallback = "en") {
  if (translations[requestedLocale]) {
    return requestedLocale;
  }

  return fallback;
}

function translate(locale, key) {
  const safeLocale = getLocale(locale);
  return translations[safeLocale][key] || translations.en[key] || key;
}

function getLanguageOptions() {
  return [
    { code: "en", label: "English" },
    { code: "am", label: "አማርኛ" },
  ];
}

module.exports = {
  translations,
  getLocale,
  translate,
  getLanguageOptions,
};
