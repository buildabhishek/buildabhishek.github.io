'use strict';

// ─────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────

const debounce = (fn, ms) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const throttle = (fn, ms) => {
    let last = 0;
    return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
};

const sanitize = (str) => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };

const track = (category, action, label) => {
    if (typeof gtag !== 'undefined') gtag('event', action, { event_category: category, event_label: label });
    if (typeof plausible !== 'undefined') plausible(action, { props: { category, label } });
    if (/localhost|127\.0\.0\.1/.test(location.hostname)) console.log('%c📊 Track', 'color:#0073e6;font-weight:bold', { category, action, label });
};

// ─────────────────────────────────────────────────────
// DOM READY
// ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initNavbarScroll();
    initMobileMenu();
    initThemeToggle();
    initScrollSpy();
    initSmoothScroll();
    initScrollReveal();
    initTypewriter();
    initStatCounters();
    initProgressBars();
    initContactForm();
    initBackToTop();
    initEmailCopy();
    initAccessibility();
    initNetworkBanner();
    initKonamiEgg();
    initProjectFilters();
    initHeroCanvas();
    printConsoleMessage();

    track('Page', 'View', document.title);

    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    document.querySelectorAll('.copy-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-copy');
            if (navigator.clipboard && text) {
                navigator.clipboard.writeText(text).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                });
            }
        });
    });
});

// ─────────────────────────────────────────────────────
// 1. SCROLL PROGRESS BAR
// ─────────────────────────────────────────────────────

function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.prepend(bar);

    const update = throttle(() => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const pct = (scrollTop / (scrollHeight - clientHeight)) * 100;
        bar.style.width = pct + '%';
    }, 16);

    window.addEventListener('scroll', update, { passive: true });
}

// ─────────────────────────────────────────────────────
// 2. NAVBAR — SCROLLED CLASS
// ─────────────────────────────────────────────────────

function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const onScroll = throttle(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, 100);
    window.addEventListener('scroll', onScroll, { passive: true });
}

// ─────────────────────────────────────────────────────
// 3. MOBILE MENU — FIXED
// ─────────────────────────────────────────────────────

function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navbar = document.getElementById('navbar');
    if (!hamburger || !navbar) return;

    const navUl = navbar.querySelector('ul');
    if (!navUl) return;

    // Backdrop
    let backdrop = document.getElementById('nav-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'nav-backdrop';
        backdrop.style.cssText = `
            display:none; position:fixed; inset:0; z-index:999;
            background:rgba(0,0,0,0.5);
        `;
        document.body.appendChild(backdrop);
    }

    const isMobile = () => window.innerWidth <= 768;

    const open = () => {
        navUl.classList.add('open');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-open');
        if (isMobile()) {
            document.body.style.overflow = 'hidden';
            backdrop.style.display = 'block';
            backdrop.style.opacity = '1';
        }
    };

    const close = () => {
        navUl.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
        document.body.style.overflow = '';
        backdrop.style.opacity = '0';
        backdrop.style.display = 'none';
    };

    const toggle = () => (navUl.classList.contains('open') ? close() : open());

    hamburger.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    backdrop.addEventListener('click', close);
    navUl.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navUl.classList.contains('open')) { close(); hamburger.focus(); }
    });

    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768) close();
    }, 200));
}

// ─────────────────────────────────────────────────────
// 4. THEME TOGGLE
// ─────────────────────────────────────────────────────

function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const sunIcon = btn?.querySelector('.sun-icon');
    const moonIcon = btn?.querySelector('.moon-icon');
    if (!btn) return;

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (sunIcon) sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
        if (moonIcon) moonIcon.style.display = theme === 'light' ? 'block' : 'none';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    };

    const saved = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || system);

    btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);
        announceToSR(`Switched to ${next} mode`);
        track('Settings', 'Theme', next);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
    });
}

// ─────────────────────────────────────────────────────
// 5. SCROLL SPY
// ─────────────────────────────────────────────────────

