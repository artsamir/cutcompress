// if (typeof pdfjsLib === 'undefined') {
//     console.error('PDF.js is not loaded. Please ensure the PDF.js script is included.');
// } else {
//     pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
// }
if (typeof pdfjsLib === 'undefined') {
    console.error('PDF.js is not loaded.');
} else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.js';
}

let pdfDoc = null;
let pageNum = 1;
let textOverlays = [];
let isAddingText = false;

const canvas = document.getElementById('pdf-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const dropZone = document.getElementById('drop-zone');
const addTextBtn = document.getElementById('add-text-btn');
const canvasContainer = document.getElementById('canvas-container');

// Drag and drop handling
if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-500');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            handleFile(file);
        }
    });

    dropZone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e) => handleFile(e.target.files[0]);
        input.click();
    });
}

async function handleFile(file) {
    if (!pdfjsLib) {
        alert('PDF.js is not available. Please reload the page.');
        return;
    }
    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
        addTextBtn.disabled = false;
        await renderPage(pageNum);
        await performOCR(arrayBuffer);
    } catch (error) {
        console.error('Error handling file:', error);
        alert('Failed to load PDF. Please try another file.');
    }
}

async function renderPage(num) {
    if (!ctx || !pdfDoc) return;
    try {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Clear previous overlays
        while (canvasContainer.querySelector('.text-overlay')) {
            canvasContainer.removeChild(canvasContainer.querySelector('.text-overlay'));
        }

        // Render PDF page
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        // Render text overlays
        textOverlays.forEach(overlay => {
            const div = document.createElement('div');
            div.className = 'text-overlay';
            div.style.left = `${overlay.x}px`;
            div.style.top = `${overlay.y}px`;
            div.style.width = `${overlay.width}px`;
            div.style.height = `${overlay.height}px`;
            div.addEventListener('click', () => {
                div.remove();
                textOverlays = textOverlays.filter(o => o !== overlay);
            });
            canvasContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Error rendering page:', error);
    }
}

async function performOCR(arrayBuffer) {
    if (!pdfDoc) return;
    try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        textOverlays = [];

        if (textContent.items.length === 0 && typeof Tesseract !== 'undefined') { // Likely image-based PDF
            const viewport = page.getViewport({ scale: 1.5 });
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = viewport.width;
            tempCanvas.height = viewport.height;
            await page.render({
                canvasContext: tempCanvas.getContext('2d'),
                viewport: viewport
            }).promise;

            const { data } = await Tesseract.recognize(tempCanvas.toDataURL(), 'eng', {
                logger: (m) => console.log(m)
            });

            data.words.forEach(word => {
                textOverlays.push({
                    x: word.bbox.x0 * 1.5,
                    y: word.bbox.y0 * 1.5,
                    width: (word.bbox.x1 - word.bbox.x0) * 1.5,
                    height: (word.bbox.y1 - word.bbox.y0) * 1.5
                });
            });
        } else {
            textContent.items.forEach(item => {
                const transform = item.transform;
                textOverlays.push({
                    x: transform[4] * 1.5,
                    y: (canvas.height - transform[5] - item.height) * 1.5,
                    width: item.width * 1.5,
                    height: item.height * 1.5
                });
            });
        }
        await renderPage(pageNum);
    } catch (error) {
        console.error('Error performing OCR:', error);
    }
}

// Add new text
if (addTextBtn) {
    addTextBtn.addEventListener('click', () => {
        isAddingText = true;
        canvas.style.cursor = 'crosshair';
    });
}

if (canvas) {
    canvas.addEventListener('click', (e) => {
        if (!isAddingText) return;
        isAddingText = false;
        canvas.style.cursor = 'default';

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const textDiv = document.createElement('div');
        textDiv.className = 'new-text text-overlay';
        textDiv.style.left = `${x}px`;
        textDiv.style.top = `${y}px`;
        textDiv.contentEditable = true;
        textDiv.innerText = 'Type here';
        textDiv.style.width = '200px';
        textDiv.style.height = '30px';
        canvasContainer.appendChild(textDiv);
        textDiv.focus();

        textDiv.addEventListener('click', (e) => {
            if (!textDiv.isContentEditable) {
                textDiv.remove();
            }
            e.stopPropagation();
        });

        textDiv.addEventListener('blur', () => {
            textDiv.contentEditable = false;
            if (!textDiv.innerText.trim()) {
                textDiv.remove();
            }
        });
    });
}