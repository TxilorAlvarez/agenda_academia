const content = document.getElementById("app-content");

function setActiveNav(page) {
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    const links = document.querySelectorAll(".nav-link");
    const map = { dashboard: 0, instructors: 1, students: 2, vehicles: 3, bookings: 4, availability: 5, import: 6 };
    if (links[map[page]]) links[map[page]].classList.add("active");
}

function showAlert(msg, type = "success") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = msg;
    content.prepend(alert);
    setTimeout(() => alert.remove(), 4000);
}

function openModal(html) {
    document.getElementById("modal-content").innerHTML = html;
    document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
}

document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
});

async function loadPage(page) {
    setActiveNav(page);
    content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    try {
        switch (page) {
            case "dashboard": await renderDashboard(); break;
            case "instructors": await renderInstructors(); break;
            case "students": await renderStudents(); break;
            case "vehicles": await renderVehicles(); break;
            case "bookings": await renderBookings(); break;
            case "availability": await renderAvailability(); break;
            case "import": await renderImport(); break;
        }
    } catch (err) {
        content.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    }
}

// ========== DASHBOARD ==========
async function renderDashboard() {
    const stats = await apiGet("/stats");
    content.innerHTML = '<h1 style="margin-bottom:1.5rem;color:var(--dark)"><i class="fas fa-chart-bar" style="color:var(--primary)"></i> Dashboard</h1>'
        + '<div class="stats-grid">'
        + '<div class="stat-card"><div class="stat-number">' + stats.instructors_active + '</div><div class="stat-label">Instructores Activos</div></div>'
        + '<div class="stat-card"><div class="stat-number">' + stats.students_active + '</div><div class="stat-label">Alumnos Activos</div></div>'
        + '<div class="stat-card"><div class="stat-number">' + stats.vehicles_active + '</div><div class="stat-label">Vehiculos Activos</div></div>'
        + '<div class="stat-card"><div class="stat-number">' + stats.bookings_pending + '</div><div class="stat-label">Reservas Pendientes</div></div>'
        + '<div class="stat-card"><div class="stat-number">' + stats.bookings_completed + '</div><div class="stat-label">Clases Completadas</div></div>'
        + '<div class="stat-card"><div class="stat-number">' + stats.bookings_total + '</div><div class="stat-label">Reservas Totales</div></div>'
        + '</div>'
        + '<div class="card"><div class="card-header"><h2><i class="fas fa-tasks" style="color:var(--primary)"></i> Progreso de Alumnos Activos</h2></div>'
        + '<div class="card-body" id="progress-container">Cargando...</div></div>';

    try {
        var progress = await apiGet("/students/progress");
        var container = document.getElementById("progress-container");
        if (progress.length === 0) {
            container.innerHTML = '<p style="color:#6b7280;padding:1rem">No hay alumnos activos</p>';
            return;
        }
        var rows = "";
        for (var i = 0; i < progress.length; i++) {
            var s = progress[i];
            var catLabel = window.APP_CONFIG.CATEGORY_LABELS[s.category] || s.category;
            rows += '<tr>'
                + '<td><strong>' + s.full_name + '</strong></td>'
                + '<td><span class="badge badge-info">' + catLabel + '</span></td>'
                + '<td><div class="progress-bar"><div class="progress-fill" style="width:' + s.progress_percent + '%"></div></div>'
                + '<div class="progress-text">' + s.progress_percent + '%</div></td>'
                + '<td>' + s.hours_completed + '/' + s.total_hours_required + '</td>'
                + '<td><strong>' + s.hours_remaining + 'h</strong></td>'
                + '</tr>';
        }
        container.innerHTML = '<table><thead><tr><th>Alumno</th><th>Categoria</th><th>Progreso</th><th>Horas</th><th>Restantes</th></tr></thead><tbody>' + rows + '</tbody></table>';
    } catch (e) {
        document.getElementById("progress-container").innerHTML = '<p class="alert alert-danger">' + e.message + '</p>';
    }
}