function initScrollSpy() {
    const sections = document.querySelectorAll('main section[id], header[id]');
    const navLinks = document.querySelectorAll('#navbar ul a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;

    const spy = throttle(() => {
        let current = '';
        sections.forEach((sec) => {
            if (window.scrollY >= sec.offsetTop - navH - 40) current = sec.id;
        });
        navLinks.forEach((a) => {
            a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
        });
    }, 80);

    window.addEventListener('scroll', spy, { passive: true });
    spy();
}

// ─────────────────────────────────────────────────────
// 6. SMOOTH SCROLL
// ─────────────────────────────────────────────────────

function initSmoothScroll() {
    const navH = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') { e.preventDefault(); return; }
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();

            // Close mobile menu if open and clear overlay state.
            const navUl = document.querySelector('#navbar ul');
            const backdrop = document.getElementById('nav-backdrop');
            const hamburger = document.getElementById('hamburger');
            if (navUl && navUl.classList.contains('open')) {
                navUl.classList.remove('open');
                document.body.classList.remove('nav-open');
                document.body.style.overflow = '';
            }
            if (backdrop) {
                backdrop.style.opacity = '0';
                backdrop.style.display = 'none';
            }
            if (hamburger) {
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }

            const top = target.getBoundingClientRect().top + window.scrollY - navH();
            if (target.classList.contains('fade-up') && !target.classList.contains('visible')) {
                target.classList.add('visible');
            }
            window.scrollTo({ top, behavior: 'smooth' });
            history.pushState(null, '', href);
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
            setTimeout(() => target.removeAttribute('tabindex'), 800);
            track('Nav', 'Scroll', href.slice(1));
        });
    });

    if (location.hash) {
        setTimeout(() => {
            const target = document.querySelector(location.hash);
            if (target) {
                if (target.classList.contains('fade-up') && !target.classList.contains('visible')) {
                    target.classList.add('visible');
                }
                const top = target.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72 + 10);
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }, 150);
    }
}

// ─────────────────────────────────────────────────────
// 7. SCROLL REVEAL
// ─────────────────────────────────────────────────────

function initScrollReveal() {
    const els = document.querySelectorAll('.fade-up');
    if (!els.length) return;

    const revealElement = (el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 72 && rect.bottom > 0) {
            el.classList.add('visible');
        }
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('visible'), i * 40);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => observer.observe(el));

    const revealOnScroll = throttle(() => {
        els.forEach((el) => {
            if (!el.classList.contains('visible')) revealElement(el);
        });
    }, 100);

    revealOnScroll();
    window.addEventListener('scroll', revealOnScroll, { passive: true });
}

// ─────────────────────────────────────────────────────
// 8. TYPEWRITER — FIXED: No floating dot artifact
// ─────────────────────────────────────────────────────

function initTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;

    const phrases = [
        'Full Stack Developer',
        'Python Backend Engineer',
        'DevOps Engineer',
        'Data Analyst',
        'AI/ML Engineer',
        'Problem Solver',
    ];

    let pi = 0, ci = 0, deleting = false;
    // FIX: Start with empty string not undefined
    el.textContent = '';

    const tick = () => {
        const phrase = phrases[pi];

        if (deleting) {
            ci--;
            el.textContent = phrase.slice(0, ci);
        } else {
            ci++;
            el.textContent = phrase.slice(0, ci);
        }

        if (!deleting && ci === phrase.length) {
            deleting = true;
            setTimeout(tick, 1200);
            return;
        }
        if (deleting && ci === 0) {
            deleting = false;
            pi = (pi + 1) % phrases.length;
            setTimeout(tick, 300);
            return;
        }

        setTimeout(tick, deleting ? 40 : 70);
    };

    setTimeout(tick, 600);
}

// ─────────────────────────────────────────────────────
// 9. STAT COUNTERS
// ─────────────────────────────────────────────────────

function initStatCounters() {
    const stats = document.querySelectorAll('.stats li strong');
    if (!stats.length) return;

    const animate = (el) => {
        const raw = el.textContent.trim();
        const match = raw.match(/^(\d+)(.*)$/);
        if (!match) return;
        const end = parseInt(match[1]);
        const suffix = match[2];
        const steps = 50;
        const inc = end / steps;
        let cur = 0, step = 0;

        const frame = () => {
            step++;
            cur = Math.min(Math.round(inc * step), end);
            el.textContent = cur + suffix;
            if (cur < end) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { animate(e.target); observer.unobserve(e.target); }
            });
        },
        { threshold: 0.6 }
    );
    stats.forEach((s) => observer.observe(s));
}

