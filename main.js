// Initialize Fabric Canvas
const canvas = new fabric.Canvas('main-canvas', {
    width: 1080,
    height: 1920,
    backgroundColor: '#000000',
    preserveObjectStacking: true
});

// UI Elements
const imageUpload = document.getElementById('image-upload');
const dropZone = document.getElementById('drop-zone');
const addTextBtn = document.getElementById('add-text');
const addHighlightBtn = document.getElementById('add-highlight-text');
const bringForwardBtn = document.getElementById('bring-forward');
const sendBackwardsBtn = document.getElementById('send-backwards');
const textControls = document.getElementById('text-edit-controls');
const textInput = document.getElementById('text-input');
const fontSizeInput = document.getElementById('font-size');
const textColorInput = document.getElementById('text-color');
const fontFamilyInput = document.getElementById('font-family');
const strokeWidthInput = document.getElementById('stroke-width');
const strokeColorInput = document.getElementById('stroke-color');
const canvasPreset = document.getElementById('canvas-preset');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');

// State
let selectedObject = null;

// Adjust canvas scale for display
function resizeCanvasDisplay() {
    const wrapper = document.querySelector('.canvas-wrapper');
    const containerWidth = wrapper.parentElement.clientWidth - 80;
    const containerHeight = wrapper.parentElement.clientHeight - 120;
    
    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    wrapper.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', resizeCanvasDisplay);
resizeCanvasDisplay();

// Background Image Upload
imageUpload.addEventListener('change', handleImageUpload);

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(f) {
        const data = f.target.result;
        fabric.Image.fromURL(data, function(img) {
            // Remove existing background
            const objects = canvas.getObjects('image');
            objects.forEach(obj => {
                if (obj.isBackground) canvas.remove(obj);
            });

            // Set as background
            img.set({
                originX: 'left',
                originY: 'top',
                isBackground: true
            });
            
            // Scale to fit canvas accurately
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            img.scale(scale);
            
            // Center background
            img.center();
            
            canvas.insertAt(img, 0);
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
}

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        imageUpload.files = files;
        handleImageUpload({ target: { files } });
    }
});

// Add Text
function createStyledText(content, color) {
    return new fabric.IText(content, {
        left: canvas.width / 2,
        top: canvas.height * 0.7,
        fontFamily: 'Montserrat',
        fontSize: 100,
        fill: color,
        fontWeight: '900',
        stroke: '#000000',
        strokeWidth: 0,
        originX: 'center',
        originY: 'center',
        cornerColor: '#3b82f6',
        cornerSize: 12,
        transparentCorners: false,
        textAlign: 'center',
        charSpacing: -20,
        lineHeight: 1,
        shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.5)',
            blur: 15,
            offsetX: 5,
            offsetY: 5
        })
    });
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
        // Move to bottom but keep above background
        const background = canvas.getObjects('image').find(obj => obj.isBackground);
        if (background) {
            const bgIndex = canvas.getObjects().indexOf(background);
            canvas.moveTo(activeObject, bgIndex + 1);
        } else {
            canvas.sendToBack(activeObject);
        }
        canvas.renderAll();
    }
});

// canvas selection events
canvas.on('selection:created', (e) => updateTextControls(e.selected[0]));
canvas.on('selection:updated', (e) => updateTextControls(e.selected[0]));
canvas.on('selection:cleared', () => {
    textControls.classList.add('hidden');
    selectedObject = null;
});

function updateTextControls(obj) {
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        selectedObject = obj;
        textControls.classList.remove('hidden');
        textInput.value = obj.text;
        fontSizeInput.value = obj.fontSize;
        textColorInput.value = obj.fill;
        fontFamilyInput.value = obj.fontFamily;
        strokeWidthInput.value = obj.strokeWidth;
        strokeColorInput.value = obj.stroke;
    } else {
        textControls.classList.add('hidden');
    }
}

// Live Updates
textInput.addEventListener('input', (e) => {
    if (selectedObject) {
        const val = e.target.value.toUpperCase();
        textInput.value = val;
        selectedObject.set('text', val);
        canvas.renderAll();
    }
});

fontSizeInput.addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.set('fontSize', parseInt(e.target.value));
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

strokeWidthInput.addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.set('strokeWidth', parseInt(e.target.value));
        canvas.renderAll();
    }
});

strokeColorInput.addEventListener('input', (e) => {
    if (selectedObject) {
        selectedObject.set('stroke', e.target.value);
        canvas.renderAll();
    }
});

// Canvas Preset
canvasPreset.addEventListener('change', (e) => {
    const [width, height] = e.target.value.split('x').map(Number);
    canvas.setDimensions({ width, height });
    resizeCanvasDisplay();
    canvas.renderAll();
});

// Download
downloadBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
    });
    const link = document.createElement('a');
    link.download = `thumbnail-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
});

// Reset
resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your work?')) {
        canvas.clear();
        canvas.setBackgroundColor('#000000', canvas.renderAll.bind(canvas));
        textControls.classList.add('hidden');
    }
});

// Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (canvas.getActiveObject() && !selectedObject.isEditing) {
            canvas.remove(canvas.getActiveObject());
            canvas.discardActiveObject();
            canvas.renderAll();
        }
    }
});
