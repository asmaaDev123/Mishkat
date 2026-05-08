(function () {
    'use strict';

    /* ---------- DOM References ---------- */
    const stepsContainer   = document.getElementById('steps-container');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineOrb      = document.getElementById('timeline-orb');
    const particlesContainer = document.getElementById('particles-container');
    const stepItems        = document.querySelectorAll('.step-item');
    const animatedEls      = document.querySelectorAll('[data-animate]');

    /* ---------- Configuration ---------- */
    const CONFIG = {
        particleCount: 25,
        observerThreshold: 0.25,
        staggerDelay: 150,     // ms between each step reveal
        orbSmoothness: 0.08,
    };

    /* ==========   PARTICLES SYSTEM =============== */
    function initParticles() {
        if (!particlesContainer) return;

        // Respect prefers-reduced-motion
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < CONFIG.particleCount; i++) {
            const particle = document.createElement('div');
            const isGold   = Math.random() > 0.5;
            const size     = Math.random() * 6 + 3;

            particle.classList.add('particle', isGold ? 'particle--gold' : 'particle--green');

            Object.assign(particle.style, {
                width:  `${size}px`,
                height: `${size}px`,
                left:   `${Math.random() * 100}%`,
                top:    `${Math.random() * 100}%`,
                opacity: '0',
            });

            fragment.appendChild(particle);
            animateParticle(particle);
        }

        particlesContainer.appendChild(fragment);
    }

    function animateParticle(el) {
        const duration = Math.random() * 8000 + 6000;
        const delay    = Math.random() * 5000;

        const startX = parseFloat(el.style.left);
        const startY = parseFloat(el.style.top);
        const driftX = (Math.random() - 0.5) * 20;
        const driftY = (Math.random() - 0.5) * 30;

        const keyframes = [
            { opacity: 0, transform: `translate(0, 0)` },
            { opacity: 0.7, transform: `translate(${driftX * 0.3}px, ${driftY * 0.3}px)`, offset: 0.3 },
            { opacity: 0.5, transform: `translate(${driftX * 0.7}px, ${driftY * 0.7}px)`, offset: 0.7 },
            { opacity: 0, transform: `translate(${driftX}px, ${driftY}px)` },
        ];

        const animation = el.animate(keyframes, {
            duration: duration,
            delay: delay,
            easing: 'ease-in-out',
            iterations: Infinity,
        });

        return animation;
    }

    /* ====================   INTERSECTION OBSERVER - REVEAL================== */
    function initRevealObserver() {
        // Header elements
        const headerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const delay = parseInt(entry.target.dataset.delay || '0', 10);
                        setTimeout(() => {
                            entry.target.classList.add('is-visible');
                        }, delay);
                        headerObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
        );

        animatedEls.forEach((el) => headerObserver.observe(el));

        // Step items with stagger
        let revealedCount = 0;
        const stepObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const stepIndex = Array.from(stepItems).indexOf(entry.target);
                        const delay = Math.max(0, stepIndex - revealedCount) * CONFIG.staggerDelay;

                        setTimeout(() => {
                            entry.target.classList.add('is-visible');
                            revealedCount++;
                        }, delay);

                        stepObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: CONFIG.observerThreshold,
                rootMargin: '0px 0px -80px 0px',
            }
        );

        stepItems.forEach((el) => stepObserver.observe(el));
    }

    /* ===============   TIMELINE PROGRESS + ORB ================= */
    function initTimelineProgress() {
        if (!stepsContainer || !timelineProgress || !timelineOrb) return;

        let ticking = false;
        let currentProgress = 0;
        let targetProgress  = 0;

        function updateTimeline() {
            const containerRect = stepsContainer.getBoundingClientRect();
            const containerTop  = containerRect.top;
            const containerH    = containerRect.height;
            const viewH         = window.innerHeight;

            // Calculate how far through the timeline the viewport center is
            const viewCenter     = viewH * 0.6;
            const progressRaw    = (viewCenter - containerTop) / containerH;
            targetProgress       = Math.max(0, Math.min(1, progressRaw));
        }

        function smoothUpdate() {
            // Lerp for smooth animation
            currentProgress += (targetProgress - currentProgress) * CONFIG.orbSmoothness;

            const pct = (currentProgress * 100).toFixed(2);
            timelineProgress.style.height = `${pct}%`;
            timelineOrb.style.top = `${pct}%`;

            // Show orb only when progress > 0
            if (currentProgress > 0.01) {
                timelineOrb.style.opacity = '1';
            } else {
                timelineOrb.style.opacity = '0';
            }

            // Determine active step
            stepItems.forEach((item, index) => {
                const itemRect    = item.getBoundingClientRect();
                const itemCenter  = itemRect.top + itemRect.height / 2;
                const viewCenter  = window.innerHeight * 0.6;

                if (itemCenter < viewCenter) {
                    item.classList.add('is-passed');
                    item.classList.remove('is-active');
                } else if (itemCenter < viewCenter + 200) {
                    item.classList.add('is-active');
                    item.classList.remove('is-passed');
                } else {
                    item.classList.remove('is-active', 'is-passed');
                }
            });

            requestAnimationFrame(smoothUpdate);
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    updateTimeline();
                    ticking = false;
                });
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        // Initial call
        updateTimeline();
        smoothUpdate();
    }

    /* ===========  HOVER PARALLAX ON CARDS (Desktop)===================== */
    function initCardParallax() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const cards = document.querySelectorAll('.step-card');

        cards.forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect   = card.getBoundingClientRect();
                const x      = e.clientX - rect.left;
                const y      = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -3;
                const rotateY = ((x - centerX) / centerX) * 3;

                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
            });
        });
    }

    /* ======== LIGHT SWEEP EFFECT ON CARDS=========== */
    function initLightSweep() {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const cards = document.querySelectorAll('.step-card');

        cards.forEach((card, index) => {
            // Create light sweep overlay
            const sweep = document.createElement('div');
            sweep.setAttribute('aria-hidden', 'true');
            Object.assign(sweep.style, {
                position: 'absolute',
                top: '0',
                left: '-100%',
                width: '60%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                zIndex: '5',
                pointerEvents: 'none',
                borderRadius: 'inherit',
            });
            card.style.position = 'relative';
            card.appendChild(sweep);

            // Trigger sweep when card becomes visible
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                sweep.animate(
                                    [
                                        { left: '-100%' },
                                        { left: '200%' },
                                    ],
                                    {
                                        duration: 1200,
                                        easing: 'ease-in-out',
                                        fill: 'forwards',
                                    }
                                );
                            }, index * CONFIG.staggerDelay + 600);
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.3 }
            );

            observer.observe(card);
        });
    }

    /* ========  6. COUNTER ANIMATION FOR STEP NUMBERS ========== */
    function initStepCounters() {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

        stepItems.forEach((item) => {
            const numberEl  = item.querySelector('.step-number');
            if (!numberEl) return;

            const finalNum  = parseInt(item.dataset.step, 10);
            const finalChar = arabicNumerals[finalNum] || finalNum.toString();
            let animated    = false;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !animated) {
                            animated = true;

                            // Quick count-up effect
                            let count = 0;
                            const interval = setInterval(() => {
                                count++;
                                numberEl.textContent = arabicNumerals[count] || count.toString();
                                if (count >= finalNum) {
                                    clearInterval(interval);
                                    numberEl.textContent = finalChar;
                                }
                            }, 80);

                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.5 }
            );

            observer.observe(item);
        });
    }

    /* =========  INITIALIZATION ========= */
    function init() {
        initParticles();
        initRevealObserver();
        initTimelineProgress();
        initCardParallax();
        initLightSweep();
        initStepCounters();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