// ─────────────────────────────────────────────────────
// 10. PROGRESS BARS
// ─────────────────────────────────────────────────────

function initProgressBars() {
    const fills = document.querySelectorAll('.progress-fill');
    if (!fills.length) return;

    fills.forEach((f) => { f.dataset.target = f.style.width; f.style.width = '0%'; });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    setTimeout(() => { e.target.style.width = e.target.dataset.target; }, 120);
                    observer.unobserve(e.target);
                }
            });
        },
        { threshold: 0.4 }
    );
    fills.forEach((f) => observer.observe(f));
}

// ─────────────────────────────────────────────────────
// 11. CONTACT FORM (FINAL FIXED VERSION)
// ─────────────────────────────────────────────────────

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSo-aU0BAU_-PxBb4dRVmZz71bRT3FfE7urpQ3AZaeoj6IpXvvXhsRth1LScuQn80Z0Q/exec';

function initContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (!form || !status) return;

    const nameEl = form.querySelector('[name="name"]');
    const emailEl = form.querySelector('[name="email"]');
    const subjectEl = form.querySelector('[name="subject"]'); // ✅ added
    const messageEl = form.querySelector('[name="message"]');
    const honeypotEl = form.querySelector('[name="_gotcha"]'); // ✅ added
    const submitBtn = form.querySelector('button[type="submit"]');

    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ─── Email validation ───
    const validateEmail = debounce(() => {
        const v = emailEl.value.trim();
        const ok = !v || emailRx.test(v);
        emailEl.style.borderColor = ok ? '' : 'var(--danger)';
        emailEl.setAttribute('aria-invalid', String(!ok));
    }, 400);

    emailEl?.addEventListener('input', validateEmail);
    emailEl?.addEventListener('blur', validateEmail);

    // ─── Character counter ───
    if (messageEl) {
        const MAX = 1000;
        messageEl.setAttribute('maxlength', MAX);

        const counter = document.createElement('span');
        counter.className = 'char-counter';
        counter.style.cssText = 'display:block;text-align:right;font-size:.8rem;color:var(--text-3);margin-top:4px;';
        messageEl.parentElement.appendChild(counter);

        const updateCount = () => {
            const len = messageEl.value.length;
            counter.textContent = `${len} / ${MAX}`;
            counter.style.color = (MAX - len < 100) ? 'var(--danger)' : 'var(--text-3)';
        };

        messageEl.addEventListener('input', updateCount);
        updateCount();
    }

    // ─── Rate limit ───
    let lastSubmit = 0;
    const LIMIT_MS = 60_000;

    // ─── Form submit ───
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        hideStatus();

        const name = nameEl?.value.trim() ?? '';
        const email = emailEl?.value.trim() ?? '';
        const subject = subjectEl?.value.trim() ?? '';
        const message = messageEl?.value.trim() ?? '';
        const honeypot = honeypotEl?.value ?? '';

        // 🔒 Honeypot check
        if (honeypot) return;

        // 🔒 Validation
        if (!name || !email || !message)
            return showStatus('⚠️ Please fill in all required fields.', 'error');

        if (name.length < 2)
            return showStatus('⚠️ Name must be at least 2 characters.', 'error');

        if (!emailRx.test(email))
            return showStatus('⚠️ Please enter a valid email.', 'error');

        if (message.length < 10)
            return showStatus('⚠️ Message must be at least 10 characters.', 'error');

        // 🔒 Rate limit
        const now = Date.now();
        if (now - lastSubmit < LIMIT_MS) {
            const wait = Math.ceil((LIMIT_MS - (now - lastSubmit)) / 1000);
            return showStatus(`⏳ Please wait ${wait}s before sending again.`, 'error');
        }

        // ─── UI loading state ───
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline';

        // ─── Create hidden iframe ───
        const iframe = document.createElement('iframe');
        iframe.name = '_submit_frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // ─── Create hidden form ───
        const hiddenForm = document.createElement('form');
        hiddenForm.action = APPS_SCRIPT_URL;
        hiddenForm.method = 'POST';
        hiddenForm.target = '_submit_frame';

        const fields = {
            name: sanitize(name),
            email: sanitize(email),
            subject: sanitize(subject),
            message: sanitize(message),
            _gotcha: '' // must be empty
        };

        Object.entries(fields).forEach(([key, val]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = val;
            hiddenForm.appendChild(input);
        });

        document.body.appendChild(hiddenForm);
        hiddenForm.submit();

        // ─── Simulated success ───
        setTimeout(() => {
            showStatus("✅ Message sent! I'll reply as soon as possible.", 'success');

            form.reset();

            const counter = messageEl?.parentElement.querySelector('.char-counter');
            if (counter) counter.textContent = `0 / 1000`;

            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';

            lastSubmit = Date.now();

            document.body.removeChild(hiddenForm);
            setTimeout(() => document.body.removeChild(iframe), 1000);

            if (typeof track === 'function') {
                track('Contact', 'Form Submit', 'Success');
            }

        }, 2000);
    });

    // ─── Status UI ───
    function showStatus(msg, type) {
        status.textContent = msg;
        status.className = `form-status ${type}`;
        status.style.display = 'block';
        status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (typeof announceToSR === 'function') {
            announceToSR(msg);
        }

        if (type === 'success') {
            setTimeout(hideStatus, 8000);
        }
    }

    function hideStatus() {
        status.style.display = 'none';
        status.className = 'form-status';
        status.textContent = '';
    }
}

