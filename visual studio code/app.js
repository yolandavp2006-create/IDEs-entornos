document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('csvFileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const validateBtn = document.getElementById('validateBtn');
    
    const resultsSection = document.getElementById('results');
    const validCountDisplay = document.getElementById('validCount');
    const invalidCountDisplay = document.getElementById('invalidCount');
    const totalCountDisplay = document.getElementById('totalCount');
    const invalidList = document.getElementById('invalidList');

    let currentFile = null;

    // Expresión regular para validar correos
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            currentFile = file;
            fileNameDisplay.textContent = `Archivo cargado: ${file.name}`;
            validateBtn.disabled = false;
        } else {
            currentFile = null;
            fileNameDisplay.textContent = 'Sin archivo seleccionado';
            validateBtn.disabled = true;
        }
    });

    validateBtn.addEventListener('click', () => {
        if (!currentFile) return;

        const reader = new FileReader();

        reader.onload = function(e) {
            const text = e.target.result;
            processData(text);
        };

        reader.readAsText(currentFile);
    });

    function processData(csvText) {
        // Separar por líneas
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        
        let validCount = 0;
        let invalidCount = 0;
        let invalidEmails = [];

        let emailIndex = -1;
        
        lines.forEach((line, index) => {
            // Dividir la línea por comas o punto y coma
            const columns = line.split(/[,;]/);

            if (index === 0) {
                // Encontrar en qué columna está el email (o asumir la última por defecto)
                emailIndex = columns.findIndex(col => col.toLowerCase().includes('email') || col.toLowerCase().includes('correo'));
                if (emailIndex === -1) emailIndex = columns.length - 1;
                return; // Saltamos la cabecera
            }
            
            let foundEmail = columns[emailIndex];
            
            // Limpiamos comillas y espacios en blanco
            if (foundEmail && foundEmail.trim() !== '') {
                foundEmail = foundEmail.replace(/["']/g, '').trim();
                
                if (emailRegex.test(foundEmail)) {
                    validCount++;
                } else {
                    invalidCount++;
                    invalidEmails.push({ email: foundEmail, row: index + 1 });
                }
            } else { 
                invalidCount++;
                invalidEmails.push({ email: 'Fila sin dirección de correo', row: index + 1 });
            }
        });

        // Restamos 1 al total porque omitimos la cabecera en el conteo final
        displayResults(validCount, invalidCount, lines.length - 1, invalidEmails);
    }

    function displayResults(valid, invalid, total, invalidEmails) {
        // Animar contadores
        validCountDisplay.textContent = valid;
        invalidCountDisplay.textContent = invalid;
        totalCountDisplay.textContent = valid + invalid;

        // Mostrar lista de inválidos
        invalidList.innerHTML = '';
        if (invalidEmails.length > 0) {
            invalidEmails.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span><strong style="color:var(--color-almagra)">Fila ${item.row}:</strong> ${item.email}</span>`;
                invalidList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "¡Todos los correos son válidos!";
            li.style.color = "var(--color-patio)";
            li.style.fontWeight = "bold";
            invalidList.appendChild(li);
        }

        // Mostrar sección con animación
        resultsSection.classList.remove('hidden');
        resultsSection.animate([
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], {
            duration: 500,
            fill: 'forwards'
        });
    }
});