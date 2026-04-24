// Ensure everything runs after load
window.onload = function() {
    const canvasPreset = document.getElementById('canvas-preset');
    const initialDims = canvasPreset.value ? canvasPreset.value.split('x').map(Number) : [1080, 1920];
    
    const canvas = new fabric.Canvas('main-canvas', {
        width: initialDims[0],
        height: initialDims[1],
        backgroundColor: '#000000',
        preserveObjectStacking: true
    });

    canvas.setWidth(initialDims[0]);
    canvas.setHeight(initialDims[1]);

    // Helper to safely get elements
    const get = (id) => document.getElementById(id);

    // UI Elements
    const elements = {
        imageUpload: get('image-upload'),
        dropZone: get('drop-zone'),
        addFadeBtn: get('add-fade'),
        shadowEditControls: get('shadow-edit-controls'),
        shadowHeightSlider: get('shadow-height-slider'),
        shadowOpacitySlider: get('shadow-opacity-slider'),
        addTextBtn: get('add-text'),
        addHighlightBtn: get('add-highlight-text'),
        btnUppercase: get('btn-uppercase'),
        btnLowercase: get('btn-lowercase'),
        bringForwardBtn: get('bring-forward'),
        sendBackwardsBtn: get('send-backwards'),
        textControls: get('text-edit-controls'),
        textInput: get('text-input'),
        fontSizeInput: get('font-size'),
        lineHeightInput: get('line-height'),
        textColorInput: get('text-color'),
        fontFamilyInput: get('font-family'),
        fontWeightInput: get('font-weight'),
        charSpacingInput: get('char-spacing'),
        shadowBlurInput: get('shadow-blur'),
        strokeWidthInput: get('stroke-width'),
        strokeColorInput: get('stroke-color'),
        downloadBtn: get('download-btn'),
        resetBtn: get('reset-btn')
    };

    let selectedObject = null;

    function resizeCanvasDisplay() {
        const wrapper = document.querySelector('.canvas-wrapper');
        const container = get('scaling-container');
        if (!wrapper || !container) return;

        wrapper.style.width = canvas.width + 'px';
        wrapper.style.height = canvas.height + 'px';
        wrapper.style.transform = 'none';
        
        const availableWidth = container.clientWidth - 40;
        const availableHeight = container.clientHeight - 80;
        const scaleX = availableWidth / canvas.width;
        const scaleY = availableHeight / canvas.height;
        const scale = Math.min(scaleX, scaleY, 0.95);
        wrapper.style.transform = `scale(${scale})`;
    }

    window.addEventListener('resize', resizeCanvasDisplay);
    resizeCanvasDisplay();
    setTimeout(resizeCanvasDisplay, 300);

    // Background Image Upload
    if (elements.imageUpload) {
        elements.imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(f) {
                fabric.Image.fromURL(f.target.result, (img) => {
                    canvas.getObjects().forEach(obj => { if (obj.isBackground) canvas.remove(obj); });
                    img.set({ originX: 'left', originY: 'top', isBackground: true, selectable: false, evented: false });
                    img.scale(Math.max(canvas.width / img.width, canvas.height / img.height)).center();
                    canvas.insertAt(img, 0).renderAll();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // Shadow Fade Logic
    function updateFadeShadow() {
        const fadeShadow = canvas.getObjects().find(obj => obj.isFadeShadow);
        if (!fadeShadow || !elements.shadowHeightSlider || !elements.shadowOpacitySlider) return;

        const h = parseInt(elements.shadowHeightSlider.value) / 100;
        const o = parseInt(elements.shadowOpacitySlider.value) / 100;
        const fadeH = canvas.height * h;

        fadeShadow.set({
            top: canvas.height - fadeH,
            width: canvas.width,
            height: fadeH,
            fill: new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'pixels',
                coords: { x1: 0, y1: 0, x2: 0, y2: fadeH },
                colorStops: [
                    { offset: 0, color: 'rgba(0,0,0,0)' },
                    { offset: 0.5, color: `rgba(0,0,0,${0.6 * o})` },
                    { offset: 1, color: `rgba(0,0,0,${o})` }
                ]
            })
        });
        canvas.renderAll();
    }

    if (elements.addFadeBtn) {
        elements.addFadeBtn.addEventListener('click', () => {
            let fade = canvas.getObjects().find(obj => obj.isFadeShadow);
            if (fade) { elements.shadowEditControls?.classList.remove('hidden'); return; }

            const h = parseInt(elements.shadowHeightSlider?.value || 45) / 100;
            const o = parseInt(elements.shadowOpacitySlider?.value || 85) / 100;
            const fadeH = canvas.height * h;

            fade = new fabric.Rect({
                left: 0, top: canvas.height - fadeH, width: canvas.width, height: fadeH,
                selectable: false, evented: false, isFadeShadow: true,
                fill: new fabric.Gradient({
                    type: 'linear', gradientUnits: 'pixels',
                    coords: { x1: 0, y1: 0, x2: 0, y2: fadeH },
                    colorStops: [
                        { offset: 0, color: 'rgba(0,0,0,0)' },
                        { offset: 0.5, color: `rgba(0,0,0,${0.6 * o})` },
                        { offset: 1, color: `rgba(0,0,0,${o})` }
                    ]
                })
            });

            canvas.add(fade);
            const bg = canvas.getObjects().find(obj => obj.isBackground);
            if (bg) fade.moveTo(canvas.getObjects().indexOf(bg) + 1); else fade.sendToBack();
            elements.shadowEditControls?.classList.remove('hidden');
            canvas.renderAll();
        });
    }

    if (elements.shadowHeightSlider) elements.shadowHeightSlider.addEventListener('input', updateFadeShadow);
    if (elements.shadowOpacitySlider) elements.shadowOpacitySlider.addEventListener('input', updateFadeShadow);

    // Add Text
    function createStyledText(content, color) {
        return new fabric.IText(content, {
            left: canvas.width / 2, top: canvas.height / 2,
            fontFamily: 'Poppins', fontSize: 160, fill: color || '#ffffff', fontWeight: '900',
            originX: 'center', originY: 'center', textAlign: 'center', charSpacing: -40, lineHeight: 0.9,
            cornerColor: '#3b82f6', cornerSize: 12, transparentCorners: false,
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 15, offsetX: 5, offsetY: 5 })
        });
    }

    elements.addTextBtn?.addEventListener('click', () => {
        const text = createStyledText('TEXT HERE', '#ffffff');
        canvas.add(text).setActiveObject(text).renderAll();
    });

    elements.addHighlightBtn?.addEventListener('click', () => {
        const text = createStyledText('HIGHLIGHT', '#9b1b30');
        canvas.add(text).setActiveObject(text).renderAll();
    });

    // Case Controls
    elements.btnUppercase?.addEventListener('click', () => {
        if (selectedObject?.text) {
            selectedObject.set('text', selectedObject.text.toUpperCase());
            if (elements.textInput) elements.textInput.value = selectedObject.text;
            canvas.renderAll();
        }
    });

    elements.btnLowercase?.addEventListener('click', () => {
        if (selectedObject?.text) {
            selectedObject.set('text', selectedObject.text.toLowerCase());
            if (elements.textInput) elements.textInput.value = selectedObject.text;
            canvas.renderAll();
        }
    });

    // Layering
    elements.bringForwardBtn?.addEventListener('click', () => {
        const obj = canvas.getActiveObject();
        if (obj) canvas.bringToFront(obj).renderAll();
    });

    elements.sendBackwardsBtn?.addEventListener('click', () => {
        const obj = canvas.getActiveObject();
        if (obj) {
            const bg = canvas.getObjects().find(o => o.isBackground);
            const fade = canvas.getObjects().find(o => o.isFadeShadow);
            const min = (fade ? canvas.getObjects().indexOf(fade) : (bg ? canvas.getObjects().indexOf(bg) : -1)) + 1;
            canvas.moveTo(obj, Math.max(min, canvas.getObjects().indexOf(obj) - 1)).renderAll();
        }
    });

    // Selection Events
    canvas.on('selection:created', (e) => updateTextControls(e.selected[0]));
    canvas.on('selection:updated', (e) => updateTextControls(e.selected[0]));
    canvas.on('selection:cleared', () => {
        elements.textControls?.classList.add('hidden');
        selectedObject = null;
    });

    canvas.on('text:changed', (e) => {
        if (e.target === selectedObject && elements.textInput) {
            elements.textInput.value = e.target.text;
        }
    });

    function updateTextControls(obj) {
        if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
            selectedObject = obj;
            elements.textControls?.classList.remove('hidden');
            if (elements.textInput) elements.textInput.value = obj.text || '';
            if (elements.fontSizeInput) elements.fontSizeInput.value = obj.fontSize || 160;
            if (elements.lineHeightInput) elements.lineHeightInput.value = obj.lineHeight || 0.9;
            if (elements.textColorInput) elements.textColorInput.value = obj.fill || '#ffffff';
            if (elements.fontFamilyInput) elements.fontFamilyInput.value = obj.fontFamily || 'Poppins';
            if (elements.fontWeightInput) elements.fontWeightInput.value = obj.fontWeight || '900';
            if (elements.charSpacingInput) elements.charSpacingInput.value = obj.charSpacing || -40;
            if (elements.shadowBlurInput) elements.shadowBlurInput.value = obj.shadow ? obj.shadow.blur : 15;
            if (elements.strokeWidthInput) elements.strokeWidthInput.value = obj.strokeWidth || 0;
            if (elements.strokeColorInput) elements.strokeColorInput.value = obj.stroke || '#000000';
        } else {
            elements.textControls?.classList.add('hidden');
        }
    }

    elements.textInput?.addEventListener('input', (e) => {
        if (selectedObject) { selectedObject.set('text', e.target.value); canvas.renderAll(); }
    });

    const propInputs = [
        ['fontSizeInput', 'fontSize', parseInt],
        ['lineHeightInput', 'lineHeight', parseFloat],
        ['textColorInput', 'fill', String],
        ['fontFamilyInput', 'fontFamily', String],
        ['fontWeightInput', 'fontWeight', String],
        ['charSpacingInput', 'charSpacing', parseInt],
        ['strokeWidthInput', 'strokeWidth', parseInt],
        ['strokeColorInput', 'stroke', String]
    ];

    propInputs.forEach(([elName, prop, parser]) => {
        const el = elements[elName];
        if (el) {
            const eventType = el.tagName === 'SELECT' ? 'change' : 'input';
            el.addEventListener(eventType, () => {
                if (selectedObject) { selectedObject.set(prop, parser(el.value)); canvas.renderAll(); }
            });
        }
    });

    elements.shadowBlurInput?.addEventListener('input', () => {
        if (selectedObject) {
            if (!selectedObject.shadow) selectedObject.shadow = new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', offsetX: 5, offsetY: 5 });
            selectedObject.shadow.blur = parseInt(elements.shadowBlurInput.value) || 0;
            canvas.renderAll();
        }
    });

    canvasPreset.addEventListener('change', (e) => {
        const [w, h] = e.target.value.split('x').map(Number);
        canvas.setDimensions({ width: w, height: h });
        resizeCanvasDisplay();
        const bg = canvas.getObjects().find(o => o.isBackground);
        if (bg) bg.scale(Math.max(canvas.width / bg.width, canvas.height / bg.height)).center();
        updateFadeShadow();
        canvas.renderAll();
    });

    elements.downloadBtn?.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `thumbnail-${Date.now()}.png`;
        link.href = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        link.click();
    });

    elements.resetBtn?.addEventListener('click', () => {
        if (confirm('Clear work?')) {
            canvas.clear().setBackgroundColor('#000000', canvas.renderAll.bind(canvas));
            elements.textControls?.classList.add('hidden');
            elements.shadowEditControls?.classList.add('hidden');
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const obj = canvas.getActiveObject();
            if (obj && !obj.isEditing) { canvas.remove(obj).discardActiveObject().renderAll(); }
        }
    });
};
