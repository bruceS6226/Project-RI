document.getElementById('searchForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Previene que el formulario se envíe de la forma tradicional

    const query = document.getElementById('query').value;

    // Configura los datos para el cuerpo de la petición
    const data = {
        query: query
    };

    // Realiza la petición POST a la API
    fetch('http://127.0.0.1:5000/api/v1/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            // Procesa y muestra los resultados en la tabla con id "resultsTable"
            const resultsTable = document.getElementById('resultsTable');
            resultsTable.innerHTML = ''; // Limpia la tabla antes de agregar nuevos resultados
            if (data && data.results && data.results.length > 0) {
                const thead = document.createElement('thead');
                thead.className = 'table-dark';
                thead.innerHTML = `
                <tr>
                    <th>Ranking</th>
                    <th>Nombre del archivo</th>
                    <th></th>
                </tr>
            `;
                resultsTable.appendChild(thead);
                // Crear el cuerpo de la tabla y agregar filas
                const tbody = document.createElement('tbody');
                tbody.id = 'resultsTableBody'; // Asignar ID al cuerpo de la tabla
                let contadorResults = 1;
                data.results.forEach(result => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td>${contadorResults}</td>
                    <td>${result}</td>
                <td class="text-center"><button class="w-100 btn btn-warning text-center" onclick="text(${result})">Abrir  <i class="fas fa-chevron-down ms-1"></i></button></td>
                `;
                    contadorResults += 1;
                    tbody.appendChild(row);
                });

                resultsTable.appendChild(tbody);
            }
            else {
                // Mostrar un mensaje de alerta informativa si no hay datos
                let alertDiv = document.createElement('div');
                alertDiv.classList.add('alert', 'alert-info', 'alert-dismissible', 'fade', 'show');
                alertDiv.setAttribute('role', 'alert');
                alertDiv.innerHTML = `
                    Actualmente no hemos encontrado resultados para su búsqueda. Estamos trabajando constantemente para mejorar nuestro servicio y ampliar nuestras capacidades de búsqueda.<br><br>¡Gracias por su paciencia y comprensión!
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                // Limpiar contenido anterior y agregar el alerta al contenedor deseado
                let fileContent = document.getElementById('resultsTable');
                fileContent.innerHTML = '';
                fileContent.appendChild(alertDiv);

                // Mostrar el alerta (Bootstrap 5 requiere la inicialización del alerta)
                let bootstrapAlert = new bootstrap.Alert(alertDiv);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

function text(name) {
    fetch('data/reuters/training/' + name)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            // Crear el toast de Bootstrap
            let toastDiv = document.createElement('div');
            toastDiv.classList.add('toast', 'align-items-center', 'show');
            toastDiv.setAttribute('role', 'alert');
            toastDiv.setAttribute('aria-live', 'assertive');
            toastDiv.setAttribute('aria-atomic', 'true');
            
            toastDiv.innerHTML = `
                <div class="toast-header">
                    <strong class="me-auto">NOTICE</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close" onclick="returnOpacity()"></button>
                </div>
                <div class="toast-body">
                    ${data}
                </div>
            `;

            // Agregar el toast al contenedor de toasts
            let toastContainer = document.getElementById('toastContainer');
            toastContainer.appendChild(toastDiv);

            // Inicializar y mostrar el toast (Bootstrap 5)
            let toast = new bootstrap.Toast(toastDiv, {
                autohide: false
            });
            toast.show();
            
            let body = document.getElementById('body');
            body.style.opacity = "0.1";
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function returnOpacity() {
    let body = document.getElementById('body');
    body.style.opacity = "1";
}