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
        loginWidth: 150,
        loginHeight: 150,
        // Ukuran sidebar
        sidebarWidth: 40,
        sidebarMinimizedWidth: 32,
    },
    
    // Warna tema (ganti sesuai keinginan)
    colors: {
        primary: "#3B82F6", // blue-500
        primaryHover: "#2563EB", // blue-600
        secondary: "#10B981", // green-500
        accent: "#8B5CF6", // purple-500
        background: "#F3F4F6", // gray-100
        darkBackground: "#111827", // gray-900
    },
    
    // Teks branding
    text: {
        appName: "Sistem Informasi Analisa APBD",
        subTitle: "Pemerintah Kota Medan",
        loginTitle: "Sistem Informasi Analisa APBD Kota Medan",
        loginSubtitle: "Silakan login untuk melanjutkan",
        sidebarTitle: "SIMONALISA",
        footer: "© 2026 Pemerintah Kota Medan",
    },
    
    // Tautan (isi dengan URL yang sesuai)
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