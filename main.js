// Ensure everything runs after load
window.onload = function() {
    const canvasPreset = document.getElementById('canvas-preset');
    const initialDims = canvasPreset.value.split('x').map(Number);
    
    const canvas = new fabric.Canvas('main-canvas', {
        width: initialDims[0],
        height: initialDims[1],
        backgroundColor: '#000000',
        preserveObjectStacking: true
    });

    canvas.setWidth(initialDims[0]);
    canvas.setHeight(initialDims[1]);

    // UI Elements
    const imageUpload = document.getElementById('image-upload');
    const dropZone = document.getElementById('drop-zone');
    const addFadeBtn = document.getElementById('add-fade');
    const shadowEditControls = document.getElementById('shadow-edit-controls');
    const shadowHeightSlider = document.getElementById('shadow-height-slider');
    const shadowOpacitySlider = document.getElementById('shadow-opacity-slider');
    
    const addTextBtn = document.getElementById('add-text');
    const addHighlightBtn = document.getElementById('add-highlight-text');
    const bringForwardBtn = document.getElementById('bring-forward');
    const sendBackwardsBtn = document.getElementById('send-backwards');
    const textControls = document.getElementById('text-edit-controls');
    const textInput = document.getElementById('text-input');
    const fontSizeInput = document.getElementById('font-size');
    const lineHeightInput = document.getElementById('line-height');
    const textColorInput = document.getElementById('text-color');
    const fontFamilyInput = document.getElementById('font-family');
    const fontWeightInput = document.getElementById('font-weight');
    const charSpacingInput = document.getElementById('char-spacing');
    const shadowBlurInput = document.getElementById('shadow-blur');
    const strokeWidthInput = document.getElementById('stroke-width');
    const strokeColorInput = document.getElementById('stroke-color');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');

    let selectedObject = null;

    function resizeCanvasDisplay() {
        const wrapper = document.querySelector('.canvas-wrapper');
        const container = document.getElementById('scaling-container');
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
    imageUpload.addEventListener('change', handleImageUpload);

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(f) {
            const data = f.target.result;
            fabric.Image.fromURL(data, function(img) {
                const objects = canvas.getObjects();
                objects.forEach(obj => {
                    if (obj.isBackground) canvas.remove(obj);
                });

                img.set({
                    originX: 'left',
                    originY: 'top',
                    isBackground: true,
                    selectable: false,
                    evented: false
                });
                
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                img.scale(scale);
                img.center();
                
                canvas.insertAt(img, 0);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(file);
    }

    // Shadow Fade Logic
    function updateFadeShadow() {
        const fadeShadow = canvas.getObjects().find(obj => obj.isFadeShadow);
        if (!fadeShadow) return;

        const heightPercent = parseInt(shadowHeightSlider.value) / 100;
        const opacityPercent = parseInt(shadowOpacitySlider.value) / 100;
        const fadeHeight = canvas.height * heightPercent;

        fadeShadow.set({
            top: canvas.height - fadeHeight,
            width: canvas.width,
            height: fadeHeight,
            fill: new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'pixels',
                coords: { x1: 0, y1: 0, x2: 0, y2: fadeHeight },
                colorStops: [
                    { offset: 0, color: 'rgba(0,0,0,0)' },
                    { offset: 0.5, color: `rgba(0,0,0,${0.6 * opacityPercent})` },
                    { offset: 1, color: `rgba(0,0,0,${opacityPercent})` }
                ]
            })
        });
        canvas.renderAll();
    }

    addFadeBtn.addEventListener('click', () => {
        const objects = canvas.getObjects();
        let fadeShadow = objects.find(obj => obj.isFadeShadow);
        
        if (fadeShadow) {
            shadowEditControls.classList.remove('hidden');
            return;
        }

        const heightPercent = parseInt(shadowHeightSlider.value) / 100;
        const opacityPercent = parseInt(shadowOpacitySlider.value) / 100;
        const fadeHeight = canvas.height * heightPercent;

        fadeShadow = new fabric.Rect({
            left: 0,
            top: canvas.height - fadeHeight,
            width: canvas.width,
            height: fadeHeight,
            selectable: false,
            evented: false,
            isFadeShadow: true,
            fill: new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'pixels',
                coords: { x1: 0, y1: 0, x2: 0, y2: fadeHeight },
                colorStops: [
                    { offset: 0, color: 'rgba(0,0,0,0)' },
                    { offset: 0.5, color: `rgba(0,0,0,${0.6 * opacityPercent})` },
                    { offset: 1, color: `rgba(0,0,0,${opacityPercent})` }
                ]
            })
        });

        canvas.add(fadeShadow);
        const background = canvas.getObjects().find(obj => obj.isBackground);
        if (background) {
            fadeShadow.moveTo(canvas.getObjects().indexOf(background) + 1);
        } else {
            fadeShadow.sendToBack();
        }
        
        shadowEditControls.classList.remove('hidden');
        canvas.renderAll();
    });

    shadowHeightSlider.addEventListener('input', updateFadeShadow);
    shadowOpacitySlider.addEventListener('input', updateFadeShadow);

    // Add Text
    function createStyledText(content, color) {
        const text = new fabric.IText(content, {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontFamily: 'Poppins',
            fontSize: 160,
            fill: color || '#ffffff',
            fontWeight: '900',
            stroke: '#000000',
            strokeWidth: 0,
            originX: 'center',
            originY: 'center',
            cornerColor: '#3b82f6',
            cornerSize: 12,
            transparentCorners: false,
            textAlign: 'center',
            charSpacing: -40,
            lineHeight: 0.9,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.6)',
                blur: 15,
                offsetX: 5,
                offsetY: 5
            })
        });
        return text;
    }

    addTextBtn.addEventListener('click', () => {
        const text = createStyledText('TEXT HERE', '#ffffff');
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    });

    addHighlightBtn.addEventListener('click', () => {
        const text = createStyledText('HIGHLIGHT', '#9b1b30');
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    });

    // Layering
    bringForwardBtn.addEventListener('click', () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.bringToFront(activeObject);
            canvas.renderAll();
        }
    });

    sendBackwardsBtn.addEventListener('click', () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            const background = canvas.getObjects().find(obj => obj.isBackground);
            const fadeShadow = canvas.getObjects().find(obj => obj.isFadeShadow);
            const minIndex = (fadeShadow ? canvas.getObjects().indexOf(fadeShadow) : (background ? canvas.getObjects().indexOf(background) : -1)) + 1;
            
            canvas.moveTo(activeObject, Math.max(minIndex, canvas.getObjects().indexOf(activeObject) - 1));
            canvas.renderAll();
        }
    });

    // Selection & Edit Events
    canvas.on('selection:created', (e) => updateTextControls(e.selected[0]));
    canvas.on('selection:updated', (e) => updateTextControls(e.selected[0]));
    canvas.on('selection:cleared', () => {
        textControls.classList.add('hidden');
        selectedObject = null;
    });

    // Sync on-canvas editing with sidebar
    canvas.on('text:changed', (e) => {
        if (e.target === selectedObject) {
            // Force uppercase if desired, or just sync
            const newText = e.target.text.toUpperCase();
            if (e.target.text !== newText) {
                e.target.set('text', newText);
                canvas.renderAll();
            }
            textInput.value = e.target.text;
        }
    });

    function updateTextControls(obj) {
        if (!obj) return;
        
        if (obj.type === 'i-text' || obj.type === 'text') {
            selectedObject = obj;
            textControls.classList.remove('hidden');
            
            // Update inputs without triggering loops
            textInput.value = obj.text || '';
            fontSizeInput.value = obj.fontSize || 160;
            lineHeightInput.value = obj.lineHeight || 0.9;
            textColorInput.value = obj.fill || '#ffffff';
            fontFamilyInput.value = obj.fontFamily || 'Poppins';
            fontWeightInput.value = obj.fontWeight || '900';
            charSpacingInput.value = obj.charSpacing || -40;
            shadowBlurInput.value = obj.shadow ? obj.shadow.blur : 15;
            strokeWidthInput.value = obj.strokeWidth || 0;
            strokeColorInput.value = obj.stroke || '#000000';
        } else {
            textControls.classList.add('hidden');
            selectedObject = null;
        }
    }

    // Live Updates from Sidebar
    textInput.addEventListener('input', (e) => {
        if (selectedObject) {
            const start = textInput.selectionStart;
            const end = textInput.selectionEnd;
            const val = e.target.value.toUpperCase();
            
            textInput.value = val;
            textInput.setSelectionRange(start, end); // Keep cursor position
            
            selectedObject.set('text', val);
            canvas.renderAll();
        }
    });

    fontSizeInput.addEventListener('input', (e) => {
        if (selectedObject) {
            selectedObject.set('fontSize', parseInt(e.target.value) || 10);
            canvas.renderAll();
        }
    });

    lineHeightInput.addEventListener('input', (e) => {
        if (selectedObject) {
            selectedObject.set('lineHeight', parseFloat(e.target.value) || 1);
            canvas.renderAll();
        }
    });

    textColorInput.addEventListener('input', (e) => {
        if (selectedObject) {
            selectedObject.set('fill', e.target.value);
            canvas.renderAll();
        }
    });

    fontFamilyInput.addEventListener('change', (e) => {
        if (selectedObject) {
            selectedObject.set('fontFamily', e.target.value);
            canvas.renderAll();
        }
    });

    fontWeightInput.addEventListener('change', (e) => {
        if (selectedObject) {
            selectedObject.set('fontWeight', e.target.value);
            canvas.renderAll();
        }
    });

    charSpacingInput.addEventListener('input', (e) => {
        if (selectedObject) {
            selectedObject.set('charSpacing', parseInt(e.target.value) || 0);
            canvas.renderAll();
        }
    });

    shadowBlurInput.addEventListener('input', (e) => {
        if (selectedObject) {
            if (!selectedObject.shadow) {
                selectedObject.shadow = new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', offsetX: 5, offsetY: 5 });
            }
            selectedObject.shadow.blur = parseInt(e.target.value) || 0;
            canvas.renderAll();
        }
    });

    strokeWidthInput.addEventListener('input', (e) => {
        if (selectedObject) {
            selectedObject.set('strokeWidth', parseInt(e.target.value) || 0);
            canvas.renderAll();
        }
    });

    strokeColorInput.addEventListener('input', (e) => {
        if (selectedObject) {
            selectedObject.set('stroke', e.target.value);
            canvas.renderAll();
        }
    });

    canvasPreset.addEventListener('change', (e) => {
        const [width, height] = e.target.value.split('x').map(Number);
        canvas.setDimensions({ width, height });
        resizeCanvasDisplay();
        
        const background = canvas.getObjects().find(obj => obj.isBackground);
        if (background) {
            const scale = Math.max(canvas.width / background.width, canvas.height / background.height);
            background.scale(scale);
            background.center();
        }

        updateFadeShadow();
        canvas.renderAll();
    });

    downloadBtn.addEventListener('click', () => {
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
        });
        const link = document.createElement('a');
        link.download = `thumbnail-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your work?')) {
            canvas.clear();
            canvas.setBackgroundColor('#000000', canvas.renderAll.bind(canvas));
            textControls.classList.add('hidden');
            shadowEditControls.classList.add('hidden');
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeObject = canvas.getActiveObject();
            if (activeObject && !activeObject.isEditing) {
                canvas.remove(activeObject);
                canvas.discardActiveObject();
                canvas.renderAll();
            }
        }
    });
};
