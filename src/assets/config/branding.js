// src/config/branding.js
export const brandingConfig = {
    // Logo settings
    logo: {
        path: "/logo.png",
        alt: "Logo Pemerintah Kota Medan",
        // Ukuran default
        width: 96,
        height: 96,
        // Ukuran khusus untuk login (lebih besar)
        loginWidth: 200,
        loginHeight: 200,
        // Ukuran sidebar - dipisah untuk clarity
        sidebarExpandedWidth: 45,    // Ukuran saat sidebar terbuka
        sidebarMinimizedWidth: 36,    // Ukuran saat sidebar dikecilkan
    },
    
    // Warna tema
    colors: {
        primary: "#3B82F6",
        primaryHover: "#2563EB",
        secondary: "#10B981",
        accent: "#8B5CF6",
        background: "#F3F4F6",
        darkBackground: "#111827",
    },
    
    // Teks branding
    text: {
        appName: "Sistem Informasi Analisa APBD",
        subTitle: "Pemerintah Kota Medan",
        loginTitle: "Sistem Informasi Analisa APBD Kota Medan",
        loginSubtitle: "Silakan login untuk melanjutkan",
        sidebarTitle: "SIMONALISA",
        footer: "© 2026 Pemerintah Kota Medan. All rights reserved.",
    },
    
    // Tautan
    links: {
        helpDesk: "https://bkad.medan.go.id/help",
        privacy: "https://bkad.medan.go.id/privacy",
        terms: "https://bkad.medan.go.id/terms",
    },
    
    // Fitur
    features: {
        showHelpLink: true,
        showFooter: true,
        enableDarkMode: true,
    }
};