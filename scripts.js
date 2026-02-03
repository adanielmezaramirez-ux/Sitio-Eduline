document.addEventListener('DOMContentLoaded', function() {
    
    // Variables globales
    let currentLanguage = 'es';
    let translations = {};
    
    // Inicialización del año actual
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // ========== NAVBAR SCROLL EFFECT ==========
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // ========== SMOOTH SCROLLING ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = navbar.offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Cerrar el navbar en móvil después de hacer clic
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            }
        });
    });
    
    // ========== SCROLL TO TOP BUTTON ==========
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'block';
            setTimeout(() => {
                scrollToTopBtn.style.opacity = '1';
            }, 10);
        } else {
            scrollToTopBtn.style.opacity = '0';
            setTimeout(() => {
                scrollToTopBtn.style.display = 'none';
            }, 300);
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // ========== INTERSECTION OBSERVER FOR ANIMATIONS ==========
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observar elementos animables
    document.querySelectorAll('.feature-card, .plan-card, .cta-content').forEach(el => {
        observer.observe(el);
    });
    
    // ========== CONTACT FORM VALIDATION ==========
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!contactForm.checkValidity()) {
                e.stopPropagation();
                contactForm.classList.add('was-validated');
                return;
            }
            
            // Obtener datos del formulario
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone')?.value || '',
                message: document.getElementById('message').value
            };
            
            // Simular envío exitoso
            showNotification('¡Mensaje enviado exitosamente! Te contactaremos pronto.', 'success');
            
            // Resetear formulario
            contactForm.reset();
            contactForm.classList.remove('was-validated');
            
            // Aquí iría la llamada AJAX real
            // sendFormData(formData);
        });
    }
    
    // ========== NEWSLETTER FORM ==========
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            if (!isValidEmail(email)) {
                showNotification('Por favor, introduce un correo electrónico válido.', 'error');
                return;
            }
            
            showNotification('¡Gracias por suscribirte! Recibirás nuestras novedades.', 'success');
            emailInput.value = '';
        });
    }
    
    // ========== LANGUAGE SYSTEM ==========
    const languageSelect = document.getElementById('languageSelect');
    
    // Mapeo de códigos de idioma (código HTML -> código de archivo)
    const languageMap = {
        'es': 'es',
        'en': 'en',
        'pt': 'por',  // Mapear pt a por para los archivos idiomas_por.json
        'por': 'por'
    };
    
    function getBasePath() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/mnt/user-data/outputs')) {
            return './idiomas_';
        }
        return './idiomas/';
    }
    
    async function loadLanguage(lang) {
        try {
            // Mapear el código de idioma si es necesario
            const mappedLang = languageMap[lang] || lang;
            
            // Intentar diferentes rutas
            const paths = [
                `./idiomas/${mappedLang}.json`,
                `./idiomas_${mappedLang}.json`,
                `idiomas/${mappedLang}.json`,
                `idiomas_${mappedLang}.json`
            ];
            
            let response = null;
            for (const path of paths) {
                try {
                    response = await fetch(path, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        cache: 'no-cache'
                    });
                    
                    if (response.ok) {
                        console.log(`Idioma cargado desde: ${path}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!response || !response.ok) {
                console.error('No se pudo cargar el archivo de idioma para:', lang);
                return;
            }
            
            translations = await response.json();
            currentLanguage = lang;
            
            // Actualizar todos los elementos con data-i18n
            updateAllTranslations();
            
            // Actualizar título de la página
            if (translations.pageTitle) {
                document.title = translations.pageTitle;
            }
            
            // Actualizar selector de idioma
            if (languageSelect) {
                languageSelect.value = lang;
            }
            
            // Actualizar texto del tema
            updateThemeText();
            
            // Guardar preferencia
            savePreferences();
            
            console.log(`Idioma cargado exitosamente: ${lang} (${mappedLang})`);
            
        } catch (error) {
            console.error('Error cargando idioma:', error);
        }
    }
    
    function updateAllTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = getNestedTranslation(translations, key);
            
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Actualizar contenido de modales si están abiertos
        const modalElement = document.getElementById('dynamicModal');
        if (modalElement && modalElement.classList.contains('show')) {
            const modalType = modalElement.getAttribute('data-current-modal');
            if (modalType) {
                updateModalContent(modalType);
            }
        }
    }
    
    function getNestedTranslation(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            loadLanguage(this.value);
        });
    }
    
    // ========== THEME TOGGLE ==========
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            body.classList.toggle('dark-mode');
            updateThemeText();
            applyThemeToAllElements();
            savePreferences();
            
            // Animar el cambio
            body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        });
    }
    
    function applyThemeToAllElements() {
        // Forzar actualización de estilos en todos los elementos
        const isDark = body.classList.contains('dark-mode');
        
        // Actualizar secciones
        document.querySelectorAll('.bg-light, .bg-white').forEach(el => {
            el.style.transition = 'background-color 0.3s ease';
        });
        
        // Actualizar cards
        document.querySelectorAll('.card').forEach(el => {
            el.style.transition = 'background-color 0.3s ease, border-color 0.3s ease';
        });
        
        // Actualizar formularios
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';
        });
        
        // Forzar repaint
        setTimeout(() => {
            document.body.style.display = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.display = '';
        }, 10);
    }
    
    function updateThemeText() {
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('.theme-text');
        
        if (body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
            if (text && translations.themeLight) {
                text.textContent = ' ' + translations.themeLight;
            } else if (text) {
                text.textContent = ' Claro';
            }
        } else {
            icon.className = 'fas fa-moon';
            if (text && translations.themeDark) {
                text.textContent = ' ' + translations.themeDark;
            } else if (text) {
                text.textContent = ' Oscuro';
            }
        }
    }
    
    // ========== MODAL SYSTEM ==========
    const modalLinks = document.querySelectorAll('.modal-link');
    const modalElement = document.getElementById('dynamicModal');
    let dynamicModal = null;
    
    if (modalElement) {
        dynamicModal = new bootstrap.Modal(modalElement);
    }
    
    const modalTitle = document.getElementById('dynamicModalTitle');
    const modalContent = document.getElementById('dynamicModalContent');
    
    function updateModalContent(modalType) {
        if (!modalTitle || !modalContent) return;
        
        const titleKey = `modal.${modalType}.title`;
        const contentKey = `modal.${modalType}.content`;
        
        const title = getNestedTranslation(translations, titleKey);
        const content = getNestedTranslation(translations, contentKey);
        
        if (title) modalTitle.textContent = title;
        if (content) modalContent.innerHTML = content;
    }
    
    modalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const modalType = this.getAttribute('data-modal');
            
            if (modalType && dynamicModal) {
                modalElement.setAttribute('data-current-modal', modalType);
                updateModalContent(modalType);
                dynamicModal.show();
            }
        });
    });
    
    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalElement?.classList.contains('show')) {
            dynamicModal?.hide();
        }
    });
    
    // ========== VIDEO CONTROLS ==========
    const heroVideo = document.getElementById('heroVideo');
    
    if (heroVideo) {
        // Pausar/reproducir al hacer clic
        heroVideo.addEventListener('click', function() {
            if (this.paused) {
                this.play();
            } else {
                this.pause();
            }
        });
        
        // Asegurar que el video se reproduzca en loop
        heroVideo.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        });
    }
    
    // ========== PREFERENCES STORAGE ==========
    function savePreferences() {
        try {
            const preferences = {
                language: currentLanguage,
                darkMode: body.classList.contains('dark-mode')
            };
            localStorage.setItem('edulinePreferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error guardando preferencias:', error);
        }
    }
    
    function loadPreferences() {
        try {
            const savedPreferences = localStorage.getItem('edulinePreferences');
            if (savedPreferences) {
                const preferences = JSON.parse(savedPreferences);
                
                // Cargar idioma
                if (preferences.language) {
                    currentLanguage = preferences.language;
                }
                
                // Cargar tema
                if (preferences.darkMode) {
                    body.classList.add('dark-mode');
                    applyThemeToAllElements();
                }
                
                updateThemeText();
            }
        } catch (error) {
            console.error('Error cargando preferencias:', error);
        }
    }
    
    // ========== UTILITY FUNCTIONS ==========
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function showNotification(message, type = 'info') {
        // Crear contenedor de notificaciones si no existe
        let notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }
        
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show shadow-lg`;
        notification.style.cssText = 'margin-bottom: 10px; border-radius: 10px;';
        notification.innerHTML = `
            <strong>${type === 'error' ? '❌' : '✅'}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // ========== PLAN CARD INTERACTIONS ==========
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('plan-highlight')) {
                this.style.transform = 'translateY(-10px)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('plan-highlight')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });
    
    // ========== CAROUSEL AUTO-PLAY ==========
    const carousel = document.getElementById('featuresCarousel');
    if (carousel) {
        const bsCarousel = new bootstrap.Carousel(carousel, {
            interval: 5000,
            wrap: true,
            touch: true
        });
    }
    
    // ========== LOADING ANIMATION ==========
    function addLoadingAnimations() {
        const elementsToAnimate = document.querySelectorAll('.feature-card, .plan-card');
        
        elementsToAnimate.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }
    
    // ========== INITIALIZATION ==========
    function initializeApp() {
        // Cargar preferencias
        loadPreferences();
        
        // Cargar idioma
        loadLanguage(currentLanguage);
        
        // Añadir animaciones
        setTimeout(addLoadingAnimations, 100);
        
        // Inicializar tooltips de Bootstrap si existen
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Ejecutar inicialización
    initializeApp();
    
    // ========== PREVENT FORM RESUBMISSION ON PAGE RELOAD ==========
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
    
    // ========== LAZY LOADING IMAGES ==========
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // ========== ACCESSIBILITY IMPROVEMENTS ==========
    // Añadir indicadores de enfoque mejorados
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-nav');
    });
    
    // ========== PERFORMANCE OPTIMIZATION ==========
    // Debounce para eventos de scroll
    let scrollTimeout;
    let lastScrollPosition = window.pageYOffset;
    
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            lastScrollPosition = window.pageYOffset;
        }, 100);
    }, { passive: true });
    
});

// ========== GLOBAL FUNCTIONS ==========
// Función global para cambiar idioma
window.changeLanguage = function(lang) {
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = lang;
        languageSelect.dispatchEvent(new Event('change'));
    }
};

// Prevenir errores en consola
window.addEventListener('error', function(e) {
    console.error('Error capturado:', e.message);
    return true;
});

// Exportar para uso en consola (desarrollo)
window.edulineApp = {
    version: '2.0',
    changeLanguage: window.changeLanguage
};