// ========== INSTRUCTORES ==========
async function renderInstructors() {
    var data = await apiGet("/instructors/");
    var CL = window.APP_CONFIG.CATEGORY_LABELS;
    var SL = window.APP_CONFIG.SHIFT_LABELS;
    var rows = "";
    for (var i = 0; i < data.length; i++) {
        var inst = data[i];
        var jsonStr = JSON.stringify(inst).replace(/'/g, "&#39;");
        rows += '<tr>'
            + '<td><strong>' + inst.full_name + '</strong></td>'
            + '<td>' + inst.document + '</td>'
            + '<td>' + (inst.phone || "-") + '</td>'
            + '<td><span class="badge badge-info">' + (CL[inst.vehicle_type] || inst.vehicle_type) + '</span></td>'
            + '<td>' + (SL[inst.shift] || inst.shift) + '</td>'
            + '<td><span class="badge ' + (inst.is_active ? "badge-success" : "badge-danger") + '">' + (inst.is_active ? "Activo" : "Inactivo") + '</span></td>'
            + '<td>'
            + '<button class="btn btn-warning btn-sm" onclick=\'openInstructorForm(' + jsonStr + ')\'><i class="fas fa-edit"></i></button> '
            + '<button class="btn btn-danger btn-sm" onclick="deleteInstructor(' + inst.id + ')"><i class="fas fa-trash"></i></button>'
            + '</td></tr>';
    }
    content.innerHTML = '<div class="card"><div class="card-header">'
        + '<h2><i class="fas fa-user-tie" style="color:var(--primary)"></i> Instructores (' + data.length + ')</h2>'
        + '<button class="btn btn-primary" onclick="openInstructorForm()"><i class="fas fa-plus"></i> Agregar</button>'
        + '</div><div class="card-body"><table>'
        + '<thead><tr><th>Nombre</th><th>Documento</th><th>Telefono</th><th>Tipo</th><th>Turno</th><th>Estado</th><th>Acciones</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div></div>';
}

function openInstructorForm(data) {
    var e = data != null;
    var html = '<h2>' + (e ? "Editar" : "Nuevo") + ' Instructor</h2>'
        + '<form onsubmit="saveInstructor(event, ' + (e ? data.id : "null") + ')">'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Nombre completo</label><input id="f-name" required value="' + (e ? data.full_name : "") + '"></div>'
        + '<div class="form-group"><label>Documento</label><input id="f-doc" required value="' + (e ? data.document : "") + '" ' + (e ? "readonly" : "") + '></div>'
        + '</div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Telefono</label><input id="f-phone" value="' + (e ? (data.phone || "") : "") + '"></div>'
        + '<div class="form-group"><label>Tipo vehiculo</label><select id="f-type">'
        + '<option value="moto" ' + (e && data.vehicle_type === "moto" ? "selected" : "") + '>Moto</option>'
        + '<option value="carro_b1" ' + (e && data.vehicle_type === "carro_b1" ? "selected" : "") + '>Carro B1</option>'
        + '<option value="carro_c1" ' + (e && data.vehicle_type === "carro_c1" ? "selected" : "") + '>Carro C1</option>'
        + '</select></div></div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Turno</label><select id="f-shift">'
        + '<option value="manana" ' + (e && data.shift === "manana" ? "selected" : "") + '>Manana (6am-2pm)</option>'
        + '<option value="tarde" ' + (e && data.shift === "tarde" ? "selected" : "") + '>Tarde (2pm-10pm)</option>'
        + '</select></div>'
        + '<div class="form-group"><label>Estado</label><select id="f-active">'
        + '<option value="true" ' + (!e || data.is_active ? "selected" : "") + '>Activo</option>'
        + '<option value="false" ' + (e && !data.is_active ? "selected" : "") + '>Inactivo</option>'
        + '</select></div></div>'
        + '<div style="display:flex;gap:0.5rem;margin-top:1rem">'
        + '<button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar</button>'
        + '<button type="button" class="btn btn-danger" onclick="closeModal()">Cancelar</button>'
        + '</div></form>';
    openModal(html);
}

async function saveInstructor(ev, id) {
    ev.preventDefault();
    var p = {
        full_name: document.getElementById("f-name").value,
        document: document.getElementById("f-doc").value,
        phone: document.getElementById("f-phone").value,
        vehicle_type: document.getElementById("f-type").value,
        shift: document.getElementById("f-shift").value,
        is_active: document.getElementById("f-active").value === "true"
    };
    try {
        if (id) await apiPut("/instructors/" + id, p);
        else await apiPost("/instructors/", p);
        closeModal();
        await renderInstructors();
        showAlert(id ? "Instructor actualizado" : "Instructor creado");
    } catch (err) { alert(err.message); }
}

async function deleteInstructor(id) {
    if (!confirm("Eliminar este instructor?")) return;
    try {
        await apiDelete("/instructors/" + id);
        await renderInstructors();
        showAlert("Instructor eliminado");
    } catch (err) { alert(err.message); }
}

// ========== ALUMNOS ==========
async function renderStudents() {
    var data = await apiGet("/students/");
    var CL = window.APP_CONFIG.CATEGORY_LABELS;
    var rows = "";
    for (var i = 0; i < data.length; i++) {
        var s = data[i];
        var pct = s.total_hours_required > 0 ? Math.round(s.hours_completed / s.total_hours_required * 100) : 0;
        var sb = { activo: "badge-success", completado: "badge-info", retirado: "badge-danger", pendiente: "badge-warning" };
        var jsonStr = JSON.stringify(s).replace(/'/g, "&#39;");
        rows += '<tr>'
            + '<td><strong>' + s.full_name + '</strong></td>'
            + '<td>' + s.document + '</td>'
            + '<td>' + s.phone + '</td>'
            + '<td><span class="badge badge-info">' + (CL[s.category] || s.category) + '</span></td>'
            + '<td><div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>'
            + '<div class="progress-text">' + s.hours_completed + '/' + s.total_hours_required + ' (' + pct + '%)</div></td>'
            + '<td><span class="badge ' + (sb[s.status] || "badge-gray") + '">' + s.status + '</span></td>'
            + '<td>'
            + '<button class="btn btn-warning btn-sm" onclick=\'openStudentForm(' + jsonStr + ')\'><i class="fas fa-edit"></i></button> '
            + '<button class="btn btn-danger btn-sm" onclick="deleteStudent(' + s.id + ')"><i class="fas fa-trash"></i></button>'
            + '</td></tr>';
    }
    content.innerHTML = '<div class="card"><div class="card-header">'
        + '<h2><i class="fas fa-user-graduate" style="color:var(--primary)"></i> Alumnos (' + data.length + ')</h2>'
        + '<button class="btn btn-primary" onclick="openStudentForm()"><i class="fas fa-plus"></i> Agregar</button>'
        + '</div><div class="card-body"><table>'
        + '<thead><tr><th>Nombre</th><th>Documento</th><th>Telefono</th><th>Categoria</th><th>Progreso</th><th>Estado</th><th>Acciones</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div></div>';
}

function openStudentForm(data) {
    var e = data != null;
    var html = '<h2>' + (e ? "Editar" : "Nuevo") + ' Alumno</h2>'
        + '<form onsubmit="saveStudent(event, ' + (e ? data.id : "null") + ')">'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Nombre completo</label><input id="f-name" required value="' + (e ? data.full_name : "") + '"></div>'
        + '<div class="form-group"><label>Documento</label><input id="f-doc" required value="' + (e ? data.document : "") + '" ' + (e ? "readonly" : "") + '></div>'
        + '</div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Telefono</label><input id="f-phone" required value="' + (e ? data.phone : "") + '"></div>'
        + '<div class="form-group"><label>Email</label><input id="f-email" type="email" value="' + (e ? (data.email || "") : "") + '"></div>'
        + '</div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Categoria</label><select id="f-cat" ' + (e ? "disabled" : "") + '>'
        + '<option value="moto" ' + (e && data.category === "moto" ? "selected" : "") + '>Moto (15h)</option>'
        + '<option value="carro_b1" ' + (e && data.category === "carro_b1" ? "selected" : "") + '>Carro B1 (20h)</option>'
        + '<option value="carro_c1" ' + (e && data.category === "carro_c1" ? "selected" : "") + '>Carro C1 (30h)</option>'
        + '</select></div>'
        + '<div class="form-group"><label>Estado</label><select id="f-status">'
        + '<option value="activo" ' + (!e || data.status === "activo" ? "selected" : "") + '>Activo</option>'
        + '<option value="pendiente" ' + (e && data.status === "pendiente" ? "selected" : "") + '>Pendiente</option>'
        + '<option value="completado" ' + (e && data.status === "completado" ? "selected" : "") + '>Completado</option>'
        + '<option value="retirado" ' + (e && data.status === "retirado" ? "selected" : "") + '>Retirado</option>'
        + '</select></div></div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label><input type="checkbox" id="f-morning" ' + (e && data.can_morning ? "checked" : "") + '> Puede en la manana</label></div>'
        + '<div class="form-group"><label><input type="checkbox" id="f-afternoon" ' + (e && data.can_afternoon ? "checked" : "") + '> Puede en la tarde/noche</label></div>'
        + '</div>'
        + '<div class="form-group"><label>Notas</label><textarea id="f-notes" rows="2">' + (e ? (data.notes || "") : "") + '</textarea></div>'
        + '<div style="display:flex;gap:0.5rem;margin-top:1rem">'
        + '<button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar</button>'
        + '<button type="button" class="btn btn-danger" onclick="closeModal()">Cancelar</button>'
        + '</div></form>';
    openModal(html);
}

async function saveStudent(ev, id) {
    ev.preventDefault();
    var p = {
        full_name: document.getElementById("f-name").value,
        document: document.getElementById("f-doc").value,
        phone: document.getElementById("f-phone").value,
        email: document.getElementById("f-email").value || null,
        category: document.getElementById("f-cat").value,
        can_morning: document.getElementById("f-morning").checked,
        can_afternoon: document.getElementById("f-afternoon").checked,
        notes: document.getElementById("f-notes").value || null
    };
    if (id) p.status = document.getElementById("f-status").value;
    try {
        if (id) await apiPut("/students/" + id, p);
        else await apiPost("/students/", p);
        closeModal();
        await renderStudents();
        showAlert(id ? "Alumno actualizado" : "Alumno registrado");
    } catch (err) { alert(err.message); }
}

async function deleteStudent(id) {
    if (!confirm("Eliminar este alumno?")) return;
    try {
        await apiDelete("/students/" + id);
        await renderStudents();
        showAlert("Alumno eliminado");
    } catch (err) { alert(err.message); }
}

// ========== VEHICULOS ==========
async function renderVehicles() {
    var data = await apiGet("/vehicles/");
    var CL = window.APP_CONFIG.CATEGORY_LABELS;
    var rows = "";
    for (var i = 0; i < data.length; i++) {
        var v = data[i];
        var jsonStr = JSON.stringify(v).replace(/'/g, "&#39;");
        rows += '<tr>'
            + '<td><strong>' + v.plate + '</strong></td>'
            + '<td><span class="badge badge-info">' + (CL[v.vehicle_type] || v.vehicle_type) + '</span></td>'
            + '<td>' + (v.brand || "-") + '</td>'
            + '<td>' + (v.model || "-") + '</td>'
            + '<td>' + (v.year || "-") + '</td>'
            + '<td><span class="badge ' + (v.is_active ? "badge-success" : "badge-danger") + '">' + (v.is_active ? "Activo" : "Inactivo") + '</span></td>'
            + '<td>'
            + '<button class="btn btn-warning btn-sm" onclick=\'openVehicleForm(' + jsonStr + ')\'><i class="fas fa-edit"></i></button> '
            + '<button class="btn btn-danger btn-sm" onclick="deleteVehicle(' + v.id + ')"><i class="fas fa-trash"></i></button>'
            + '</td></tr>';
    }
    content.innerHTML = '<div class="card"><div class="card-header">'
        + '<h2><i class="fas fa-motorcycle" style="color:var(--primary)"></i> Vehiculos (' + data.length + ')</h2>'
        + '<button class="btn btn-primary" onclick="openVehicleForm()"><i class="fas fa-plus"></i> Agregar</button>'
        + '</div><div class="card-body"><table>'
        + '<thead><tr><th>Placa</th><th>Tipo</th><th>Marca</th><th>Modelo</th><th>Ano</th><th>Estado</th><th>Acciones</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div></div>';
}

function openVehicleForm(data) {
    var e = data != null;
    var html = '<h2>' + (e ? "Editar" : "Nuevo") + ' Vehiculo</h2>'
        + '<form onsubmit="saveVehicle(event, ' + (e ? data.id : "null") + ')">'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Placa</label><input id="f-plate" required value="' + (e ? data.plate : "") + '"></div>'
        + '<div class="form-group"><label>Tipo</label><select id="f-type">'
        + '<option value="moto" ' + (e && data.vehicle_type === "moto" ? "selected" : "") + '>Moto</option>'
        + '<option value="carro_b1" ' + (e && data.vehicle_type === "carro_b1" ? "selected" : "") + '>Carro B1</option>'
        + '<option value="carro_c1" ' + (e && data.vehicle_type === "carro_c1" ? "selected" : "") + '>Carro C1</option>'
        + '</select></div></div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Marca</label><input id="f-brand" value="' + (e ? (data.brand || "") : "") + '"></div>'
        + '<div class="form-group"><label>Modelo</label><input id="f-model" value="' + (e ? (data.model || "") : "") + '"></div>'
        + '</div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Ano</label><input id="f-year" type="number" value="' + (e ? (data.year || "") : "") + '"></div>'
        + '<div class="form-group"><label>Estado</label><select id="f-active">'
        + '<option value="true" ' + (!e || data.is_active ? "selected" : "") + '>Activo</option>'
        + '<option value="false" ' + (e && !data.is_active ? "selected" : "") + '>Inactivo</option>'
        + '</select></div></div>'
        + '<div style="display:flex;gap:0.5rem;margin-top:1rem">'
        + '<button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar</button>'
        + '<button type="button" class="btn btn-danger" onclick="closeModal()">Cancelar</button>'
        + '</div></form>';
    openModal(html);
}

async function saveVehicle(ev, id) {
    ev.preventDefault();
    var p = {
        plate: document.getElementById("f-plate").value,
        vehicle_type: document.getElementById("f-type").value,
        brand: document.getElementById("f-brand").value || null,
        model: document.getElementById("f-model").value || null,
        year: document.getElementById("f-year").value ? parseInt(document.getElementById("f-year").value) : null,
        is_active: document.getElementById("f-active").value === "true"
    };
    try {
        if (id) await apiPut("/vehicles/" + id, p);
        else await apiPost("/vehicles/", p);
        closeModal();
        await renderVehicles();
        showAlert(id ? "Vehiculo actualizado" : "Vehiculo creado");
    } catch (err) { alert(err.message); }
}

async function deleteVehicle(id) {
    if (!confirm("Eliminar este vehiculo?")) return;
    try {
        await apiDelete("/vehicles/" + id);
        await renderVehicles();
        showAlert("Vehiculo eliminado");
    } catch (err) { alert(err.message); }
}

// ========== RESERVAS ==========
async function renderBookings() {
    var today = new Date().toISOString().split("T")[0];
    var data = await apiGet("/bookings/?date_from=" + today);
    var rows = "";
    var sb = { reservada: "badge-warning", completada: "badge-success", cancelada: "badge-danger", no_asistio: "badge-gray", en_espera: "badge-info" };
    for (var i = 0; i < data.length; i++) {
        var b = data[i];
        var actions = "";
        if (b.status === "reservada") {
            actions = '<button class="btn btn-success btn-sm" onclick="completeBooking(' + b.id + ')" title="Completar"><i class="fas fa-check"></i></button> '
                + '<button class="btn btn-danger btn-sm" onclick="cancelBooking(' + b.id + ')" title="Cancelar"><i class="fas fa-times"></i></button> '
                + '<button class="btn btn-warning btn-sm" onclick="noShowBooking(' + b.id + ')" title="No asistio"><i class="fas fa-user-slash"></i></button>';
        }
        rows += '<tr>'
            + '<td>' + b.date + '</td>'
            + '<td><strong>' + b.start_time + ' - ' + b.end_time + '</strong></td>'
            + '<td><strong>' + (b.student_name || "ID:" + b.student_id) + '</strong></td>'
            + '<td>' + (b.instructor_name || "ID:" + b.instructor_id) + '</td>'
            + '<td><span class="badge ' + (b.booking_type === "examen" ? "badge-danger" : "badge-info") + '">' + (b.booking_type === "examen" ? "EXAMEN" : "Practica 2h") + '</span></td>'
            + '<td>' + (b.hour_number || "-") + '</td>'
            + '<td><span class="badge ' + (sb[b.status] || "badge-gray") + '">' + b.status + '</span></td>'
            + '<td>' + actions + '</td>'
            + '</tr>';
    }
    content.innerHTML = '<div class="card"><div class="card-header">'
        + '<h2><i class="fas fa-calendar-check" style="color:var(--primary)"></i> Reservas (' + data.length + ')</h2>'
        + '<button class="btn btn-primary" onclick="openBookingForm()"><i class="fas fa-plus"></i> Nueva Reserva</button>'
        + '</div><div class="card-body"><table>'
        + '<thead><tr><th>Fecha</th><th>Horario</th><th>Alumno</th><th>Instructor</th><th>Tipo</th><th>Hora #</th><th>Estado</th><th>Acciones</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div></div>';
}

async function openBookingForm() {
    var students = await apiGet("/students/?status=activo");
    var instructors = await apiGet("/instructors/?active_only=true");
    var today = new Date().toISOString().split("T")[0];

    var studentOpts = '<option value="">Seleccionar alumno...</option>';
    for (var i = 0; i < students.length; i++) {
        var s = students[i];
        studentOpts += '<option value="' + s.id + '">' + s.full_name + ' (' + s.category + ' - ' + s.hours_completed + '/' + s.total_hours_required + 'h)</option>';
    }

    var instructorOpts = '<option value="">Seleccionar instructor...</option>';
    for (var j = 0; j < instructors.length; j++) {
        var inst = instructors[j];
        instructorOpts += '<option value="' + inst.id + '">' + inst.full_name + ' (' + inst.vehicle_type + ' - ' + inst.shift + ')</option>';
    }

    var html = '<h2><i class="fas fa-calendar-plus" style="color:var(--primary)"></i> Nueva Reserva</h2>'
        + '<form onsubmit="saveBooking(event)">'
        + '<div class="form-group"><label>Alumno</label><select id="f-student" required>' + studentOpts + '</select></div>'
        + '<div class="form-group"><label>Instructor</label><select id="f-instructor" required>' + instructorOpts + '</select></div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Fecha</label><input id="f-date" type="date" required min="' + today + '" value="' + today + '"></div>'
        + '<div class="form-group"><label>Tipo de clase</label><select id="f-btype" onchange="updateTimeSlots()">'
        + '<option value="practica">Practica (2 horas)</option>'
        + '<option value="examen">Examen (1 hora)</option>'
        + '</select></div></div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Hora inicio</label><select id="f-start" onchange="updateEndTime()"></select></div>'
        + '<div class="form-group"><label>Hora fin (automatica)</label><input id="f-end" readonly style="background:#f3f4f6;font-weight:700"></div>'
        + '</div>'
        + '<div class="form-group"><label>Notas</label><textarea id="f-notes" rows="2"></textarea></div>'
        + '<div style="display:flex;gap:0.5rem;margin-top:1rem">'
        + '<button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Reservar</button>'
        + '<button type="button" class="btn btn-danger" onclick="closeModal()">Cancelar</button>'
        + '</div></form>';
    openModal(html);
    updateTimeSlots();
}

function updateTimeSlots() {
    var type = document.getElementById("f-btype").value;
    var sel = document.getElementById("f-start");
    var opts = [];

    if (type === "practica") {
        // Bloques de 2 horas
        opts = [
            { v: "06:00:00", l: "06:00 - 08:00" },
            { v: "08:00:00", l: "08:00 - 10:00" },
            { v: "10:00:00", l: "10:00 - 12:00" },
            { v: "12:00:00", l: "12:00 - 14:00" },
            { v: "14:00:00", l: "14:00 - 16:00" },
            { v: "16:00:00", l: "16:00 - 18:00" },
            { v: "18:00:00", l: "18:00 - 20:00" },
            { v: "20:00:00", l: "20:00 - 22:00" }
        ];
    } else {
        // Bloques de 1 hora para examen
        opts = [
            { v: "06:00:00", l: "06:00" }, { v: "07:00:00", l: "07:00" },
            { v: "08:00:00", l: "08:00" }, { v: "09:00:00", l: "09:00" },
            { v: "10:00:00", l: "10:00" }, { v: "11:00:00", l: "11:00" },
            { v: "12:00:00", l: "12:00" }, { v: "13:00:00", l: "13:00" },
            { v: "14:00:00", l: "14:00" }, { v: "15:00:00", l: "15:00" },
            { v: "16:00:00", l: "16:00" }, { v: "17:00:00", l: "17:00" },
            { v: "18:00:00", l: "18:00" }, { v: "19:00:00", l: "19:00" },
            { v: "20:00:00", l: "20:00" }, { v: "21:00:00", l: "21:00" }
        ];
    }

    var optHtml = "";
    for (var i = 0; i < opts.length; i++) {
        optHtml += '<option value="' + opts[i].v + '">' + opts[i].l + '</option>';
    }
    sel.innerHTML = optHtml;
    updateEndTime();
}

function updateEndTime() {
    var type = document.getElementById("f-btype").value;
    var start = document.getElementById("f-start").value;
    var h = parseInt(start.split(":")[0]);
    var endH = type === "practica" ? h + 2 : h + 1;
    var endStr = String(endH).padStart(2, "0") + ":00:00";
    document.getElementById("f-end").value = String(endH).padStart(2, "0") + ":00";
}

async function saveBooking(ev) {
    ev.preventDefault();
    var type = document.getElementById("f-btype").value;
    var startVal = document.getElementById("f-start").value;
    var h = parseInt(startVal.split(":")[0]);
    var endH = type === "practica" ? h + 2 : h + 1;
    var endTime = String(endH).padStart(2, "0") + ":00:00";

    var p = {
        student_id: parseInt(document.getElementById("f-student").value),
        instructor_id: parseInt(document.getElementById("f-instructor").value),
        date: document.getElementById("f-date").value,
        start_time: startVal,
        end_time: endTime,
        booking_type: type,
        notes: document.getElementById("f-notes").value || null
    };
    try {
        await apiPost("/bookings/", p);
        closeModal();
        await renderBookings();
        showAlert("Reserva creada exitosamente");
    } catch (err) { alert(err.message); }
}

async function completeBooking(id) {
    if (!confirm("Marcar esta clase como completada? Se sumaran las horas al alumno.")) return;
    try {
        var result = await apiPut("/bookings/" + id + "/complete", {});
        await renderBookings();
        showAlert("Clase completada - Horas: " + result.hours_completed + "/" + result.total_required);
    } catch (err) { alert(err.message); }
}

async function cancelBooking(id) {
    if (!confirm("Cancelar esta reserva?")) return;
    try {
        await apiPut("/bookings/" + id + "/cancel", {});
        await renderBookings();
        showAlert("Reserva cancelada");
    } catch (err) { alert(err.message); }
}

async function noShowBooking(id) {
    if (!confirm("Marcar que el alumno no asistio?")) return;
    try {
        await apiPut("/bookings/" + id + "/no-show", {});
        await renderBookings();
        showAlert("Marcado como no asistio");
    } catch (err) { alert(err.message); }
}

// ========== DISPONIBILIDAD ==========
async function renderAvailability() {
    var today = new Date().toISOString().split("T")[0];
    content.innerHTML = '<div class="card"><div class="card-header">'
        + '<h2><i class="fas fa-clock" style="color:var(--primary)"></i> Disponibilidad por Fecha</h2>'
        + '<div style="display:flex;gap:0.5rem;align-items:center">'
        + '<input type="date" id="av-date" value="' + today + '" onchange="loadSlots()" style="padding:0.4rem;border:2px solid var(--border);border-radius:6px">'
        + '<select id="av-type" onchange="loadSlots()" style="padding:0.4rem;border:2px solid var(--border);border-radius:6px">'
        + '<option value="">Todos los tipos</option>'
        + '<option value="moto">Moto</option>'
        + '<option value="carro_b1">Carro B1</option>'
        + '<option value="carro_c1">Carro C1</option>'
        + '</select>'
        + '<select id="av-btype" onchange="loadSlots()" style="padding:0.4rem;border:2px solid var(--border);border-radius:6px">'
        + '<option value="practica">Practica (2h)</option>'
        + '<option value="examen">Examen (1h)</option>'
        + '</select>'
        + '</div></div>'
        + '<div class="card-body">'
        + '<h3 style="margin-bottom:0.5rem;color:#374151"><i class="fas fa-sun" style="color:var(--primary)"></i> Manana (6am - 2pm)</h3>'
        + '<div class="slots-grid" id="morning-slots">Cargando...</div>'
        + '<h3 style="margin:1.5rem 0 0.5rem;color:#374151"><i class="fas fa-moon" style="color:var(--primary)"></i> Tarde / Noche (2pm - 10pm)</h3>'
        + '<div class="slots-grid" id="afternoon-slots">Cargando...</div>'
        + '</div></div>';
    loadSlots();
}

async function loadSlots() {
    var dateVal = document.getElementById("av-date").value;
    var typeVal = document.getElementById("av-type").value;
    var btypeVal = document.getElementById("av-btype").value;
    var url = "/availability/slots?date=" + dateVal + "&booking_type=" + btypeVal;
    if (typeVal) url += "&vehicle_type=" + typeVal;

    try {
        var slots = await apiGet(url);
        var morningHtml = "";
        var afternoonHtml = "";

        for (var i = 0; i < slots.length; i++) {
            var s = slots[i];
            var card = '<div class="slot-card slot-' + s.status + '">'
                + '<div class="slot-time">' + s.start_time + ' - ' + s.end_time + '</div>'
                + '<div class="slot-info">' + s.available + '/' + s.total_instructors + ' disponibles</div>'
                + '<div class="slot-info">' + s.booked + ' reservados</div>'
                + '<div class="slot-duration">' + s.duration + '</div>'
                + '</div>';

            if (s.shift === "manana") {
                morningHtml += card;
            } else {
                afternoonHtml += card;
            }
        }

        document.getElementById("morning-slots").innerHTML = morningHtml || '<p style="color:#6b7280">No hay bloques</p>';
        document.getElementById("afternoon-slots").innerHTML = afternoonHtml || '<p style="color:#6b7280">No hay bloques</p>';
    } catch (err) {
        document.getElementById("morning-slots").innerHTML = '<p class="alert alert-danger">' + err.message + '</p>';
    }
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", function () {
    loadPage("dashboard");
});
