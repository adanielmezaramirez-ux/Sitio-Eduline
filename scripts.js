document.addEventListener('DOMContentLoaded', function() {
    
    // Variables globales
    let currentLanguage = 'es';
    let translations = {};
    const BASE_PATH = window.location.origin + window.location.pathname;
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Smooth scrolling para enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animación de contadores para estadísticas (si agregas alguna)
    const counters = document.querySelectorAll('.counter');
    const speed = 200;
    
    const animateCounters = () => {
        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                
                const inc = target / speed;
                
                if (count < target) {
                    counter.innerText = Math.ceil(count + inc);
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target;
                }
            };
            
            updateCount();
        });
    };
    
    // Observador de intersección para animaciones al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                // Si es un contador, iniciar animación
                if (entry.target.classList.contains('counter')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);
    
    // Observar elementos que deben animarse al aparecer
    document.querySelectorAll('.feature-card, .plan-card, .section-title').forEach(el => {
        observer.observe(el);
    });
    
    // Efecto de escritura para el banner (opcional)
    const bannerText = document.querySelector('.banner-content h1');
    if (bannerText) {
        const text = bannerText.textContent;
        bannerText.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                bannerText.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        // Descomentar para activar efecto de escritura
        // setTimeout(typeWriter, 500);
    }
    
    // Validación del formulario
    const emailForm = document.querySelector('.email-form form');
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            if (!isValidEmail(email)) {
                showAlert('Por favor, introduce un correo electrónico válido.', 'error');
                return;
            }
            
            // Simular envío
            showAlert('¡Gracias! Te contactaremos pronto.', 'success');
            emailInput.value = '';
            
            // Aquí iría la llamada AJAX para enviar el correo
        });
    }
    
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function showAlert(message, type) {
        // Eliminar alerta anterior si existe
        const existingAlert = document.querySelector('.form-alert');
        if (existingAlert) existingAlert.remove();
        
        // Crear nueva alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = `form-alert alert alert-${type === 'error' ? 'danger' : 'success'} mt-3`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = 'border-radius: 50px; padding: 15px 25px;';
        
        // Insertar después del formulario
        emailForm.parentNode.insertBefore(alertDiv, emailForm.nextSibling);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    // Efecto hover para tarjetas de plan (mejorado)
    const planCards = document.querySelectorAll('.plan-card');
    planCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('plan-highlight')) {
                this.style.transform = 'translateY(0) scale(1)';
            } else {
                this.style.transform = 'translateY(-15px) scale(1.05)';
            }
        });
    });
    
    // Sistema de idiomas - Inicialización
    const languageSelect = document.getElementById('languageSelect');
    
    // Configurar rutas base para los archivos de idioma
    function getBasePath() {
        // Si el archivo está en la raíz del proyecto
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            return './idiomas/';
        } else {
            // Si está en una subcarpeta, ajustar la ruta
            const pathArray = window.location.pathname.split('/');
            pathArray.pop(); // Remover el nombre del archivo actual
            const basePath = pathArray.join('/') + '/idiomas/';
            return basePath || './idiomas/';
        }
    }
    
    const LANGUAGE_PATH = getBasePath();
    
    // Función robusta para cargar idiomas
    async function loadLanguage(lang) {
        try {
            const response = await fetch(`${LANGUAGE_PATH}${lang}.json`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            translations = await response.json();
            
            // Actualizar todos los elementos con data-i18n
            updateAllTranslations();
            
            // Actualizar título de la página
            document.title = translations['pageTitle'] || 'EDULINE';
            
            // Actualizar selector de idioma
            if (languageSelect) {
                languageSelect.value = lang;
            }
            
            // Actualizar texto del tema
            updateThemeText();
            
            console.log(`Idioma cargado exitosamente: ${lang}`);
            
            // Guardar preferencias
            savePreferences();
            
        } catch (error) {
            console.error('Error cargando archivo de idioma:', error);
            
            // Intentar cargar desde ubicación alternativa
            try {
                const fallbackResponse = await fetch(`./idiomas/${lang}.json`);
                if (fallbackResponse.ok) {
                    translations = await fallbackResponse.json();
                    updateAllTranslations();
                    console.log(`Idioma cargado desde ruta alternativa: ${lang}`);
                } else {
                    // Cargar idioma por defecto si hay error
                    if (lang !== 'es') {
                        console.log('Cargando idioma por defecto: es');
                        loadLanguage('es');
                    } else {
                        // Si estamos intentando cargar español y falla, mostrar advertencia
                        console.warn('No se pudo cargar ningún archivo de idioma. Usando texto por defecto.');
                    }
                }
            } catch (fallbackError) {
                console.error('Error en intento alternativo:', fallbackError);
                if (lang !== 'es') {
                    loadLanguage('es');
                }
            }
        }
    }
    
    // Función para actualizar todas las traducciones
    function updateAllTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            applyTranslation(element, key);
        });
        
        // Actualizar contenido de modales si están abiertos
        updateModalContent();
    }
    
    // Función para aplicar traducción a un elemento
    function applyTranslation(element, key) {
        if (!key || !translations) return;
        
        // Buscar traducción anidada (ej: "nav.home")
        const keys = key.split('.');
        let translation = translations;
        
        for (const k of keys) {
            if (translation && translation[k] !== undefined) {
                translation = translation[k];
            } else {
                translation = null;
                break;
            }
        }
        
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.hasAttribute('title')) {
                element.title = translation;
            } else if (element.hasAttribute('alt')) {
                element.alt = translation;
            } else if (element.hasAttribute('value')) {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        } else {
            console.warn(`Traducción no encontrada para clave: ${key}`);
        }
    }
    
    // Actualizar contenido de modales basados en idioma
    function updateModalContent() {
        const modal = document.getElementById('dynamicModal');
        if (modal && modal.classList.contains('show')) {
            const modalType = modal.getAttribute('data-current-modal');
            if (modalType && modalContentData[modalType]) {
                const titleKey = `modal.${modalType}.title`;
                const contentKey = `modal.${modalType}.content`;
                
                if (translations[titleKey]) {
                    modalTitle.textContent = translations[titleKey];
                }
                
                if (translations[contentKey]) {
                    modalContent.innerHTML = translations[contentKey];
                }
            }
        }
    }
    
    // Cargar idioma por defecto
    loadLanguage('es');
    
    // Evento para cambiar idioma
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            currentLanguage = this.value;
            loadLanguage(currentLanguage);
        });
    }
    
    // Sistema de modo oscuro/claro
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Cargar preferencias del usuario
    loadPreferences();
    
    // Evento para cambiar tema
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            body.classList.toggle('dark-mode');
            
            // Ajustar el video si existe
            const videoBanner = document.querySelector('.video-banner');
            const heroVideo = document.getElementById('heroVideo');
            
            if (videoBanner && heroVideo) {
                if (body.classList.contains('dark-mode')) {
                    videoBanner.classList.add('dark-video');
                    // Reducir brillo del video en modo oscuro
                    heroVideo.style.filter = 'brightness(0.7)';
                } else {
                    videoBanner.classList.remove('dark-video');
                    heroVideo.style.filter = 'brightness(1)';
                }
            }
            
            updateThemeText();
            savePreferences();
        });
    }
    
    function updateThemeText() {
        const themeText = document.querySelector('.theme-text');
        if (themeText) {
            if (body.classList.contains('dark-mode')) {
                themeText.textContent = translations ? (translations['themeLight'] || 'Claro') : 'Claro';
                if (themeToggle) {
                    const icon = themeToggle.querySelector('i');
                    if (icon) icon.className = 'fas fa-sun';
                }
            } else {
                themeText.textContent = translations ? (translations['themeDark'] || 'Oscuro') : 'Oscuro';
                if (themeToggle) {
                    const icon = themeToggle.querySelector('i');
                    if (icon) icon.className = 'fas fa-moon';
                }
            }
        }
    }
    
    // Control de video del banner
    const videoToggle = document.getElementById('videoToggle');
    const videoVolume = document.getElementById('videoVolume');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const heroVideo = document.getElementById('heroVideo');
    
    if (heroVideo && videoToggle) {
        videoToggle.addEventListener('click', function() {
            if (heroVideo.paused) {
                heroVideo.play();
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'inline';
            } else {
                heroVideo.pause();
                if (playIcon) playIcon.style.display = 'inline';
                if (pauseIcon) pauseIcon.style.display = 'none';
            }
        });
        
        // Actualizar icono cuando el video se pausa automáticamente
        heroVideo.addEventListener('pause', function() {
            if (playIcon) playIcon.style.display = 'inline';
            if (pauseIcon) pauseIcon.style.display = 'none';
        });
        
        heroVideo.addEventListener('play', function() {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'inline';
        });
    }
    
    if (videoVolume && heroVideo) {
        videoVolume.addEventListener('click', function() {
            heroVideo.muted = !heroVideo.muted;
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = heroVideo.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            }
        });
    }
    
    // Sistema de modales para enlaces del footer
    const modalLinks = document.querySelectorAll('.modal-link');
    const modalElement = document.getElementById('dynamicModal');
    let dynamicModal = null;
    
    if (modalElement) {
        dynamicModal = new bootstrap.Modal(modalElement);
    }
    
    const modalTitle = document.getElementById('dynamicModalTitle');
    const modalContent = document.getElementById('dynamicModalContent');
    
    // Contenido de los modales (por defecto en español)
    const modalContentData = {
        privacy: {
            title: 'Política de Privacidad',
            content: `
                <h3>1. Información que recopilamos</h3>
                <p>Recopilamos información que usted nos proporciona directamente...</p>
                <!-- Resto del contenido -->
            `
        },
        terms: {
            title: 'Términos de Servicio',
            content: `
                <h3>1. Aceptación de los términos</h3>
                <p>Al acceder y utilizar los servicios de EDULINE...</p>
                <!-- Resto del contenido -->
            `
        },
        faq: {
            title: 'Preguntas Frecuentes',
            content: `
                <h3>1. ¿Cómo puedo comenzar con EDULINE?</h3>
                <p>Para comenzar, simplemente haga clic en cualquier botón...</p>
                <!-- Resto del contenido -->
            `
        },
        blog: {
            title: 'Blog Educativo',
            content: `
                <h3>Últimas tendencias en educación digital</h3>
                <p>En EDULINE, creemos en la importancia de mantenerse actualizado...</p>
                <!-- Resto del contenido -->
            `
        }
    };
    
    // Evento para abrir modales
    modalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const modalType = this.getAttribute('data-modal');
            
            if (modalType && dynamicModal && modalTitle && modalContent) {
                // Guardar el tipo de modal actual
                modalElement.setAttribute('data-current-modal', modalType);
                
                // Actualizar título y contenido según el idioma actual
                const titleKey = `modal.${modalType}.title`;
                const contentKey = `modal.${modalType}.content`;
                
                if (translations && translations[titleKey]) {
                    modalTitle.textContent = translations[titleKey];
                } else {
                    modalTitle.textContent = modalContentData[modalType]?.title || modalType;
                }
                
                if (translations && translations[contentKey]) {
                    modalContent.innerHTML = translations[contentKey];
                } else if (modalContentData[modalType]) {
                    modalContent.innerHTML = modalContentData[modalType].content;
                } else {
                    modalContent.innerHTML = `<p>Contenido no disponible en este idioma.</p>`;
                }
                
                dynamicModal.show();
            }
        });
    });
    
    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalElement && modalElement.classList.contains('show')) {
            if (dynamicModal) dynamicModal.hide();
        }
    });
    
    // Guardar y cargar preferencias del usuario
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
                if (preferences.language && preferences.language !== currentLanguage) {
                    currentLanguage = preferences.language;
                    // El idioma se cargará automáticamente más adelante
                }
                
                // Cargar tema
                if (preferences.darkMode) {
                    body.classList.add('dark-mode');
                    const videoBanner = document.querySelector('.video-banner');
                    const heroVideo = document.getElementById('heroVideo');
                    
                    if (videoBanner && heroVideo) {
                        videoBanner.classList.add('dark-video');
                        heroVideo.style.filter = 'brightness(0.7)';
                    }
                }
            }
        } catch (error) {
            console.error('Error cargando preferencias:', error);
        }
    }
    
    // Inicializar tooltips de Bootstrap (si los usas)
    if (typeof $ !== 'undefined') {
        $('[data-toggle="tooltip"]').tooltip();
    }
    
    // Efecto de aparición gradual para elementos
    const fadeElements = document.querySelectorAll('.feature-card, .plan-card, .section-title');
    fadeElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 * index);
    });
    
    // Función para inicializar/reinicializar la página
    function initializePage() {
        // Forzar actualización de estilos
        setTimeout(() => {
            updateThemeText();
            
            // Asegurar que todos los elementos tengan colores correctos
            if (body.classList.contains('dark-mode')) {
                // Aplicar clase adicional para modo oscuro
                document.querySelectorAll('.feature-card, .plan-card, .modal-content').forEach(el => {
                    el.classList.add('dark-mode-element');
                });
            }
            
            // Asegurar que el idioma esté cargado
            if (Object.keys(translations).length === 0) {
                loadLanguage(currentLanguage);
            }
        }, 100);
    }
    
    // Ejecutar inicialización
    initializePage();
    
    // Escuchar cambios en la ruta para detectar cambios de página
    let lastPath = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            // Recargar traducciones si cambia la página
            setTimeout(() => loadLanguage(currentLanguage), 500);
        }
    }, 1000);
});

// Función global para cambiar idioma manualmente si es necesario
function changeLanguage(lang) {
    if (window.edulineApp && window.edulineApp.loadLanguage) {
        window.edulineApp.loadLanguage(lang);
    }
}

// Exportar funciones para uso global (opcional)
window.edulineApp = {
    changeLanguage: function(lang) {
        if (document.edulineTranslations) {
            document.edulineTranslations.loadLanguage(lang);
        }
    }
};

