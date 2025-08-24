/**
 * Gestionnaire Avancé d'Ombres et Ensoleillement - WallSim3D
 * Simulation did        });
    }

    applyCustomLocation() { sur la géolocalisation réelle
 */
class ShadowManager {
    constructor() {
        this.locations = {
            huy: { name: "Huy, Belgique", lat: 50.5196, lon: 5.2325, timezone: "Europe/Brussels" },
            brussels: { name: "Bruxelles, Belgique", lat: 50.8503, lon: 4.3517, timezone: "Europe/Brussels" },
            paris: { name: "Paris, France", lat: 48.8566, lon: 2.3522, timezone: "Europe/Paris" },
            london: { name: "Londres, Royaume-Uni", lat: 51.5074, lon: -0.1278, timezone: "Europe/London" },
            berlin: { name: "Berlin, Allemagne", lat: 52.5200, lon: 13.4050, timezone: "Europe/Berlin" },
            amsterdam: { name: "Amsterdam, Pays-Bas", lat: 52.3676, lon: 4.9041, timezone: "Europe/Amsterdam" },
            zurich: { name: "Zurich, Suisse", lat: 47.3769, lon: 8.5417, timezone: "Europe/Zurich" }
        };

        this.currentLocation = this.locations.huy; // Position par défaut : Huy
        this.northOrientation = 0; // 0° = Nord vers le haut
        this.simulationDate = new Date();
        this.simulationTime = 12.0; // 12h00
        this.useCalculatedSun = true;

        this.init();
    }

    init() {
        // console.log('🌞 ShadowManager - Initialisation système d\'ensoleillement avancé');
        this.setupLocationControls();
        this.setupOrientationControls();
        this.setupDateTimeControls();
        this.setupSunControls();
        this.setupRenderingControls();
        this.updateDisplay();
        
        // Initialiser la flèche du nord dans la scène 3D
        if (window.SceneManager) {
            // Attendre que le SceneManager soit initialisé
            if (window.SceneManager.isInitialized && window.SceneManager.scene) {
                if (window.SceneManager.createNorthArrow) {
                    window.SceneManager.createNorthArrow();
                }
                if (window.SceneManager.setNorthOrientation) {
                    window.SceneManager.setNorthOrientation(this.northOrientation);
                }
            } else {
                // Réessayer après un petit délai
                setTimeout(() => {
                    if (window.SceneManager.isInitialized && window.SceneManager.scene) {
                        if (window.SceneManager.createNorthArrow) {
                            window.SceneManager.createNorthArrow();
                        }
                        if (window.SceneManager.setNorthOrientation) {
                            window.SceneManager.setNorthOrientation(this.northOrientation);
                        }
                    } else {
                        // console.warn('⚠️ ShadowManager: SceneManager non disponible pour la flèche du Nord');
                    }
                }, 100);
            }
        }
        
        this.calculateSunPosition();
    }