// ─────────────────────────────────────────────────────
// 12. BACK TO TOP
// ─────────────────────────────────────────────────────

function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const toggle = throttle(() => { btn.classList.toggle('visible', window.scrollY > 400); }, 100);
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); track('Nav', 'Back to Top', 'Click'); });
}

// ─────────────────────────────────────────────────────
// 13. COPY EMAIL
// ─────────────────────────────────────────────────────

function initEmailCopy() {
    const emailLink = document.querySelector('.contact-list a[href^="mailto:"]');
    if (!emailLink) return;
    emailLink.addEventListener('click', async (e) => {
        if (!navigator.clipboard) return;
        e.preventDefault();
        const address = emailLink.href.replace('mailto:', '');
        try {
            await navigator.clipboard.writeText(address);
            showToast('📋 Email address copied!');
            track('Contact', 'Email Copy', address);
        } catch {
            location.href = emailLink.href;
        }
    });
}

// ─────────────────────────────────────────────────────
// 14. TOAST
// ─────────────────────────────────────────────────────

function showToast(msg, duration = 2800) {
    document.getElementById('portfolio-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'portfolio-toast';
    toast.textContent = msg;
    toast.style.cssText = `
        position:fixed; bottom:80px; left:50%; transform:translateX(-50%) translateY(16px);
        background:var(--text); color:var(--surface);
        padding:10px 22px; border-radius:var(--radius-full);
        font-size:.88rem; font-weight:600;
        box-shadow:var(--shadow-lg); z-index:9999;
        opacity:0; transition:opacity .25s ease, transform .25s ease;
        white-space:nowrap; pointer-events:none;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(12px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ─────────────────────────────────────────────────────
// 15. ACCESSIBILITY
// ─────────────────────────────────────────────────────

function initAccessibility() {
    if (!document.getElementById('sr-announcer')) {
        const el = document.createElement('div');
        el.id = 'sr-announcer';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
        document.body.appendChild(el);
    }

    document.addEventListener('keydown', () => document.body.classList.add('kb-nav'));
    document.addEventListener('mousedown', () => document.body.classList.remove('kb-nav'));

    const skip = document.querySelector('.skip-link');
    const main = document.getElementById('main-content');
    if (skip && main) {
        skip.addEventListener('click', (e) => {
            e.preventDefault();
            main.setAttribute('tabindex', '-1');
            main.focus();
            window.scrollTo({ top: main.offsetTop, behavior: 'smooth' });
            setTimeout(() => main.removeAttribute('tabindex'), 800);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 't') { e.preventDefault(); document.getElementById('theme-toggle')?.click(); }
        if (e.altKey && e.key === 'h') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            const sec = document.getElementById('contact');
            if (sec) { sec.scrollIntoView({ behavior: 'smooth' }); setTimeout(() => sec.querySelector('input')?.focus(), 500); }
        }
    });
}

function announceToSR(msg) {
    const el = document.getElementById('sr-announcer');
    if (!el) return;
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = msg; });
    setTimeout(() => { el.textContent = ''; }, 2000);
}

// ─────────────────────────────────────────────────────
// 16. NETWORK BANNER
// ─────────────────────────────────────────────────────

function initNetworkBanner() {
    if (!('onLine' in navigator)) return;
    const show = () => {
        if (!navigator.onLine) {
            if (document.getElementById('net-banner')) return;
            const banner = document.createElement('div');
            banner.id = 'net-banner';
            banner.textContent = '📡 You appear to be offline';
            banner.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--danger);color:#fff;padding:10px 24px;border-radius:var(--radius-full);font-weight:600;font-size:.9rem;z-index:9998;box-shadow:var(--shadow-lg);`;
            document.body.appendChild(banner);
        } else {
            document.getElementById('net-banner')?.remove();
        }
    };
    window.addEventListener('online', show);
    window.addEventListener('offline', show);
}

