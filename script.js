document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing Student Council scripts (v2 updates)...");

    // Mobile viewport height fix
    function setVhVariable() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    window.addEventListener('resize', setVhVariable);
    window.addEventListener('orientationchange', setVhVariable);
    setVhVariable(); // Initial call

    if (typeof THREE === 'undefined') {
        console.error("THREE.js is not loaded! 3D features will be disabled.");
        const threeDependentSelectors = [
            '.hero-3d-canvas', '#hero-main-canvas', 
            '#about-3d-concept-canvas', '#about-3d-mission-statement', '#about-3d-charts-statistics',
            /* '#events-3d-timeline-container', // Removed */
            '#events-3d-calendar-cube-container',
            '.member-avatar-glow-canvas' // Switched from .member-avatar-container canvas to specific class
        ];
        threeDependentSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el) el.style.display = 'none';
            });
        });
        const heroTitleElement = document.getElementById('hero-3d-typography');
        if (heroTitleElement) heroTitleElement.style.opacity = 1;
        return;
    }

    let helvetikerFont = null;
    const threeFontLoader = new THREE.FontLoader();
    // const textureLoader = new THREE.TextureLoader(); // Not explicitly used, can be removed if not needed elsewhere

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }, false);

    function setupBasicScene(containerParam, isCanvasElement = false) {
        const container = typeof containerParam === 'string' ? document.getElementById(containerParam) : containerParam;

        if (!container) {
            console.warn(`Container element not found for ID: ${containerParam}`);
            return null;
        }
        if (container.clientWidth === 0 || container.clientHeight === 0) {
            console.warn(`Container ${container.id || container.classList[0] || 'passed element'} has zero width or height. Scene may not render correctly.`);
             if (container.clientWidth === 0) container.style.minWidth = '1px';
             if (container.clientHeight === 0) container.style.minHeight = '1px';
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / (container.clientHeight || 1), 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: isCanvasElement ? container : undefined,
            alpha: true,
            antialias: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);

        if (isCanvasElement) {
            renderer.setSize(container.clientWidth, container.clientHeight, false);
        } else {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                renderer.setSize(container.clientWidth, container.clientHeight);
                container.appendChild(renderer.domElement);
            }
        }

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0x00f5ff, 0.9);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0xff6b6b, 0.7, 50);
        pointLight.position.set(-5, -5, 5);
        scene.add(pointLight);

        let animationFrameId = null;
        const onResize = () => {
            let targetWidth = container.clientWidth;
            let targetHeight = container.clientHeight;

            if (isCanvasElement) { // if container is the canvas itself
                targetWidth = container.parentElement.clientWidth;
                targetHeight = container.parentElement.clientHeight;
            }
            
            if (targetWidth > 0 && targetHeight > 0) {
                camera.aspect = targetWidth / targetHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(targetWidth, targetHeight, isCanvasElement ? false : true);
                 if (isCanvasElement && !renderer.styleAlteredByTHREE) { // Ensure canvas style is updated if it's the element
                    renderer.domElement.style.width = '100%';
                    renderer.domElement.style.height = '100%';
                }
            }
        };
        // Call onResize once initially in case parent dimensions are set
        // Changed from setTimeout(onResize, 0) to requestAnimationFrame(onResize)
        requestAnimationFrame(onResize); 
        window.addEventListener('resize', onResize);


        return {
            scene, camera, renderer, container,
            lights: { ambientLight, directionalLight, pointLight },
            animationFrameId,
            stopListeningResize: () => window.removeEventListener('resize', onResize)
        };
    }

    function create3DText(text, font, materialOptions, textOptions) {
        if (!font) {
            console.warn("Attempted to create 3D text but font is not loaded.");
            return null;
        }
        try {
            const geometry = new THREE.TextGeometry(text, {
                font: font,
                size: textOptions.size || 0.5,
                height: textOptions.height || 0.05,
                curveSegments: textOptions.curveSegments || 6,
                bevelEnabled: textOptions.bevelEnabled !== undefined ? textOptions.bevelEnabled : true,
                bevelThickness: textOptions.bevelThickness || 0.02,
                bevelSize: textOptions.bevelSize || 0.01,
                bevelSegments: textOptions.bevelSegments || 3
            });
            geometry.center();
            const material = new THREE.MeshStandardMaterial(materialOptions);
            return new THREE.Mesh(geometry, material);
        } catch (error) {
            console.error("Error creating TextGeometry:", error, "Text:", text);
            return null;
        }
    }

    function initializeAll3DScenes() {
        console.log("Font loaded, initializing all 3D scenes...");
        try { initHero3D(); } catch (e) { console.error("Error in initHero3D:", e); }
        try { initAbout3D(); } catch (e) { console.error("Error in initAbout3D:", e); }
        try { initTeamMemberCardVisuals(); } catch (e) { console.error("Error in initTeamMemberCardVisuals:", e); } 
        try { initEvents3D(); } catch (e) { console.error("Error in initEvents3D:", e); }
    }

    console.log("Loading Helvetiker font...");
    threeFontLoader.load('https://unpkg.com/three@0.128.0/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        console.log("Helvetiker font loaded successfully.");
        helvetikerFont = font;
        initializeAll3DScenes();
    }, undefined, (error) => {
        console.error('Failed to load Helvetiker font:', error);
        initializeAll3DScenes(); 
    });

    // --- 1. Advanced Hero Section ---
    let heroSetup, heroMainText3D, heroFloatingIcons = [], heroEquationParticles;
    const heroScrollTarget = { cameraZ: 7, mainTextRotY: 0 }; 

    function initHero3D() {
        const heroCanvas = document.getElementById('hero-main-canvas');
        if (!heroCanvas) { console.warn("Hero canvas not found."); return; }

        heroSetup = setupBasicScene(heroCanvas, true);
        if (!heroSetup) return;
        const { scene, camera } = heroSetup;
        camera.position.z = heroScrollTarget.cameraZ;

        if (helvetikerFont) {
            heroMainText3D = create3DText('Student Council', helvetikerFont,
                { color: 0x00f5ff, emissive: 0x8a2be2, metalness: 0.9, roughness: 0.3, transparent: true, opacity: 0.9, side: THREE.DoubleSide },
                { size: 1.2, height: 0.25, bevelThickness: 0.04, bevelSize: 0.04 } 
            );
            if (heroMainText3D) {
                heroMainText3D.position.y = 1.8; 
                scene.add(heroMainText3D);
            }
        }

        const iconDetails = [
            { geometry: new THREE.BoxGeometry(0.6, 0.4, 0.1), color: 0x4ecdc4, name: "Microchip" },
            { geometry: new THREE.TorusKnotGeometry(0.3, 0.08, 50, 8), color: 0xff6b6b, name: "Abstract Gear/Knot" },
            { geometry: new THREE.IcosahedronGeometry(0.35, 0), color: 0x45b7d1, name: "Data Crystal" }
        ];
        iconDetails.forEach(detail => {
            const material = new THREE.MeshStandardMaterial({ color: detail.color, emissive: detail.color, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.7 });
            const icon = new THREE.Mesh(detail.geometry, material);
            icon.name = detail.name;
            icon.position.set((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 2 + 1, (Math.random() - 0.5) * 4 - 2);
            icon.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            heroFloatingIcons.push(icon);
            scene.add(icon);
        });

        const particleCount = 1200;
        const particlesGeo = new THREE.BufferGeometry();
        const posArray = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 18;
        }
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({ size: 0.05, color: 0x00f5ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, sizeAttenuation: true });
        heroEquationParticles = new THREE.Points(particlesGeo, particleMat);
        scene.add(heroEquationParticles);

        const heroTitleElement = document.getElementById('hero-3d-typography');
        if (heroMainText3D && heroTitleElement) { 
             heroTitleElement.style.display = 'none'; 
        } else if (heroTitleElement) {
            heroTitleElement.style.opacity = 1; 
        }

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const scrollFactor = Math.min(scrollY / (window.innerHeight * 0.8), 1); 
            heroScrollTarget.cameraZ = 7 - scrollFactor * 3; 
            if(heroMainText3D) heroScrollTarget.mainTextRotY = scrollFactor * Math.PI * 0.1;

            heroFloatingIcons.forEach((icon, i) => {
                const initialX = (i - (heroFloatingIcons.length - 1) / 2) * 2.5; 
                icon.userData.targetX = initialX + scrollFactor * (i % 2 === 0 ? 2 : -2); 
                icon.userData.targetZ = -2 + scrollFactor * -3; 
            });
        });
        console.log("Hero 3D scene initialized.");
        if (heroSetup && !heroSetup.animationFrameId) animateHero3D();
    }

    function animateHero3D() {
        if (!heroSetup) return;
        heroSetup.animationFrameId = requestAnimationFrame(animateHero3D);
        const { scene, camera, renderer } = heroSetup;
        const time = Date.now() * 0.0005;

        camera.position.z += (heroScrollTarget.cameraZ - camera.position.z) * 0.05;
        camera.position.x += (mouseX * 1.0 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 1.0 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        if (heroMainText3D) { 
            heroMainText3D.rotation.x = Math.sin(time * 0.6) * 0.05;
            heroMainText3D.rotation.y += (heroScrollTarget.mainTextRotY - heroMainText3D.rotation.y) * 0.05 + 0.0015;
            heroMainText3D.material.emissiveIntensity = Math.sin(time * 1.8) * 0.3 + 0.7;
            heroMainText3D.material.color.setHSL((time * 0.05) % 1, 0.9, 0.7);
        }

        heroFloatingIcons.forEach((icon, i) => {
            icon.rotation.x += 0.004 * (i % 2 === 0 ? 1 : -1) * (icon.name === "Abstract Gear/Knot" ? 2 : 1);
            icon.rotation.y += 0.006 * (i % 2 === 0 ? 1 : -1) * (icon.name === "Abstract Gear/Knot" ? 2 : 1);
            icon.position.y += Math.sin(time * (i + 1) * 0.25 + i) * 0.008;
            if(icon.userData.targetX !== undefined) icon.position.x += (icon.userData.targetX - icon.position.x) * 0.03;
            if(icon.userData.targetZ !== undefined) icon.position.z += (icon.userData.targetZ - icon.position.z) * 0.03;
        });

        if (heroEquationParticles) {
            heroEquationParticles.rotation.y = time * 0.03;
            heroEquationParticles.rotation.x = time * 0.015;
        }
        renderer.render(scene, camera);
    }

    // --- 2. Team Section (Visuals for Cards Only) ---
    const teamCardSetups = {}; 

    function initTeamMemberCardVisuals() {
        document.querySelectorAll('#team-grid-3d .member-card').forEach((card, index) => {
            card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.5s';
            card.style.transformStyle = 'preserve-3d';

            card.addEventListener('mouseenter', () => {
                card.style.transform = `perspective(1000px) rotateY(${Math.random()*10-5}deg) rotateX(${Math.random()*4-2}deg) translateZ(35px) scale(1.04)`;
                card.style.boxShadow = '0 25px 55px rgba(0, 245, 255, 0.35)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)';
                card.style.boxShadow = '0 15px 30px rgba(0, 245, 255, 0.2)';
            });

            const avatarContainer = card.querySelector('.member-avatar-container');
            const memberId = card.dataset.memberId || `member-${index}`;
            const avatarGlowCanvas = avatarContainer.querySelector('canvas.member-avatar-glow-canvas');

            if (avatarContainer && avatarGlowCanvas && avatarGlowCanvas.offsetHeight > 1) { // Check canvas and its visibility
                const avatarSetup = setupBasicScene(avatarGlowCanvas, true); 
                if (avatarSetup) {
                    teamCardSetups[memberId] = avatarSetup; 
                    const { scene: avatarScene, camera: avatarCamera } = avatarSetup;
                    avatarCamera.position.z = 1.8;

                    const glowPlaneGeo = new THREE.PlaneGeometry(1.6, 1.6);
                    const glowPlaneMat = new THREE.MeshBasicMaterial({
                        color: 0x00f5ff, transparent: true, opacity: 0.25,
                        blending: THREE.AdditiveBlending, side: THREE.DoubleSide
                    });
                    const glowPlane = new THREE.Mesh(glowPlaneGeo, glowPlaneMat);
                    glowPlane.position.z = -0.15; 
                    avatarScene.add(glowPlane);
                    avatarSetup.glowPlane = glowPlane; 
                     if (!avatarSetup.animationFrameId) animateAvatarEffect(avatarSetup);
                } else {
                    console.warn(`Failed to set up 3D scene for avatar glow on member: ${memberId}`);
                    if(avatarGlowCanvas) avatarGlowCanvas.style.display = 'none'; // Hide canvas if setup fails
                }
            } else if (avatarGlowCanvas) {
                 avatarGlowCanvas.style.display = 'none'; // Hide if container or canvas is not properly sized
            }
            // 3D Social Icons removed from here
        });
        console.log("Team member card 3D visuals initialized.");
    }
    function animateAvatarEffect(avatarSetup) {
        if (!avatarSetup || !avatarSetup.glowPlane) return;
        avatarSetup.animationFrameId = requestAnimationFrame(() => animateAvatarEffect(avatarSetup));
        const { scene, camera, renderer, glowPlane } = avatarSetup;
        glowPlane.rotation.z += 0.015;
        glowPlane.material.opacity = Math.sin(Date.now() * 0.0015) * 0.1 + 0.2;
        renderer.render(scene, camera);
    }
    // animateSocialIcons function removed

    // --- 3. Events Section (Calendar Cube Only) ---
    let calendarCubeSetup, calendarCubeMesh;
    const featuredEvents = [ 
        { name: "CRMD", color: 0xff6b6b }, 
        { name: "Crescendo", color: 0x4ecdc4 },
        { name: "Euphoria", color: 0xfd79a8 }, 
        { name: "Atlead", color: 0x6c5ce7 } 
    ];
    let currentEventIndex = 0;
    let lastFlipTime = 0;
    const flipInterval = 7000; // 7 seconds
    let isFlipping = false;
    let targetQuaternion = new THREE.Quaternion();

    function createEventTexture(eventName, bgColor = 'rgba(10, 10, 30, 0.85)', textColor = 'rgba(0, 245, 255, 1)') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256; 
        canvas.height = 256;

        context.fillStyle = bgColor; 
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.strokeStyle = 'rgba(0, 245, 255, 0.5)'; 
        context.lineWidth = 8;
        context.strokeRect(0, 0, canvas.width, canvas.height);

        context.font = `bold ${eventName.length > 8 ? '38px' : '48px'} Inter, sans-serif`; // Adjust font size for long names
        context.fillStyle = textColor; 
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(eventName.toUpperCase(), canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function initEvents3D() {
        // 3D Timeline code removed.

        const calendarContainer = document.getElementById('events-3d-calendar-cube-container');
        if (calendarContainer && calendarContainer.offsetHeight > 10) {
            calendarCubeSetup = setupBasicScene(calendarContainer);
            if (calendarCubeSetup) {
                const { scene, camera } = calendarCubeSetup;
                camera.position.z = 3.5; // Slightly closer
                const cubeGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
                
                const eventTextures = featuredEvents.map(event => createEventTexture(event.name, event.color));
                const genericTexture1 = createEventTexture("SC", "rgba(50,50,80,0.8)", "rgba(200,200,255,1)"); // Generic SC texture for extra faces
                const genericTexture2 = createEventTexture("Events", "rgba(80,50,50,0.8)", "rgba(255,200,200,1)");


                // Assign textures to faces:
                // Front: Event 0, Back: Event 1, Top: Event 2, Bottom: Event 3, Right: SC, Left: Events
                const materials = [
                    new THREE.MeshStandardMaterial({ map: eventTextures[0], metalness: 0.5, roughness: 0.5, name: featuredEvents[0].name }), // Right
                    new THREE.MeshStandardMaterial({ map: eventTextures[1], metalness: 0.5, roughness: 0.5, name: featuredEvents[1].name }), // Left
                    new THREE.MeshStandardMaterial({ map: eventTextures[2], metalness: 0.5, roughness: 0.5, name: featuredEvents[2].name }), // Top
                    new THREE.MeshStandardMaterial({ map: eventTextures[3], metalness: 0.5, roughness: 0.5, name: featuredEvents[3].name }), // Bottom
                    new THREE.MeshStandardMaterial({ map: genericTexture1, metalness: 0.5, roughness: 0.5, name: "SC_Face1" }),       // Front (initially)
                    new THREE.MeshStandardMaterial({ map: genericTexture2, metalness: 0.5, roughness: 0.5, name: "SC_Face2" })        // Back (initially)
                ];
                
                calendarCubeMesh = new THREE.Mesh(cubeGeo, materials);
                scene.add(calendarCubeMesh);
                console.log("Calendar Cube 3D scene initialized for event showcase.");
                if (!calendarCubeSetup.animationFrameId) {
                    lastFlipTime = Date.now(); // Initialize flip timer
                    animateCalendarCube();
                }
            }
        } else if (calendarContainer) {
            console.warn("Calendar container not found or has no height.");
        }

        // Existing Event Cards hover effects (CSS driven, can remain)
        document.querySelectorAll('#events-grid-3d .event-card').forEach(card => {
            // ... (hover effects as before)
        });
    }
    // animateEventsTimeline function removed

    function animateCalendarCube() {
        if (!calendarCubeSetup || !calendarCubeMesh) return;
        calendarCubeSetup.animationFrameId = requestAnimationFrame(animateCalendarCube);
        const { scene, camera, renderer } = calendarCubeSetup;
        const now = Date.now();

        if (!isFlipping) {
            calendarCubeMesh.rotation.y += 0.003; // Continuous slow rotation
            calendarCubeMesh.rotation.x += 0.001;
        }

        if (now - lastFlipTime > flipInterval && !isFlipping) {
            isFlipping = true;
            currentEventIndex = (currentEventIndex + 1) % featuredEvents.length;
            console.log(`Flipping to event: ${featuredEvents[currentEventIndex].name}`);

            // Define target rotations to bring a specific face to the front
            // Face mapping: 0:Right (+X), 1:Left (-X), 2:Top (+Y), 3:Bottom (-Y), 4:Front (+Z), 5:Back (-Z)
            // We want to bring faces 0, 1, 2, or 3 to the front (+Z axis view)
            const targetEuler = new THREE.Euler(0, 0, 0, 'YXZ');
            switch (currentEventIndex) {
                case 0: targetEuler.set(0, -Math.PI / 2, 0); break; // Event 0 (originally Right face) to front
                case 1: targetEuler.set(0, Math.PI / 2, 0); break;  // Event 1 (originally Left face) to front
                case 2: targetEuler.set(Math.PI / 2, 0, 0); break;  // Event 2 (originally Top face) to front
                case 3: targetEuler.set(-Math.PI / 2, 0, 0); break; // Event 3 (originally Bottom face) to front
            }
            targetQuaternion.setFromEuler(targetEuler);
            lastFlipTime = now; // Reset timer for next flip AFTER this one completes
        }

        if (isFlipping) {
            calendarCubeMesh.quaternion.slerp(targetQuaternion, 0.07); // Smoothly interpolate
            // Check if a small enough difference to consider flip complete
            if (calendarCubeMesh.quaternion.angleTo(targetQuaternion) < 0.01) {
                calendarCubeMesh.quaternion.copy(targetQuaternion); // Snap to final
                isFlipping = false;
                // lastFlipTime = Date.now(); // Reset timer here if you want interval from end of flip
            }
        }
        renderer.render(scene, camera);
    }

    // --- 4. Interactive About Section (No badges) ---
    let aboutConceptSetup, aboutMissionSetup, aboutChartsSetup; // aboutBadgesSetup removed
    const chartLabels = ["Projects", "Workshops", "Outreach", "Members"]; 

    function initAbout3D() {
        const conceptCanvas = document.getElementById('about-3d-concept-canvas');
        if (conceptCanvas && conceptCanvas.parentElement && conceptCanvas.parentElement.offsetHeight > 10) {
            aboutConceptSetup = setupBasicScene(conceptCanvas, true);
            if (aboutConceptSetup) {
                // ... (gears setup as before)
                const { scene, camera } = aboutConceptSetup;
                camera.position.set(0, 0.5, 4.5);
                const gearMat = new THREE.MeshStandardMaterial({ color: 0x4ecdc4, metalness: 0.8, roughness: 0.35, emissive:0x1a5252, flatShading:false, side:THREE.DoubleSide });
                const gearLargeGeo = new THREE.CylinderGeometry(1, 1, 0.25, 32, 1, false);
                const gearSmallGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.20, 24, 1, false);
                const gear1 = new THREE.Mesh(gearLargeGeo, gearMat);
                const gear2 = new THREE.Mesh(gearSmallGeo, gearMat.clone()); gear2.material.color.setHex(0xff6b6b); gear2.material.emissive.setHex(0x521a1a);
                const gear3 = new THREE.Mesh(gearSmallGeo, gearMat.clone()); gear3.material.color.setHex(0xfd79a8); gear3.material.emissive.setHex(0x521a3a);
                gear1.rotation.x = gear2.rotation.x = gear3.rotation.x = Math.PI / 2;
                gear1.position.set(0, 0, 0);
                gear2.position.set(1.25 * Math.cos(0), 1.25 * Math.sin(0), 0); 
                gear3.position.set(1.25 * Math.cos(Math.PI * 2/3), 1.25 * Math.sin(Math.PI * 2/3), 0.05); 
                scene.add(gear1, gear2, gear3);
                aboutConceptSetup.gears = [gear1, gear2, gear3];
                console.log("About Concept (Gears) 3D scene initialized.");
                if (aboutConceptSetup && !aboutConceptSetup.animationFrameId) animateAboutConcept();
            }
        }

        const missionContainer = document.getElementById('about-3d-mission-statement');
        if (missionContainer && helvetikerFont && missionContainer.offsetHeight > 10) {
            // ... (mission text setup as before)
            let originalText = "Our Mission 3D";
            const missionH3TextElement = document.querySelector('#about-3d-mission-statement-container h3');
            if(missionH3TextElement) originalText = missionH3TextElement.textContent || "Our Mission (3D)";
            aboutMissionSetup = setupBasicScene(missionContainer);
            if (aboutMissionSetup) {
                if(missionH3TextElement) missionH3TextElement.style.display = 'none';
                const { scene, camera } = aboutMissionSetup;
                camera.position.z = 6;
                const missionText3D = create3DText(originalText, helvetikerFont,
                    { color: 0x00f5ff, emissive: 0x6c5ce7, specular: 0x333333, shininess: 70, side: THREE.DoubleSide },
                    { size: 0.35, height: 0.04, bevelSize: 0.015, bevelThickness: 0.025 }
                );
                if (missionText3D) {
                    scene.add(missionText3D);
                    aboutMissionSetup.textMesh = missionText3D;
                    console.log("About Mission Statement 3D scene initialized.");
                    if(aboutMissionSetup && !aboutMissionSetup.animationFrameId) animateAboutMission();
                }
            }
        }

        const chartsContainer = document.getElementById('about-3d-charts-statistics');
        if (chartsContainer && chartsContainer.offsetHeight > 10) {
            aboutChartsSetup = setupBasicScene(chartsContainer);
            if (aboutChartsSetup) {
                // ... (charts setup as before)
                const { scene, camera } = aboutChartsSetup;
                camera.position.set(0, 1.5, 7);
                const barData = [2.5, 3.8, 3.0, 4.2];
                const barColors = [0x45b7d1, 0xff6b6b, 0x4ecdc4, 0xfd79a8];
                const barWidth = 0.7, barDepth = 0.7, barSpacing = 0.4;
                aboutChartsSetup.bars = [];
                barData.forEach((height, i) => {
                    const barGeo = new THREE.BoxGeometry(barWidth, height, barDepth);
                    const barMat = new THREE.MeshStandardMaterial({ color: barColors[i], emissive: barColors[i], emissiveIntensity:0.3, metalness:0.5, roughness:0.6 });
                    const bar = new THREE.Mesh(barGeo, barMat);
                    bar.position.set((i - (barData.length - 1) / 2) * (barWidth + barSpacing), height / 2 - 1.5, 0); 
                    scene.add(bar);
                    aboutChartsSetup.bars.push(bar);
                    bar.scale.y = 0.01; 
                });
                if (aboutChartsSetup.bars && helvetikerFont) {
                    aboutChartsSetup.bars.forEach((bar, i) => {
                        const labelText = chartLabels[i] || `Data ${i+1}`;
                        const barLabel = create3DText(labelText, helvetikerFont, { color: 0xa0a0a0 }, { size: 0.15, height: 0.01, bevelEnabled: false });
                        if (barLabel) {
                            barLabel.position.set(bar.position.x, bar.position.y - (bar.geometry.parameters.height * (bar.scale.y||1) / 2) - 0.3, bar.position.z);
                            aboutChartsSetup.scene.add(barLabel);
                            bar.userData.label = barLabel; 
                        }
                    });
                }
                console.log("About 3D Charts scene initialized.");
                if(aboutChartsSetup && !aboutChartsSetup.animationFrameId) animateAboutCharts();
            }
        }
        // Floating Badges setup removed
    }
    function animateAboutConcept() {
        if (!aboutConceptSetup || !aboutConceptSetup.gears) return;
        aboutConceptSetup.animationFrameId = requestAnimationFrame(animateAboutConcept);
        const { scene, camera, renderer, gears } = aboutConceptSetup;
        const speed = 0.008;
        gears[0].rotation.z += speed;
        gears[1].rotation.z -= speed * (gears[0].geometry.parameters.radiusTop / gears[1].geometry.parameters.radiusTop) * 1.1; 
        gears[2].rotation.z -= speed * (gears[0].geometry.parameters.radiusTop / gears[2].geometry.parameters.radiusTop) * 0.9;
        renderer.render(scene, camera);
    }
    function animateAboutMission() {
        if (!aboutMissionSetup || !aboutMissionSetup.textMesh) return;
        aboutMissionSetup.animationFrameId = requestAnimationFrame(animateAboutMission);
        const { scene, camera, renderer, textMesh } = aboutMissionSetup;
        textMesh.rotation.y = Math.sin(Date.now() * 0.00025) * 0.1;
        textMesh.rotation.x = Math.cos(Date.now() * 0.0002) * 0.05;
        renderer.render(scene, camera);
    }
    function animateAboutCharts() {
        if (!aboutChartsSetup || !aboutChartsSetup.bars) return;
        aboutChartsSetup.animationFrameId = requestAnimationFrame(animateAboutCharts);
        const { scene, camera, renderer, bars } = aboutChartsSetup;
        bars.forEach((bar, i) => {
            const targetScaleY = Math.sin(Date.now() * 0.0007 + i * 0.6) * 0.04 + 0.98; 
            if (!bar.userData.grown) { 
                 bar.scale.y += 0.02;
                 if(bar.scale.y >=1) { bar.scale.y = 1; bar.userData.grown = true; }
            } else { bar.scale.y += (targetScaleY - bar.scale.y) * 0.08; } 
            bar.position.y = (bar.geometry.parameters.height * bar.scale.y) / 2 - 1.5; 
            if(bar.userData.label){ 
                bar.userData.label.position.y = bar.position.y - (bar.geometry.parameters.height * bar.scale.y / 2) - 0.3;
            }
        });
        renderer.render(scene, camera);
    }
    // animateAboutBadges function removed


    // --- Standard JS (Navbar, Particles, Scroll Animations, Stats Counter, Contact Form) ---
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }

    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        const particleCount = Math.max(20, Math.min(Math.floor(window.innerWidth / 35), 60));
        if (particlesContainer.children.length === 0) { // Only add particles if not already there
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                particle.style.left = `${Math.random() * 100}vw`;
                particle.style.top = `${Math.random() * 100}vh`;
                particle.style.animationDelay = `${Math.random() * 12}s`;
                const size = Math.random() * 1.5 + 0.5; 
                particle.style.width = `${size}px`; particle.style.height = `${size}px`;
                particle.style.animationDuration = `${Math.random() * 8 + 12}s`;
                particlesContainer.appendChild(particle);
            }
        }
    }

    const faders = document.querySelectorAll('.fade-in');
    if (faders.length > 0) {
        const appearOptions = { threshold: 0.1, rootMargin: "0px 0px -40px 0px" };
        const appearOnScroll = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, appearOptions);
        faders.forEach(fader => appearOnScroll.observe(fader));
    }

    const statsSection = document.getElementById('stats');
    if (statsSection) {
        const statsCards = statsSection.querySelectorAll('.stat-number');
        const animateCount = (el, target) => {
            let current = 0;
            const duration = 1800, stepTime = 18, steps = duration / stepTime;
            const increment = target / steps;
            el.dataset.animated = 'true'; 
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    clearInterval(timer);
                    el.textContent = Math.floor(target).toLocaleString();
                } else {
                    el.textContent = Math.floor(current).toLocaleString();
                }
            }, stepTime);
        }
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statsCards.forEach(card => {
                        if(card.dataset.animated !== 'true'){ 
                             const count = parseInt(card.dataset.count, 10);
                             if (!isNaN(count)) animateCount(card, count);
                        }
                    });
                }
            });
        }, { threshold: 0.4 });
        statsObserver.observe(statsSection);
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Basic validation example
            const name = contactForm.querySelector('input[name="name"]').value;
            const email = contactForm.querySelector('input[name="email"]').value;
            const message = contactForm.querySelector('textarea[name="message"]').value;
            if (name.trim() === '' || email.trim() === '' || message.trim() === '') {
                alert("Please fill in all fields.");
                return;
            }
            alert("Thank you for your message! (This is a demo, form not submitted)");
            contactForm.reset();
        });
    }
    console.log("Student Council website base scripts (non-3D dependent) initialized.");
});