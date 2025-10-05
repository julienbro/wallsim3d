class TexturesManager {
    constructor(options = {}) {
        this.texturesPath = options.texturesPath || 'assets/textures';
        this.manifestUrl = options.manifestUrl || `${this.texturesPath}/manifest.json`;
        this.itemsContainer = null;
        this.loadedTextures = {}; // id -> Texture
        this.sectionId = 'textures-dynamic';
    }

    async init() {
        const tab = document.getElementById('material-textures-tab');
        if (!tab) return;
        tab.innerHTML = `
            <div class="material-section" data-section="${this.sectionId}">
                <div class="material-section-header">
                    <span>🖼️ TEXTURES (assets/textures)</span>
                    <span class="expand-icon">▼</span>
                </div>
                <div class="material-section-content">
                    <div class="texture-grid" id="textures-grid"></div>
                </div>
            </div>
        `;

        this.itemsContainer = document.getElementById('textures-grid');
        this.bindCollapse(tab.querySelector('.material-section-header'));

        // Load manifest with inline fallback
        const items = await this.loadManifest();
        if (!items || items.length === 0) {
            this.renderEmptyState();
            return;
        }
        await this.registerAsMaterials(items);
        this.renderTextures(items);
    }

    bindCollapse(header) {
        if (!header) return;
        header.addEventListener('click', () => {
            const section = header.closest('.material-section');
            section.classList.toggle('collapsed');
        });
    }

    loadInlineManifest() {
        try {
            const script = document.getElementById('textures-manifest');
            if (!script) return null;
            const raw = script.textContent || script.innerText;
            const list = JSON.parse(raw);
            return Array.isArray(list) ? list : null;
        } catch (e) {
            return null;
        }
    }

    async loadManifest() {
        // 1) Inline first
        const inline = this.loadInlineManifest();
        if (inline && inline.length) {
            return inline.map(x => ({
                id: `tex-${x.id}`,
                name: x.name || x.id,
                file: x.file,
                url: `${this.texturesPath}/${x.file}`
            }));
        }
        // 2) Fallback to fetch
        try {
            const res = await fetch(this.manifestUrl, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const list = await res.json();
            return list.map(x => ({
                id: `tex-${x.id}`,
                name: x.name || x.id,
                file: x.file,
                url: `${this.texturesPath}/${x.file}`
            }));
        } catch (e) {
            console.warn('⚠️ Manifest des textures indisponible (inline ou fetch).', e);
            return [];
        }
    }

    async registerAsMaterials(items) {
        if (!window.MaterialLibrary || !window.THREE) return;
        for (const it of items) {
            window.MaterialLibrary.materials[it.id] = {
                name: `${it.name} (Texture)`,
                color: 0xFFFFFF,
                mapUrl: it.url,
                section: 'modernes-composites',
                description: `Texture depuis ${it.file}`,
                isTexture: true
            };
        }
        if (window.ExtendedMaterialManager) {
            try { window.ExtendedMaterialManager.refreshInterface(); } catch {}
        }
        const select = document.getElementById('materialSelect');
        if (select) {
            let optgroup = Array.from(select.querySelectorAll('optgroup')).find(g => g.label === 'TEXTURES');
            if (!optgroup) {
                optgroup = document.createElement('optgroup');
                optgroup.label = 'TEXTURES';
                select.appendChild(optgroup);
            }
            optgroup.innerHTML = '';
            for (const it of items) {
                const opt = document.createElement('option');
                opt.value = it.id;
                opt.textContent = `${it.name} (Texture)`;
                optgroup.appendChild(opt);
            }
        }
    }

    renderTextures(items) {
        if (!this.itemsContainer) return;
        this.itemsContainer.innerHTML = '';
        for (const it of items) {
            const el = document.createElement('div');
            el.className = 'texture-item';
            el.dataset.texture = it.id;
            el.style.backgroundImage = `url('${it.url}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.title = it.name;
            el.innerHTML = `<span class="texture-name">${it.name}</span>`;

            el.addEventListener('click', () => {
                document.querySelectorAll('.texture-item').forEach(n => n.classList.remove('active'));
                el.classList.add('active');
                const materialSelect = document.getElementById('materialSelect');
                if (materialSelect) {
                    materialSelect.value = it.id;
                    materialSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (window.MaterialPainter) {
                    window.MaterialPainter.startPaintingWithMaterial(it.id);
                }
            });

            this.itemsContainer.appendChild(el);
        }
    }

    renderEmptyState() {
        if (!this.itemsContainer) return;
        this.itemsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; opacity: 0.8; padding: 12px;">
                Aucune texture trouvée. Assurez-vous que les fichiers existent dans <code>assets/textures</code>.
            </div>
        `;
    }
}

// Boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.TexturesManager = new TexturesManager();
    window.TexturesManager.init();
});