// ─────────────────────────────────────────────────────
// 17. KONAMI EASTER EGG
// ─────────────────────────────────────────────────────

function initKonamiEgg() {
    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let buffer = [];
    document.addEventListener('keydown', (e) => {
        buffer.push(e.key);
        buffer = buffer.slice(-seq.length);
        if (buffer.join() === seq.join()) launchEgg();
    });
}

function launchEgg() {
    track('Easter Egg', 'Konami', 'Activated');
    showToast('🎉 Konami Code! You found the secret!', 4000);
    const colors = ['#0073e6', '#ffdd57', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 60; i++) {
        const dot = document.createElement('div');
        const size = Math.random() * 10 + 6;
        dot.style.cssText = `position:fixed;width:${size}px;height:${size}px;border-radius:50%;background:${colors[Math.floor(Math.random() * colors.length)]};top:-10px;left:${Math.random() * 100}vw;opacity:${Math.random() * 0.6 + 0.4};pointer-events:none;z-index:9997;animation:konfettiFall ${Math.random() * 2.5 + 2}s linear forwards;`;
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 5000);
    }
    if (!document.getElementById('egg-style')) {
        const s = document.createElement('style');
        s.id = 'egg-style';
        s.textContent = `@keyframes konfettiFall { to { transform:translateY(105vh) rotate(720deg); opacity:0; } }`;
        document.head.appendChild(s);
    }
}

// ─────────────────────────────────────────────────────
// 18. BROKEN IMAGE FALLBACK
// ─────────────────────────────────────────────────────

document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') { e.target.style.display = 'none'; console.warn('Image failed to load:', e.target.src); }
}, true);

// ─────────────────────────────────────────────────────
// 19. PAGE VISIBILITY
// ─────────────────────────────────────────────────────

document.addEventListener('visibilitychange', () => { track('Page', 'Visibility', document.hidden ? 'hidden' : 'visible'); });

// ─────────────────────────────────────────────────────
// 20. SESSION DURATION
// ─────────────────────────────────────────────────────

if (!sessionStorage.getItem('t0')) sessionStorage.setItem('t0', Date.now());
window.addEventListener('beforeunload', () => {
    const dur = Math.round((Date.now() - parseInt(sessionStorage.getItem('t0') || Date.now())) / 1000);
    track('Session', 'Duration (s)', dur);
    document.body.style.overflow = '';
});

// ─────────────────────────────────────────────────────
// 21. PERFORMANCE
// ─────────────────────────────────────────────────────