    // === CONTRÔLES DE GÉOLOCALISATION ===
    setupLocationControls() {
        const locationPreset = document.getElementById('locationPreset');
        const customInputs = document.getElementById('customLocationInputs');
        const applyCustom = document.getElementById('applyCustomLocation');

        if (locationPreset) {
            locationPreset.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customInputs.style.display = 'block';
                } else {
                    customInputs.style.display = 'none';
                    this.setLocation(e.target.value);
                }
            });
        }

        if (applyCustom) {
            applyCustom.addEventListener('click', () => {
                this.applyCustomLocation();
            });
        }
    }

    setLocation(locationKey) {
        if (this.locations[locationKey]) {
            this.currentLocation = this.locations[locationKey];
            this.updateLocationDisplay();
            this.calculateSunPosition();
            console.log(`📍 Position changée: ${this.currentLocation.name}`);
        }
    }

    applyCustomLocation() {
        const latInput = document.getElementById('customLatitude');
        const lonInput = document.getElementById('customLongitude');

        if (latInput && lonInput) {
            const lat = parseFloat(latInput.value);
            const lon = parseFloat(lonInput.value);

            if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                this.currentLocation = {
                    name: "Position personnalisée",
                    lat: lat,
                    lon: lon,
                    timezone: "UTC"
                };
                this.updateLocationDisplay();
                this.calculateSunPosition();
                console.log(`📍 Position personnalisée: ${lat}°, ${lon}°`);
            } else {
                alert('Coordonnées invalides. Latitude: -90 à 90, Longitude: -180 à 180');
            }
        }
    }

    updateLocationDisplay() {
        const locationSpan = document.getElementById('currentLocation');
        const latSpan = document.getElementById('currentLatitude');
        const lonSpan = document.getElementById('currentLongitude');

        if (locationSpan) locationSpan.textContent = this.currentLocation.name;
        if (latSpan) latSpan.textContent = `${this.currentLocation.lat.toFixed(4)}°${this.currentLocation.lat >= 0 ? 'N' : 'S'}`;
        if (lonSpan) lonSpan.textContent = `${this.currentLocation.lon.toFixed(4)}°${this.currentLocation.lon >= 0 ? 'E' : 'O'}`;
    }

    // === CONTRÔLES D'ORIENTATION ===
    setupOrientationControls() {
        const northOrientation = document.getElementById('northOrientation');
        const northOrientationValue = document.getElementById('northOrientationValue');

        if (northOrientation && northOrientationValue) {
            northOrientation.addEventListener('input', (e) => {
                this.northOrientation = parseInt(e.target.value);
                this.updateOrientationDisplay();
                this.updateCompass();
                
                // Mettre à jour la flèche du nord dans la scène 3D
                if (window.SceneManager && window.SceneManager.setNorthOrientation) {
                    window.SceneManager.setNorthOrientation(this.northOrientation);
                }
                
                // Recalculer les ombres avec la nouvelle orientation
                // Petit délai pour s'assurer que toutes les mises à jour sont appliquées
                setTimeout(() => {
                    this.calculateSunPosition();
                    // console.log(`🧭 Orientation du Nord changée: ${this.northOrientation}° - Ombres recalculées`);
                }, 50);
            });
        }
    }

    updateOrientationDisplay() {
        const valueSpan = document.getElementById('northOrientationValue');
        if (valueSpan) {
            let description = "";
            if (this.northOrientation === 0) description = " (Nord en haut)";
            else if (this.northOrientation === 90) description = " (Nord à droite)";
            else if (this.northOrientation === 180) description = " (Nord en bas)";
            else if (this.northOrientation === 270) description = " (Nord à gauche)";

            valueSpan.textContent = `${this.northOrientation}°${description}`;
        }
    }

    updateCompass() {
        const needle = document.getElementById('compassNeedle');
        if (needle) {
            // La rotation de l'aiguille suit l'orientation du nord
            needle.style.transform = `translate(-50%, -100%) rotate(${this.northOrientation}deg)`;
        }
    }

    // === CONTRÔLES DE DATE ET HEURE ===
    setupDateTimeControls() {
        this.setupDateControls();
        this.setupTimeControls();
        this.setupQuickTimeButtons();
    }

    setupDateControls() {
        const dateInput = document.getElementById('simulationDate');
        const todayBtn = document.getElementById('setToday');

        if (dateInput) {
            // Initialiser avec la date actuelle
            dateInput.value = this.simulationDate.toISOString().split('T')[0];
            
            dateInput.addEventListener('change', (e) => {
                this.simulationDate = new Date(e.target.value);
                this.calculateSunPosition();
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.simulationDate = new Date();
                if (dateInput) {
                    dateInput.value = this.simulationDate.toISOString().split('T')[0];
                }
                this.calculateSunPosition();
            });
        }
    }

    setupTimeControls() {
        const timeInput = document.getElementById('simulationTime');
        const timeValue = document.getElementById('simulationTimeValue');

        if (timeInput && timeValue) {
            timeInput.addEventListener('input', (e) => {
                this.simulationTime = parseFloat(e.target.value);
                this.updateTimeDisplay();
                this.calculateSunPosition();
            });
            
            this.updateTimeDisplay();
        }
    }

    setupQuickTimeButtons() {
        const timePresets = document.querySelectorAll('.time-preset');
        timePresets.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const time = parseInt(e.target.dataset.time);
                this.simulationTime = time;
                
                const timeInput = document.getElementById('simulationTime');
                if (timeInput) timeInput.value = time;
                
                this.updateTimeDisplay();
                this.calculateSunPosition();
            });
        });
    }

    updateTimeDisplay() {
        const timeValue = document.getElementById('simulationTimeValue');
        if (timeValue) {
            const hours = Math.floor(this.simulationTime);
            const minutes = Math.round((this.simulationTime - hours) * 60);
            timeValue.textContent = `${hours.toString().padStart(2, '0')}h${minutes.toString().padStart(2, '0')}`;
        }
    }

    // === CALCUL POSITION SOLAIRE ===
    calculateSunPosition() {
        const sunPos = this.getSunPosition(
            this.simulationDate,
            this.simulationTime,
            this.currentLocation.lat,
            this.currentLocation.lon
        );

        // Corriger l'azimut selon l'orientation du nord
        const correctedAzimuth = (sunPos.azimuth + this.northOrientation) % 360;

        // Afficher les valeurs calculées
        const azimuthSpan = document.getElementById('calculatedAzimuth');
        const elevationSpan = document.getElementById('calculatedElevation');

        if (azimuthSpan) azimuthSpan.textContent = `${Math.round(correctedAzimuth)}°`;
        if (elevationSpan) elevationSpan.textContent = `${Math.round(sunPos.elevation)}°`;

        // Appliquer si le mode automatique est activé
        if (this.useCalculatedSun) {
            this.applySunPosition(correctedAzimuth, sunPos.elevation);
        }

        // console.log(`☀️ Position solaire calculée: Azimut ${Math.round(correctedAzimuth)}° (base: ${Math.round(sunPos.azimuth)}° + orientation Nord: ${this.northOrientation}°), Élévation ${Math.round(sunPos.elevation)}°`);
    }

    getSunPosition(date, hour, latitude, longitude) {
        // Algorithme simplifié de calcul de position solaire
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        // Jour julien
        const julianDay = this.getJulianDay(year, month, day);
        const n = julianDay - 2451545.0;

        // Longitude solaire moyenne
        const L = (280.460 + 0.9856474 * n) % 360;

        // Anomalie moyenne
        const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;

        // Longitude écliptique
        const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;

        // Déclinaison
        const delta = Math.asin(Math.sin(lambda) * Math.sin(23.44 * Math.PI / 180));

        // Angle horaire
        const omega = ((hour - 12) * 15 + longitude) * Math.PI / 180;

        // Latitude en radians
        const phi = latitude * Math.PI / 180;

        // Élévation solaire
        const elevation = Math.asin(
            Math.sin(delta) * Math.sin(phi) + 
            Math.cos(delta) * Math.cos(phi) * Math.cos(omega)
        ) * 180 / Math.PI;

        // Azimut solaire
        let azimuth = Math.atan2(
            -Math.sin(omega),
            Math.tan(delta) * Math.cos(phi) - Math.sin(phi) * Math.cos(omega)
        ) * 180 / Math.PI + 180;

        if (azimuth < 0) azimuth += 360;

        return {
            elevation: Math.max(0, elevation),
            azimuth: azimuth
        };
    }

    getJulianDay(year, month, day) {
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        const a = Math.floor(year / 100);
        const b = 2 - a + Math.floor(a / 4);
        return Math.floor(365.25 * (year + 4716)) + 
               Math.floor(30.6001 * (month + 1)) + 
               day + b - 1524.5;
    }

    applySunPosition(azimuth, elevation) {
        // Mettre à jour les sliders manuels
        const azimuthSlider = document.getElementById('sunAzimuth');
        const elevationSlider = document.getElementById('sunElevation');
        const azimuthValue = document.getElementById('sunAzimuthValue');
        const elevationValue = document.getElementById('sunElevationValue');

        if (azimuthSlider) azimuthSlider.value = azimuth;
        if (elevationSlider) elevationSlider.value = elevation;
        if (azimuthValue) azimuthValue.textContent = `${Math.round(azimuth)}°`;
        if (elevationValue) elevationValue.textContent = `${Math.round(elevation)}°`;

        // Appliquer à la scène 3D avec l'orientation du Nord
        if (window.SceneManager && window.SceneManager.scene) {
            if (window.SceneManager.setSunPositionAdvanced) {
                window.SceneManager.setSunPositionAdvanced(azimuth, elevation, this.northOrientation);
            } else {
                window.SceneManager.setSunPosition(azimuth, elevation);
            }
            
            // Appliquer l'éclairage temporel selon l'heure
            if (window.SceneManager.setTimeBasedLighting) {
                const season = this.getCurrentSeason();
                window.SceneManager.setTimeBasedLighting(this.simulationTime, season);
            }
            
            // Forcer la mise à jour des ombres en invalidant le rendu
            if (window.SceneManager.renderer && window.SceneManager.renderer.shadowMap) {
                window.SceneManager.renderer.shadowMap.needsUpdate = true;
            }
            
            // console.log(`🌞 Position solaire appliquée: Azimut ${Math.round(azimuth)}°, Élévation ${Math.round(elevation)}°`);
        } else {
            // console.warn('🌞 applySunPosition: SceneManager ou scene non disponible, position différée');
            // Réessayer plus tard quand la scène sera prête
            setTimeout(() => {
                if (window.SceneManager && window.SceneManager.scene) {
                    this.applySunPosition(azimuth, elevation);
                }
            }, 500);
        }
    }

    // === CONTRÔLES DE SOLEIL ===
    setupSunControls() {
        const useCalculatedSun = document.getElementById('useCalculatedSun');
        const manualControls = document.getElementById('manualSunControls');

        if (useCalculatedSun) {
            useCalculatedSun.addEventListener('change', (e) => {
                this.useCalculatedSun = e.target.checked;
                if (manualControls) {
                    manualControls.style.display = this.useCalculatedSun ? 'none' : 'block';
                }
                
                if (this.useCalculatedSun) {
                    this.calculateSunPosition();
                }
            });
        }

        // Contrôles manuels
        this.setupManualSunControls();
    }

    setupManualSunControls() {
        const sunAzimuth = document.getElementById('sunAzimuth');
        const sunAzimuthValue = document.getElementById('sunAzimuthValue');
        const sunElevation = document.getElementById('sunElevation');
        const sunElevationValue = document.getElementById('sunElevationValue');

        if (sunAzimuth && sunAzimuthValue) {
            sunAzimuth.addEventListener('input', (e) => {
                if (!this.useCalculatedSun) {
                    const azimuth = parseInt(e.target.value);
                    sunAzimuthValue.textContent = `${azimuth}°`;
                    if (window.SceneManager) {
                        window.SceneManager.setSunPosition(azimuth, null);
                    }
                }
            });
        }

        if (sunElevation && sunElevationValue) {
            sunElevation.addEventListener('input', (e) => {
                if (!this.useCalculatedSun) {
                    const elevation = parseInt(e.target.value);
                    sunElevationValue.textContent = `${elevation}°`;
                    if (window.SceneManager) {
                        window.SceneManager.setSunPosition(null, elevation);
                    }
                }
            });
        }
    }

    // === CONTRÔLES DE RENDU ===
    setupRenderingControls() {
        // Ombres
        const enableShadows = document.getElementById('enableShadows');
        if (enableShadows) {
            enableShadows.addEventListener('change', (e) => {
                if (window.SceneManager) {
                    window.SceneManager.setShadowsEnabled(e.target.checked);
                }
            });
        }

        // Intensité des ombres
        const shadowIntensity = document.getElementById('shadowIntensity');
        const shadowIntensityValue = document.getElementById('shadowIntensityValue');
        if (shadowIntensity && shadowIntensityValue) {
            shadowIntensity.addEventListener('input', (e) => {
                const intensity = parseFloat(e.target.value);
                shadowIntensityValue.textContent = intensity.toFixed(1);
                if (window.SceneManager) {
                    window.SceneManager.setShadowIntensity(intensity);
                }
            });
        }

        // Éclairage ambiant
        const ambientLight = document.getElementById('ambientLight');
        const ambientLightValue = document.getElementById('ambientLightValue');
        if (ambientLight && ambientLightValue) {
            ambientLight.addEventListener('input', (e) => {
                const intensity = parseFloat(e.target.value);
                ambientLightValue.textContent = intensity.toFixed(1);
                if (window.SceneManager) {
                    window.SceneManager.setAmbientLightIntensity(intensity);
                }
            });
        }

        // Qualité des ombres
        const shadowMapSize = document.getElementById('shadowMapSize');
        if (shadowMapSize) {
            shadowMapSize.addEventListener('change', (e) => {
                if (window.SceneManager) {
                    window.SceneManager.setShadowMapSize(parseInt(e.target.value));
                }
            });
        }

        // Adoucissement des ombres
        const shadowSoftness = document.getElementById('shadowSoftness');
        const shadowSoftnessValue = document.getElementById('shadowSoftnessValue');
        if (shadowSoftness && shadowSoftnessValue) {
            shadowSoftness.addEventListener('input', (e) => {
                const softness = parseInt(e.target.value);
                shadowSoftnessValue.textContent = softness;
                if (window.SceneManager) {
                    window.SceneManager.setShadowSoftness(softness);
                }
            });
        }
    }

    updateDisplay() {
        this.updateLocationDisplay();
        this.updateOrientationDisplay();
        this.updateCompass();
        this.updateTimeDisplay();
    }

    // === API PUBLIQUE ===
    setLocation(locationKey) {
        if (this.locations[locationKey]) {
            this.currentLocation = this.locations[locationKey];
            this.updateLocationDisplay();
            this.calculateSunPosition();
            console.log(`📍 Position changée: ${this.currentLocation.name}`);
        }
    }

    setNorthOrientation(angle) {
        this.northOrientation = angle;
        const slider = document.getElementById('northOrientation');
        if (slider) slider.value = angle;
        this.updateOrientationDisplay();
        this.updateCompass();
        this.calculateSunPosition();
    }

    setDateTime(date, hour) {
        if (date) this.simulationDate = new Date(date);
        if (hour !== undefined) this.simulationTime = hour;
        
        const dateInput = document.getElementById('simulationDate');
        const timeInput = document.getElementById('simulationTime');
        
        if (dateInput && date) {
            dateInput.value = this.simulationDate.toISOString().split('T')[0];
        }
        if (timeInput && hour !== undefined) {
            timeInput.value = hour;
        }
        
        this.updateTimeDisplay();
        this.calculateSunPosition();
    }

    getCurrentSunPosition() {
        return {
            azimuth: this.useCalculatedSun ? 
                (this.getSunPosition(this.simulationDate, this.simulationTime, this.currentLocation.lat, this.currentLocation.lon).azimuth + this.northOrientation) % 360 :
                parseInt(document.getElementById('sunAzimuth')?.value || 180),
            elevation: this.useCalculatedSun ?
                this.getSunPosition(this.simulationDate, this.simulationTime, this.currentLocation.lat, this.currentLocation.lon).elevation :
                parseInt(document.getElementById('sunElevation')?.value || 45)
        };
    }

    getCurrentSeason() {
        // Déterminer la saison selon la date
        const month = this.simulationDate.getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    // === MÉTHODES D'AIDE DIDACTIQUE ===
    explainSunPosition() {
        const sunPos = this.getCurrentSunPosition();
        const season = this.getCurrentSeason();
        const timeDesc = this.getTimeDescription(this.simulationTime);
        
        console.log(`📚 Explication de la position solaire:
🌍 Lieu: ${this.currentLocation.name}
📅 Date: ${this.simulationDate.toLocaleDateString('fr-FR')} (${season})
🕐 Heure: ${timeDesc}
☀️ Azimut: ${Math.round(sunPos.azimuth)}° depuis le Nord
📐 Élévation: ${Math.round(sunPos.elevation)}° au-dessus de l'horizon
🧭 Orientation terrain: ${this.northOrientation}°`);
        
        return {
            location: this.currentLocation.name,
            date: this.simulationDate.toLocaleDateString('fr-FR'),
            season: season,
            time: timeDesc,
            azimuth: Math.round(sunPos.azimuth),
            elevation: Math.round(sunPos.elevation),
            northOffset: this.northOrientation
        };
    }

    getTimeDescription(hour) {
        if (hour < 5) return `${Math.floor(hour)}h${String(Math.round((hour % 1) * 60)).padStart(2, '0')} (Nuit)`;
        if (hour < 8) return `${Math.floor(hour)}h${String(Math.round((hour % 1) * 60)).padStart(2, '0')} (Aube)`;
        if (hour < 12) return `${Math.floor(hour)}h${String(Math.round((hour % 1) * 60)).padStart(2, '0')} (Matin)`;
        if (hour < 14) return `${Math.floor(hour)}h${String(Math.round((hour % 1) * 60)).padStart(2, '0')} (Midi)`;
        if (hour < 18) return `${Math.floor(hour)}h${String(Math.round((hour % 1) * 60)).padStart(2, '0')} (Après-midi)`;
        if (hour < 21) return `${Math.floor(hour)}h${String(Math.round((hour % 1) * 60)).padStart(2, '0')} (Soirée)`;
        return `${Math.floor(hour)}h${String(Math.round((hour % 1) * 60)).padStart(2, '0')} (Nuit)`;
    }
}

// Initialisation globale
window.ShadowManager = null;

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que le TabManager soit initialisé
    setTimeout(() => {
        window.ShadowManager = new ShadowManager();
        // console.log('🌞 ShadowManager initialisé et disponible globalement');
    }, 1000);
});
