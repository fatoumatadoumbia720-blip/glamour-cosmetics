document.addEventListener('DOMContentLoaded', () => {
    const CART_KEY = 'glamourCosmeticsCart';
    let memoryCart = [];
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    const updateSiteFooter = () => {
        const footer = document.querySelector('footer');
        if (!footer) return;

        footer.classList.add('footer-minimal');

        footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Glamour Cosmetics</h3>
                    <p>Des produits de vos marques préférées pour révéler votre beauté, chaque jour.</p>
                </div>
                <div class="footer-section">
                    <h3>Contact</h3>
                    <p><a href="tel:+22372064730">+223 72 06 47 30</a></p>
                    <p><a href="mailto:fatoumatadoumbia720@gmail.com">fatoumatadoumbia720@gmail.com</a></p>
                </div>
            </div>
            <div class="footer-bottom"><p>&copy; 2026 Glamour Cosmetics. Tous droits réservés.</p></div>`;
    };

    updateSiteFooter();

    const readCart = () => {
        try {
            const value = JSON.parse(localStorage.getItem(CART_KEY));
            if (Array.isArray(value)) memoryCart = value;
            return Array.isArray(value) ? value : memoryCart;
        } catch (error) {
            return memoryCart;
        }
    };

    const writeCart = (cart) => {
        memoryCart = cart;
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch (error) {
            // Le panier reste utilisable pendant la session si le stockage est indisponible.
        }
        updateCartBadges(cart);
    };

    const updateCartBadges = (cart = readCart()) => {
        const quantity = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
        document.querySelectorAll('header .cart-count').forEach((badge) => {
            badge.textContent = quantity;
            badge.setAttribute('aria-label', `${quantity} article${quantity > 1 ? 's' : ''} dans le panier`);
        });
    };

    const formatPrice = (value) => `${Number(value).toFixed(2).replace('.', ',')} €`;

    const slugify = (value) => value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (hamburger && navLinks) {
        hamburger.setAttribute('role', 'button');
        hamburger.setAttribute('tabindex', '0');
        hamburger.setAttribute('aria-label', 'Ouvrir le menu');
        hamburger.setAttribute('aria-expanded', 'false');

        const toggleMenu = () => {
            const isOpen = navLinks.classList.toggle('active');
            hamburger.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
            document.body.classList.toggle('menu-open', isOpen);
        };

        hamburger.addEventListener('click', toggleMenu);
        hamburger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleMenu();
            }
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) toggleMenu();
            });
        });
    }

    if (header) {
        const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 10);
        updateHeader();
        window.addEventListener('scroll', updateHeader, { passive: true });
    }

    if (window.AOS) {
        window.AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    }

    document.querySelectorAll('[data-hero-carousel]').forEach((carousel) => {
        const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
        const dots = Array.from(carousel.querySelectorAll('.hero-carousel-dots button'));
        if (slides.length < 2) return;
        let currentSlide = 0;
        let carouselTimer;

        const showSlide = (index) => {
            currentSlide = (index + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === currentSlide));
            dots.forEach((dot, dotIndex) => {
                const isActive = dotIndex === currentSlide;
                dot.classList.toggle('active', isActive);
                if (isActive) dot.setAttribute('aria-current', 'true');
                else dot.removeAttribute('aria-current');
            });
        };

        const startCarousel = () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            clearInterval(carouselTimer);
            carouselTimer = setInterval(() => showSlide(currentSlide + 1), 2200);
        };

        dots.forEach((dot, index) => dot.addEventListener('click', () => {
            showSlide(index);
            startCarousel();
        }));
        carousel.addEventListener('mouseenter', () => clearInterval(carouselTimer));
        carousel.addEventListener('mouseleave', startCarousel);
        showSlide(0);
        startCarousel();
    });

    const productGrid = document.querySelector('.shop-catalog');
    const productSearch = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category');
    const sortFilter = document.getElementById('sort');
    const resultCount = document.getElementById('result-count');
    const searchFromUrl = new URLSearchParams(window.location.search).get('recherche')?.trim() || '';
    const normalizeSearch = (value) => value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const filterProducts = () => {
        if (!productGrid) return;
        const cards = Array.from(productGrid.querySelectorAll('.product-card'));
        const rawQuery = (productSearch?.value || searchFromUrl).trim();
        const query = normalizeSearch(rawQuery);
        const category = categoryFilter?.value || 'all';
        const sort = sortFilter?.value || 'featured';

        cards.forEach((card, index) => {
            if (!card.dataset.originalOrder) card.dataset.originalOrder = String(index);
            const searchableContent = normalizeSearch(card.textContent || '');
            const cardCategory = card.dataset.category || '';
            card.hidden = !((!query || searchableContent.includes(query)) && (category === 'all' || cardCategory === category));
        });

        productGrid.querySelectorAll('.shop-grid').forEach((brandGrid) => {
            Array.from(brandGrid.querySelectorAll('.product-card')).sort((a, b) => {
                const priceA = Number((a.querySelector('.price')?.textContent || '0').replace(/[^0-9,.-]/g, '').replace(',', '.'));
                const priceB = Number((b.querySelector('.price')?.textContent || '0').replace(/[^0-9,.-]/g, '').replace(',', '.'));
                if (sort === 'price-asc') return priceA - priceB;
                if (sort === 'price-desc') return priceB - priceA;
                return Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder);
            }).forEach((card) => brandGrid.appendChild(card));
        });

        productGrid.querySelectorAll('.brand-section').forEach((section) => {
            section.hidden = !Array.from(section.querySelectorAll('.product-card')).some((card) => !card.hidden);
        });

        const visible = cards.filter((card) => !card.hidden).length;
        if (resultCount) {
            resultCount.hidden = !rawQuery;
            resultCount.textContent = rawQuery
                ? `${visible} produit${visible > 1 ? 's' : ''} trouvé${visible > 1 ? 's' : ''} pour « ${rawQuery} »`
                : '';
        }
    };

    [productSearch, categoryFilter, sortFilter].forEach((control) => {
        if (control) control.addEventListener(control === productSearch ? 'input' : 'change', filterProducts);
    });
    filterProducts();

    document.querySelectorAll('.product-card .product-price').forEach((priceArea) => {
        if (!priceArea || priceArea.querySelector('.add-to-cart')) return;
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'add-to-cart';
        addButton.textContent = '+ Ajouter';
        priceArea.appendChild(addButton);
    });

    const addProductToCart = (addButton) => {
        const card = addButton.closest('.product-card');
        if (!card) return;
        const name = card.querySelector('.product-title')?.textContent.trim() || 'Produit Glamour';
        const priceText = card.querySelector('.price')?.textContent || '';
        const price = priceText ? Number(priceText.replace(/[^0-9,.-]/g, '').replace(',', '.')) : null;
        const image = card.querySelector('img')?.getAttribute('src') || '';
        const id = card.dataset.productId || slugify(name);
        const cart = readCart();
        const existing = cart.find((item) => item.id === id);

        if (existing) {
            existing.quantity += 1;
            existing.price = price;
            existing.pricePending = price === null;
            existing.image = image;
        }
        else cart.push({ id, name, price, pricePending: price === null, image, quantity: 1 });
        writeCart(cart);

        const originalText = addButton.textContent;
        addButton.textContent = 'Ajouté ✓';
        addButton.classList.add('added');
        setTimeout(() => {
            addButton.textContent = originalText;
            addButton.classList.remove('added');
        }, 1200);
    };

    window.glamourAddToCart = addProductToCart;
    document.querySelectorAll('.add-to-cart').forEach((addButton) => {
        addButton.addEventListener('click', () => addProductToCart(addButton));
    });

    document.querySelectorAll('.quick-view-btn').forEach((quickViewButton) => {
        quickViewButton.addEventListener('click', () => {
            const card = quickViewButton.closest('.product-card');
            const name = card?.querySelector('.product-title')?.textContent.trim() || 'Produit';
            const price = card?.querySelector('.price')?.textContent.trim() || '';
            const category = card?.querySelector('.product-category')?.textContent.trim() || '';
            showQuickView(name, category, price, card?.querySelector('img')?.getAttribute('src') || '');
        });
    });

    const showQuickView = (name, category, price, image) => {
        document.querySelector('.quick-view-modal')?.remove();
        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.innerHTML = `
            <div class="quick-view-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
                <button class="modal-close" type="button" data-close-modal aria-label="Fermer">&times;</button>
                <img src="${image}" alt="${name}">
                <div>
                    <p class="product-category">${category}</p>
                    <h2 id="quick-view-title">${name}</h2>
                    <p class="modal-price">${price}</p>
                    <p>Un produit sélectionné pour sa qualité, son confort et son fini élégant.</p>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-close-modal]')) modal.remove();
        });
        modal.querySelector('.modal-close')?.focus();
    };

    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const input = newsletterForm.querySelector('input[type="email"]');
            if (!input?.checkValidity()) {
                input?.reportValidity();
                return;
            }
            newsletterForm.innerHTML = '<p class="success-message" role="status">Merci ! Votre inscription a bien été prise en compte.</p>';
        });
    }

    const openSiteSearch = () => {
        document.querySelector('.site-search-modal')?.remove();
        const modal = document.createElement('div');
        modal.className = 'site-search-modal';
        modal.innerHTML = `
            <div class="site-search-dialog" role="dialog" aria-modal="true" aria-labelledby="site-search-title">
                <button class="site-search-close" type="button" aria-label="Fermer la recherche">&times;</button>
                <h2 id="site-search-title">Rechercher un produit</h2>
                <form>
                    <label class="sr-only" for="site-search-input">Nom du produit ou de la marque</label>
                    <input id="site-search-input" type="search" placeholder="Ex. Fenty, parfum, gloss…" required>
                    <button type="submit">Rechercher</button>
                </form>
            </div>`;
        document.body.appendChild(modal);
        const searchInput = modal.querySelector('input');
        if (searchInput) searchInput.value = searchFromUrl;
        const closeSearch = () => modal.remove();
        modal.querySelector('.site-search-close')?.addEventListener('click', closeSearch);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeSearch();
        });
        modal.querySelector('form')?.addEventListener('submit', (event) => {
            event.preventDefault();
            const term = modal.querySelector('input')?.value.trim() || '';
            if (term) window.location.href = `boutique.html?recherche=${encodeURIComponent(term)}`;
        });
        searchInput?.focus();
    };

    document.querySelectorAll('.search-icon').forEach((link) => {
        link.setAttribute('aria-label', 'Rechercher un produit');
        link.setAttribute('href', '#recherche');
        link.addEventListener('click', (event) => {
            event.preventDefault();
            openSiteSearch();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') document.querySelector('.site-search-modal')?.remove();
    });

    updateCartBadges();
    window.glamourCart = { read: readCart, write: writeCart, formatPrice, updateBadges: updateCartBadges };
    document.documentElement.dataset.glamourReady = 'true';
});
