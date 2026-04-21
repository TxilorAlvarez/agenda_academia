async function renderExport() {
    var today = new Date();
    var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    var firstStr = formatDateExport(firstDay);
    var lastStr = formatDateExport(lastDay);

    // Semana actual
    var day = today.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    var weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff);
    var weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    var weekStartStr = formatDateExport(weekStart);
    var weekEndStr = formatDateExport(weekEnd);

    var todayStr = formatDateExport(today);

    content.innerHTML = '<h1 style="margin-bottom:1.5rem"><i class="fas fa-file-export" style="color:var(--primary)"></i> Exportar Datos</h1>'

        // Reservas
        + '<div class="card"><div class="card-header"><h2><i class="fas fa-calendar-check" style="color:var(--primary)"></i> Exportar Reservas</h2></div>'
        + '<div class="card-body">'
        + '<p style="color:var(--gray);margin-bottom:1rem">Filtra por rango de fechas y descarga un archivo CSV con todas las reservas.</p>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Fecha desde</label><input type="date" id="exp-from" value="' + firstStr + '"></div>'
        + '<div class="form-group"><label>Fecha hasta</label><input type="date" id="exp-to" value="' + lastStr + '"></div>'
        + '</div>'
        + '<div class="form-row">'
        + '<div class="form-group"><label>Estado</label><select id="exp-status">'
        + '<option value="">Todos</option><option value="reservada">Reservada</option>'
        + '<option value="completada">Completada</option><option value="cancelada">Cancelada</option>'
        + '<option value="no_asistio">No asistio</option></select></div>'
        + '<div class="form-group"><label>Instructor</label><select id="exp-instructor"><option value="">Todos</option></select></div>'
        + '</div>'
        + '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem">'
        + '<button class="btn btn-primary" onclick="exportBookings()"><i class="fas fa-download"></i> Descargar Reservas (filtrado)</button>'
        + '<button class="btn btn-success" onclick="exportBookingsQuick(\'' + weekStartStr + '\',\'' + weekEndStr + '\')"><i class="fas fa-calendar-week"></i> Esta Semana</button>'
        + '<button class="btn btn-warning" onclick="exportBookingsQuick(\'' + firstStr + '\',\'' + lastStr + '\')"><i class="fas fa-calendar"></i> Este Mes</button>'
        + '</div></div></div>'

        // Alumnos
        + '<div class="card"><div class="card-header"><h2><i class="fas fa-user-graduate" style="color:var(--primary)"></i> Exportar Alumnos</h2></div>'
        + '<div class="card-body">'
        + '<div style="display:flex;gap:0.5rem;flex-wrap:wrap">'
        + '<button class="btn btn-primary" onclick="exportData(\'students\')"><i class="fas fa-download"></i> Todos los Alumnos</button>'
        + '<button class="btn btn-success" onclick="exportData(\'students?status=activo\')"><i class="fas fa-download"></i> Solo Activos</button>'
        + '<button class="btn btn-info" style="background:var(--accent);color:white" onclick="exportData(\'students?status=completado\')"><i class="fas fa-download"></i> Completados</button>'
        + '</div></div></div>'

        // Instructores
        + '<div class="card"><div class="card-header"><h2><i class="fas fa-user-tie" style="color:var(--primary)"></i> Exportar Instructores</h2></div>'
        + '<div class="card-body">'
        + '<button class="btn btn-primary" onclick="exportData(\'instructors\')"><i class="fas fa-download"></i> Todos los Instructores</button>'
        + '</div></div>';

    // Cargar instructores en el select
    try {
        var instructors = await apiGet("/instructors/");
        var sel = document.getElementById("exp-instructor");
        for (var i = 0; i < instructors.length; i++) {
            var opt = document.createElement("option");
            opt.value = instructors[i].id;
            opt.textContent = instructors[i].full_name + " (" + instructors[i].shift + ")";
            sel.appendChild(opt);
        }
    } catch (e) {}
}

function exportBookings() {
    var from = document.getElementById("exp-from").value;
    var to = document.getElementById("exp-to").value;
    var status = document.getElementById("exp-status").value;
    var instructor = document.getElementById("exp-instructor").value;

    var url = window.APP_CONFIG.API_V1 + "/export/bookings?";
    if (from) url += "date_from=" + from + "&";
    if (to) url += "date_to=" + to + "&";
    if (status) url += "status=" + status + "&";
    if (instructor) url += "instructor_id=" + instructor + "&";

    window.open(url, "_blank");
}

function exportBookingsQuick(from, to) {
    var url = window.APP_CONFIG.API_V1 + "/export/bookings?date_from=" + from + "&date_to=" + to;
    window.open(url, "_blank");
}

function exportData(endpoint) {
    var url = window.APP_CONFIG.API_V1 + "/export/" + endpoint;
    window.open(url, "_blank");
}

function formatDateExport(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
}
