/* =========================================================
   NOTMATİK - Ortak Yardımcılar, Tema, Bildirim ve Akıllı PWA Yönetimi
   ========================================================= */

(function () {
    'use strict';

    const THEME_KEY = 'darkMode';
    const GOALS_KEY = 'savedGoals';
    const PWA_DISMISS_KEY = 'notmatik_pwa_banner_dismissed_at';
    const PWA_DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

    let deferredInstallPrompt = null;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function applySavedTheme() {
        const savedMode = localStorage.getItem(THEME_KEY);
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedMode === 'enabled' || (savedMode === null && prefersDark);

        document.body.classList.toggle('dark-mode', isDark);
        updateThemeIcon(isDark);
    }

    function updateThemeIcon(isDark) {
        const icon = document.getElementById('mode-icon');
        if (!icon) return;
        icon.classList.remove('fa-moon', 'fa-sun');
        icon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
    }

    function toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem(THEME_KEY, isDark ? 'enabled' : 'disabled');
        updateThemeIcon(isDark);
    }

    function getSavedGoals() {
        try {
            const raw = localStorage.getItem(GOALS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            return [];
        }
    }

    function setSavedGoals(goals) {
        localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
        updateSavedGoalsBadge();
    }

    function updateSavedGoalsBadge() {
        const count = getSavedGoals().length;
        document.querySelectorAll('.saved-goals-count').forEach((badge) => {
            badge.textContent = String(count);
        });
    }

    function showToast(message, type) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }

        const item = document.createElement('div');
        item.className = 'toast-item ' + (type ? 'toast-' + type : '');

        const icon = document.createElement('i');
        if (type === 'success') {
            icon.className = 'fa-solid fa-circle-check';
        } else if (type === 'error') {
            icon.className = 'fa-solid fa-circle-exclamation';
        } else {
            icon.className = 'fa-solid fa-circle-info';
        }

        const textSpan = document.createElement('span');
        textSpan.textContent = message;

        item.appendChild(icon);
        item.appendChild(textSpan);
        container.appendChild(item);

        setTimeout(() => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(8px)';
            item.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            setTimeout(() => item.remove(), 220);
        }, 3200);
    }

    function isStandaloneApp() {
        return (
            (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
            window.navigator.standalone === true
        );
    }

    function detectPlatform() {
        const ua = window.navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /Android/i.test(ua);
        const isMobile = isIOS || isAndroid || /Mobile|Tablet/i.test(ua);
        const isMac = !isIOS && /Mac/i.test(navigator.platform || ua);
        const isOpera = /OPR|Opera/i.test(ua);
        return {
            isIOS: isIOS,
            isAndroid: isAndroid,
            isMobile: isMobile,
            isDesktop: !isMobile,
            isMac: isMac,
            isOpera: isOpera
        };
    }

    function shouldShowInstallBanner() {
        if (isStandaloneApp()) return false;
        const dismissedAt = parseInt(localStorage.getItem(PWA_DISMISS_KEY) || '0', 10);
        if (dismissedAt && Date.now() - dismissedAt < PWA_DISMISS_TTL_MS) {
            return false;
        }
        return true;
    }

    function updateInstallUI() {
        const headerBtn = document.getElementById('install-app-btn');
        const banner = document.getElementById('pwa-install-banner');
        const platform = detectPlatform();

        if (isStandaloneApp()) {
            if (headerBtn) headerBtn.classList.add('is-installed');
            if (banner) banner.classList.remove('visible');
            return;
        }

        if (headerBtn) {
            headerBtn.classList.remove('is-installed');
            const labelSpan = headerBtn.querySelector('span');
            const iconEl = headerBtn.querySelector('i');
            if (platform.isDesktop) {
                if (labelSpan) labelSpan.textContent = "PC'ye İndir";
                if (iconEl) iconEl.className = 'fa-solid fa-desktop';
            } else {
                if (labelSpan) labelSpan.textContent = "Telefona İndir";
                if (iconEl) iconEl.className = 'fa-solid fa-mobile-screen-button';
            }
        }

        const bannerTitle = document.getElementById('pwa-banner-title');
        const bannerDesc = document.getElementById('pwa-banner-desc');
        if (bannerTitle && bannerDesc) {
            if (platform.isDesktop) {
                bannerTitle.textContent = "NOTMATİK'i Bilgisayarına İndir";
                bannerDesc.textContent = 'Masaüstü uygulaması olarak kur, internetsiz bile tek tıkla aç.';
            } else {
                bannerTitle.textContent = "NOTMATİK'i Telefonuna İndir";
                bannerDesc.textContent = 'Ana ekrana ekle, internetsiz bile tek dokunuşla not hesapla.';
            }
        }

        if (banner) {
            const canPrompt = Boolean(deferredInstallPrompt);
            if (shouldShowInstallBanner() && (canPrompt || platform.isMobile)) {
                banner.classList.add('visible');
            }
        }
    }

    function openInstallGuideModal() {
        const modal = document.getElementById('install-guide-modal');
        if (!modal) return;

        const platform = detectPlatform();
        const titleEl = document.getElementById('install-modal-title');
        const descEl = document.getElementById('install-modal-desc');
        const iosSteps = document.getElementById('install-steps-ios');
        const androidSteps = document.getElementById('install-steps-android');
        const desktopSteps = document.getElementById('install-steps-desktop');

        if (titleEl && descEl) {
            if (platform.isDesktop) {
                titleEl.innerHTML = '<i class="fa-solid fa-desktop" style="color: var(--accent-color);"></i> NOTMATİK\'i PC\'ye İndir';
                descEl.textContent = 'NOTMATİK\'i bilgisayarınıza masaüstü uygulaması olarak kurup tarayıcı sekmeleri olmadan, çevrimdışı da kullanabilirsiniz.';
            } else {
                titleEl.innerHTML = '<i class="fa-solid fa-mobile-screen-button" style="color: var(--accent-color);"></i> NOTMATİK\'i Telefona İndir';
                descEl.textContent = 'NOTMATİK\'i ana ekranınıza ekleyerek mobil uygulama gibi açabilir ve internet bağlantınız olmadığında da kullanabilirsiniz.';
            }
        }

        if (iosSteps) iosSteps.style.display = platform.isIOS ? 'flex' : 'none';
        if (androidSteps) androidSteps.style.display = (!platform.isIOS && platform.isMobile) ? 'flex' : 'none';
        if (desktopSteps) desktopSteps.style.display = platform.isDesktop ? 'flex' : 'none';

        modal.classList.add('open');
    }

    function closeInstallGuideModal() {
        const modal = document.getElementById('install-guide-modal');
        if (modal) modal.classList.remove('open');
    }

    async function triggerInstallApp() {
        if (deferredInstallPrompt) {
            try {
                deferredInstallPrompt.prompt();
                const choice = await deferredInstallPrompt.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    showToast('NOTMATİK cihazınıza kuruluyor!', 'success');
                    const banner = document.getElementById('pwa-install-banner');
                    if (banner) banner.classList.remove('visible');
                }
                deferredInstallPrompt = null;
                updateInstallUI();
                return;
            } catch (err) {
                // Kurulum penceresi açılamazsa rehbere geç
            }
        }
        openInstallGuideModal();
    }

    function dismissInstallBanner() {
        localStorage.setItem(PWA_DISMISS_KEY, String(Date.now()));
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.classList.remove('visible');
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            navigator.serviceWorker.register('sw.js').catch(function () {
                // Service worker kaydı atlandı
            });
        }
    }

    window.addEventListener('beforeinstallprompt', function (event) {
        event.preventDefault();
        deferredInstallPrompt = event;
        updateInstallUI();
    });

    window.addEventListener('appinstalled', function () {
        deferredInstallPrompt = null;
        updateInstallUI();
        showToast('NOTMATİK uygulama olarak yüklendi!', 'success');
    });

    document.addEventListener('DOMContentLoaded', function () {
        applySavedTheme();
        updateSavedGoalsBadge();
        registerServiceWorker();
        updateInstallUI();

        const installModal = document.getElementById('install-guide-modal');
        if (installModal) {
            installModal.addEventListener('click', function (e) {
                if (e.target === installModal) closeInstallGuideModal();
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeInstallGuideModal();
            }
        });
    });

    window.NotmatikCommon = {
        escapeHtml: escapeHtml,
        toggleDarkMode: toggleDarkMode,
        getSavedGoals: getSavedGoals,
        setSavedGoals: setSavedGoals,
        updateSavedGoalsBadge: updateSavedGoalsBadge,
        showToast: showToast,
        detectPlatform: detectPlatform,
        triggerInstallApp: triggerInstallApp,
        dismissInstallBanner: dismissInstallBanner,
        closeInstallGuideModal: closeInstallGuideModal
    };

    window.toggleDarkMode = toggleDarkMode;
    window.triggerInstallApp = triggerInstallApp;
    window.dismissInstallBanner = dismissInstallBanner;
    window.closeInstallGuideModal = closeInstallGuideModal;
})();
