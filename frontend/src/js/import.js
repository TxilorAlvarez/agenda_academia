// ========== IMPORTACION MASIVA ==========
async function renderImport() {
    content.innerHTML = '<h1 style="margin-bottom:1.5rem"><i class="fas fa-file-import" style="color:var(--primary)"></i> Importacion Masiva</h1>'

        // Seccion alumnos
        + '<div class="card"><div class="card-header">'
        + '<h2><i class="fas fa-user-graduate" style="color:var(--primary)"></i> Importar Alumnos desde CSV</h2></div>'
        + '<div class="card-body">'
        + '<div class="alert alert-info">'
        + '<strong>Formato del CSV:</strong> El archivo debe tener estas columnas (la primera fila son los encabezados):<br><br>'
        + '<code>full_name, document, phone, email, category, hours_completed, can_morning, can_afternoon, notes</code><br><br>'
        + '<strong>category:</strong> moto | carro_b1 | carro_c1<br>'
        + '<strong>hours_completed:</strong> numero de horas que ya lleva el alumno (0 si es nuevo)<br>'
        + '<strong>can_morning / can_afternoon:</strong> si | no<br>'
        + '<strong>email y notes:</strong> opcionales'
        + '</div>'
        + '<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">'
        + '<input type="file" id="csv-students" accept=".csv" style="flex:1">'
        + '<button class="btn btn-primary" onclick="uploadStudentsCSV()"><i class="fas fa-upload"></i> Cargar Alumnos</button>'
        + '</div>'
        + '<div id="import-students-result" style="margin-top:1rem"></div>'
        + '</div></div>'

        // Seccion instructores
        + '<div class="card"><div class="card-header">'
        + '<h2><i class="fas fa-user-tie" style="color:var(--primary)"></i> Importar Instructores desde CSV</h2></div>'
        + '<div class="card-body">'
        + '<div class="alert alert-info">'
        + '<strong>Formato del CSV:</strong><br><br>'
        + '<code>full_name, document, phone, vehicle_type, shift</code><br><br>'
        + '<strong>vehicle_type:</strong> moto | carro_b1 | carro_c1<br>'
        + '<strong>shift:</strong> manana | tarde'
        + '</div>'
        + '<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">'
        + '<input type="file" id="csv-instructors" accept=".csv" style="flex:1">'
        + '<button class="btn btn-primary" onclick="uploadInstructorsCSV()"><i class="fas fa-upload"></i> Cargar Instructores</button>'
        + '</div>'
        + '<div id="import-instructors-result" style="margin-top:1rem"></div>'
        + '</div></div>'

        // Plantillas descargables
        + '<div class="card"><div class="card-header">'
        + '<h2><i class="fas fa-download" style="color:var(--primary)"></i> Descargar Plantillas CSV</h2></div>'
        + '<div class="card-body" style="display:flex;gap:1rem;flex-wrap:wrap">'
        + '<button class="btn btn-primary" onclick="downloadTemplate(\'students\')"><i class="fas fa-download"></i> Plantilla Alumnos</button>'
        + '<button class="btn btn-primary" onclick="downloadTemplate(\'instructors\')"><i class="fas fa-download"></i> Plantilla Instructores</button>'
        + '</div></div>';
}

async function uploadStudentsCSV() {
    var fileInput = document.getElementById("csv-students");
    var resultDiv = document.getElementById("import-students-result");

    if (!fileInput.files || fileInput.files.length === 0) {
        resultDiv.innerHTML = '<div class="alert alert-danger">Selecciona un archivo CSV</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Importando...</div>';

    try {
        var result = await apiUploadCSV("/import/students", fileInput.files[0]);

        var html = '<div class="alert alert-success">'
            + '<strong>' + result.message + '</strong></div>';

        if (result.errors && result.errors.length > 0) {
            html += '<div class="alert alert-warning"><strong>Detalles:</strong><ul style="margin:0.5rem 0 0 1rem">';
            for (var i = 0; i < result.errors.length; i++) {
                html += '<li>' + result.errors[i] + '</li>';
            }
            html += '</ul></div>';
        }

        html += '<div style="display:flex;gap:1rem;margin-top:0.5rem">'
            + '<div class="stat-card" style="flex:1"><div class="stat-number" style="color:var(--success)">' + result.created + '</div><div class="stat-label">Creados</div></div>'
            + '<div class="stat-card" style="flex:1"><div class="stat-number" style="color:var(--warning)">' + result.skipped + '</div><div class="stat-label">Omitidos</div></div>'
            + '</div>';

        resultDiv.innerHTML = html;
    } catch (err) {
        resultDiv.innerHTML = '<div class="alert alert-danger"><strong>Error:</strong> ' + err.message + '</div>';
    }
}

async function uploadInstructorsCSV() {
    var fileInput = document.getElementById("csv-instructors");
    var resultDiv = document.getElementById("import-instructors-result");

    if (!fileInput.files || fileInput.files.length === 0) {
        resultDiv.innerHTML = '<div class="alert alert-danger">Selecciona un archivo CSV</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Importando...</div>';

    try {
        var result = await apiUploadCSV("/import/instructors", fileInput.files[0]);

        var html = '<div class="alert alert-success"><strong>' + result.message + '</strong></div>';

        if (result.errors && result.errors.length > 0) {
            html += '<div class="alert alert-warning"><strong>Detalles:</strong><ul style="margin:0.5rem 0 0 1rem">';
            for (var i = 0; i < result.errors.length; i++) {
                html += '<li>' + result.errors[i] + '</li>';
            }
            html += '</ul></div>';
        }

        html += '<div style="display:flex;gap:1rem;margin-top:0.5rem">'
            + '<div class="stat-card" style="flex:1"><div class="stat-number" style="color:var(--success)">' + result.created + '</div><div class="stat-label">Creados</div></div>'
            + '<div class="stat-card" style="flex:1"><div class="stat-number" style="color:var(--warning)">' + result.skipped + '</div><div class="stat-label">Omitidos</div></div>'
            + '</div>';

        resultDiv.innerHTML = html;
    } catch (err) {
        resultDiv.innerHTML = '<div class="alert alert-danger"><strong>Error:</strong> ' + err.message + '</div>';
    }
}

function downloadTemplate(type) {
    var content = "";
    var filename = "";

    if (type === "students") {
        content = "full_name,document,phone,email,category,hours_completed,can_morning,can_afternoon,notes\n"
            + "Juan Perez,1001234567,3101234567,juan@email.com,carro_b1,6,no,si,Trabaja de dia\n"
            + "Maria Garcia,1009876543,3209876543,,moto,0,si,si,\n";
        filename = "plantilla_alumnos.csv";
    } else {
        content = "full_name,document,phone,vehicle_type,shift\n"
            + "Roberto Diaz,8001234567,3001234567,carro_b1,manana\n"
            + "Oscar Vargas,8002225555,3002225555,moto,tarde\n";
        filename = "plantilla_instructores.csv";
    }

    var blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
