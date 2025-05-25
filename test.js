document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Mobile Navigation ---
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = navMenu.querySelectorAll('a');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // --- Custom Cursor (Optional - Uncomment if needed) ---
    /*
    const cursor = document.querySelector('.cursor');
    document.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    */

    // --- Particle Background ---
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50; // Adjust number of particles

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`; // Start at random positions
        particle.style.animationDelay = `${Math.random() * 15}s`; // Stagger animation
        particle.style.width = `${Math.random() * 2 + 1}px`; // Random size
        particle.style.height = particle.style.width;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`; // Random duration
        particlesContainer.appendChild(particle);
    }

    // --- Scroll Animations ---
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = {
        threshold: 0.1, // Trigger when 10% is visible
        rootMargin: "0px 0px -50px 0px" // Adjust trigger point
    };

    const appearOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // --- Statistics Counter ---
    const statsCards = document.querySelectorAll('.stat-number');
    const statsSection = document.getElementById('stats');

    function animateCount(el, target) {
        let current = 0;
        const duration = 2000; // 2 seconds
        const stepTime = 20; // Update every 20ms
        const steps = duration / stepTime;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                el.textContent = Math.floor(target).toLocaleString(); // Format with commas
            } else {
                el.textContent = Math.floor(current).toLocaleString();
            }
        }, stepTime);
    }

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statsCards.forEach(card => {
                    const count = parseInt(card.dataset.count, 10);
                    animateCount(card, count);
                });
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% is visible

    if (statsSection) {
       statsObserver.observe(statsSection);
    }


    // --- Three.js Hero Canvas ---
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true }); // Alpha true for transparent bg

        renderer.setSize(window.innerWidth, window.innerHeight);

        // Add a simple rotating cube
        const geometry = new THREE.IcosahedronGeometry(2, 0); // Geometric shape
        const material = new THREE.MeshStandardMaterial({
            color: 0x00f5ff,
            wireframe: true, // Show wireframe
            emissive: 0x8a2be2, // Glow effect
            roughness: 0.5,
            metalness: 0.8
        });
        const shape = new THREE.Mesh(geometry, material);
        scene.add(shape);

        // Add some lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        camera.position.z = 5;

        // Mouse interaction
        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });


        function animate() {
            requestAnimationFrame(animate);

            // Rotation
            shape.rotation.x += 0.005;
            shape.rotation.y += 0.005;

            // Mouse follow (subtle)
            camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);


            renderer.render(scene, camera);
        }
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    } else {
        console.warn("Three.js library or canvas not found.");
    }

    // --- Three.js About Visual (Optional - Simple Example) ---
    const aboutVisualContainer = document.getElementById('about-3d-visual');
    if (aboutVisualContainer && typeof THREE !== 'undefined') {
         // You can create another, simpler Three.js scene here
         // or reuse parts if desired. For now, we'll leave it
         // to show how it *could* be implemented.
         console.log("About 3D visual container found. Implement scene here.");
    }


    // --- Contact Form Submission (Basic) ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent actual submission for now
            alert("Thank you for your message! (Submission not implemented yet)");
            contactForm.reset();
        });
    }

});