if ('PerformanceObserver' in window) {
    try {
        new PerformanceObserver((list) => {
            const lcp = list.getEntries().at(-1);
            const ms = Math.round(lcp?.renderTime || lcp?.loadTime || 0);
            if (ms > 2500) console.warn(`⚠️ LCP ${ms}ms — consider optimizing.`);
            track('Perf', 'LCP', ms);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* unsupported */ }
}

window.addEventListener('load', () => {
    const { loadEventEnd, navigationStart } = performance.timing;
    const ms = loadEventEnd - navigationStart;
    console.log(`%c⚡ Page loaded in ${ms}ms`, 'color:#10b981;font-weight:bold;');
    track('Perf', 'Load (ms)', ms);
});

// ─────────────────────────────────────────────────────
// 22. GLOBAL ERROR HANDLERS
// ─────────────────────────────────────────────────────

window.addEventListener('error', (e) => {
    if (e.filename?.includes('extension')) return;
    track('Error', 'JS', e.message || 'Unknown');
}, true);

window.addEventListener('unhandledrejection', (e) => { track('Error', 'Promise', e.reason?.message || String(e.reason) || 'Unknown'); });

// ─────────────────────────────────────────────────────
// 23. CONSOLE GREETING
// ─────────────────────────────────────────────────────

function printConsoleMessage() {
    console.log('%c👋 Hey there, developer!', 'font-size:20px;font-weight:800;color:#0073e6;');
    console.log('%c✨ Thanks for peeking at the source.', 'font-size:13px;color:#10b981;font-weight:600;');
    console.log('%c🐙 Code on GitHub: https://github.com/Abhishekthakare68', 'font-size:12px;color:#6b7280;');
    console.log('%c📧 Hire me: abhishekthakare221@gmail.com', 'font-size:12px;color:#0073e6;');
    console.log('%c⌨️  Shortcuts  Alt+T theme · Alt+H home · Alt+C contact', 'font-size:11px;color:#8b949e;font-style:italic;');
    console.log('%c🎮 Try the Konami Code: ↑↑↓↓←→←→BA', 'font-size:11px;color:#8b5cf6;font-style:italic;');
}

// ─────────────────────────────────────────────────────
// PROJECT FILTERS
// ─────────────────────────────────────────────────────

function initProjectFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');
    if (!btns.length || !cards.length) return;

    btns.forEach((btn) => {
        btn.addEventListener('click', () => {
            btns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const filter = btn.getAttribute('data-filter');
            cards.forEach((card) => {
                const cats = (card.getAttribute('data-category') || '').split(/\s+/);
                const show = filter === 'all' || cats.includes(filter);
                if (show) { card.classList.remove('hidden'); card.style.animation = 'fadeInCard 0.35s ease both'; }
                else { card.classList.add('hidden'); }
            });

            document.querySelectorAll('.section-sub[id]').forEach((heading) => {
                const group = heading.nextElementSibling;
                if (!group) return;
                const anyVisible = [...group.querySelectorAll('.project-card')].some(c => !c.classList.contains('hidden'));
                heading.style.display = anyVisible ? '' : 'none';
            });

            track('Projects', 'Filter', filter);
        });
    });

    if (!document.getElementById('filter-style')) {
        const s = document.createElement('style');
        s.id = 'filter-style';
        s.textContent = `@keyframes fadeInCard { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }`;
        document.head.appendChild(s);
    }
}

// ─────────────────────────────────────────────────────
// HERO CANVAS — PARTICLE NETWORK — FIXED
// ─────────────────────────────────────────────────────

function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, particles, animId;

    const COUNT = 55;
    const MAX_DIST = 130;
    const SPEED = 0.4;

    function resize() {
        // FIX: Use the parent element dimensions to avoid canvas affecting layout
        const parent = canvas.parentElement;
        W = canvas.width = parent ? parent.offsetWidth : window.innerWidth;
        H = canvas.height = parent ? parent.offsetHeight : window.innerHeight;
    }

    function mkParticle() {
        return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * SPEED, vy: (Math.random() - 0.5) * SPEED, r: Math.random() * 2 + 1 };
    }

    function init() { resize(); particles = Array.from({ length: COUNT }, mkParticle); }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach((p) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(96,165,250,0.6)';
            ctx.fill();
        });
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(96,165,250,${0.2 * (1 - dist / MAX_DIST)})`;
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                }
            }
        }
        animId = requestAnimationFrame(draw);
    }

    init();
    draw();

    // FIX: Proper resize observer
    const resizeObs = new ResizeObserver(debounce(() => {
        resize();
        // Re-clamp particle positions after resize
        if (particles) {
            particles.forEach(p => {
                p.x = Math.min(p.x, W);
                p.y = Math.min(p.y, H);
            });
        }
    }, 200));
    resizeObs.observe(canvas.parentElement || document.body);

    // Pause when hidden to save battery/CPU
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(animId); }
        else { draw(); }
    });
}
