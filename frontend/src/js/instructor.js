var currentInstructor = null;
var currentWeekStart = null;
var selectedDate = null;

// ========== LOGIN ==========
async function loginInstructor(ev) {
    ev.preventDefault();
    var doc = document.getElementById("login-doc").value.trim();
    var errorDiv = document.getElementById("login-error");
    errorDiv.style.display = "none";

    try {
        var instructors = await apiGet("/instructors/");
        var found = null;
        for (var i = 0; i < instructors.length; i++) {
            if (instructors[i].document === doc) {
                found = instructors[i];
                break;
            }
        }

        if (!found) {
            errorDiv.textContent = "Documento no encontrado. Verifica tu numero o contacta a la academia.";
            errorDiv.style.display = "block";
            return;
        }

        if (!found.is_active) {
            errorDiv.textContent = "Tu cuenta de instructor esta inactiva. Contacta a la administracion.";
            errorDiv.style.display = "block";
            return;
        }

        currentInstructor = found;
        showPortal();

    } catch (err) {
        errorDiv.textContent = "Error de conexion: " + err.message;
        errorDiv.style.display = "block";
    }
}

function logout() {
    currentInstructor = null;
    document.getElementById("login-section").style.display = "flex";
    document.getElementById("instructor-portal").style.display = "none";
    document.getElementById("nav-user").style.display = "none";
    document.getElementById("login-doc").value = "";
}

// ========== PORTAL ==========
function showPortal() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("instructor-portal").style.display = "block";
    document.getElementById("nav-user").style.display = "flex";
    document.getElementById("nav-username").textContent = currentInstructor.full_name;

    renderInstructorInfo();
    initCalendar();
    switchTab("schedule");
}

function renderInstructorInfo() {
    var inst = currentInstructor;
    var catLabel = window.APP_CONFIG.CATEGORY_LABELS[inst.vehicle_type] || inst.vehicle_type;
    var shiftLabel = window.APP_CONFIG.SHIFT_LABELS[inst.shift] || inst.shift;

    document.getElementById("instructor-info").innerHTML =
        '<h2><i class="fas fa-user-tie"></i> Bienvenido, ' + inst.full_name + '</h2>'
        + '<div class="student-details">'
        + '<span><i class="fas fa-id-card"></i> ' + inst.document + '</span>'
        + '<span><i class="fas fa-car"></i> ' + catLabel + '</span>'
        + '<span><i class="fas fa-clock"></i> ' + shiftLabel + '</span>'
        + '<span><i class="fas fa-phone"></i> ' + (inst.phone || "Sin telefono") + '</span>'
        + '</div>';
}

// ========== TABS ==========
function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(function(t) { t.classList.remove("active"); });
    document.querySelectorAll(".tab-content").forEach(function(t) { t.style.display = "none"; });

    if (tab === "schedule") {
        document.querySelectorAll(".tab")[0].classList.add("active");
        document.getElementById("tab-schedule").style.display = "block";
    } else if (tab === "today") {
        document.querySelectorAll(".tab")[1].classList.add("active");
        document.getElementById("tab-today").style.display = "block";
        loadToday();
    } else if (tab === "students") {
        document.querySelectorAll(".tab")[2].classList.add("active");
        document.getElementById("tab-students").style.display = "block";
        loadMyStudents();
    }
}

// ========== CALENDARIO ==========
function initCalendar() {
    var today = new Date();
    var day = today.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + diff);
    currentWeekStart.setHours(0, 0, 0, 0);
    renderWeek();
}

function changeWeek(direction) {
    var newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction * 7));
    currentWeekStart = newStart;
    renderWeek();
}

async function renderWeek() {
    var grid = document.getElementById("week-grid");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    var monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    var weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    document.getElementById("week-label").textContent =
        currentWeekStart.getDate() + " " + monthNames[currentWeekStart.getMonth()] +
        " - " + weekEnd.getDate() + " " + monthNames[weekEnd.getMonth()];

    // Obtener reservas de la semana
    var weekStartStr = formatDate(currentWeekStart);
    var weekEndStr = formatDate(weekEnd);
    var bookings = [];
    try {
        bookings = await apiGet("/bookings/?instructor_id=" + currentInstructor.id + "&date_from=" + weekStartStr + "&date_to=" + weekEndStr + "&status=reservada");
    } catch (e) {}

    // Contar clases por dia
    var classesByDay = {};
    for (var b = 0; b < bookings.length; b++) {
        var bDate = bookings[b].date;
        classesByDay[bDate] = (classesByDay[bDate] || 0) + 1;
    }

    var html = "";
    for (var i = 0; i < 7; i++) {
        var d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        var dateStr = formatDate(d);
        var isToday = d.getTime() === today.getTime();
        var isSelected = selectedDate === dateStr;
        var isSunday = d.getDay() === 0;
        var classCount = classesByDay[dateStr] || 0;

        var classes = "day-card";
        if (isToday) classes += " today";
        if (isSelected) classes += " selected";
        if (isSunday) classes += " past";

        var onclick = isSunday ? "" : ' onclick="selectDate(\'' + dateStr + '\')"';

        html += '<div class="' + classes + '"' + onclick + '>'
            + '<div class="day-name">' + dayNames[i] + '</div>'
            + '<div class="day-number">' + d.getDate() + '</div>'
            + '<div class="day-month">' + monthNames[d.getMonth()] + '</div>'
            + '<div class="day-classes">' + (classCount > 0 ? classCount + ' clase(s)' : '') + '</div>'
            + '</div>';
    }
    grid.innerHTML = html;
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    renderWeek();
    loadDayDetail(dateStr);
}

async function loadDayDetail(dateStr) {
    var card = document.getElementById("day-detail-card");
    var container = document.getElementById("day-detail-container");
    card.style.display = "block";

    var parts = dateStr.split("-");
    var monthNames = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    var dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
    var d = new Date(dateStr + "T12:00:00");
    document.getElementById("selected-date-label").textContent =
        dayNames[d.getDay()] + " " + parseInt(parts[2]) + " de " + monthNames[parseInt(parts[1])];

    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        var bookings = await apiGet("/bookings/?instructor_id=" + currentInstructor.id + "&date_from=" + dateStr + "&date_to=" + dateStr);

        if (bookings.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-check"></i>No tienes clases programadas para este dia.</div>';
            return;
        }

        // Ordenar por hora
        bookings.sort(function(a, b) { return a.start_time.localeCompare(b.start_time); });

        var html = "";
        for (var i = 0; i < bookings.length; i++) {
            var b = bookings[i];
            var statusBadge = {
                reservada: "badge-warning",
                completada: "badge-success",
                cancelada: "badge-danger",
                no_asistio: "badge-gray"
            };
            var typeLabel = b.booking_type === "examen" ? "EXAMEN (1h)" : "Practica (2h)";
            var typeBadge = b.booking_type === "examen" ? "badge-danger" : "badge-info";

            html += '<div class="schedule-item">'
                + '<div class="schedule-time"><i class="fas fa-clock"></i> ' + b.start_time + '<br>' + b.end_time + '</div>'
                + '<div class="schedule-info">'
                + '<div class="student-name"><i class="fas fa-user-graduate"></i> ' + (b.student_name || "Alumno ID:" + b.student_id) + '</div>'
                + '<div class="student-detail">Hora #' + (b.hour_number || "-") + ' | <span class="badge ' + typeBadge + '">' + typeLabel + '</span></div>'
                + '</div>'
                + '<div class="schedule-badge"><span class="badge ' + (statusBadge[b.status] || "badge-gray") + '">' + b.status + '</span></div>'
                + '</div>';
        }

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    }
}

// ========== HOY ==========
async function loadToday() {
    var container = document.getElementById("today-container");
    var today = formatDate(new Date());

    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        var bookings = await apiGet("/bookings/?instructor_id=" + currentInstructor.id + "&date_from=" + today + "&date_to=" + today);

        // Filtrar solo reservadas y completadas de hoy
        var active = [];
        for (var i = 0; i < bookings.length; i++) {
            if (bookings[i].status === "reservada" || bookings[i].status === "completada") {
                active.push(bookings[i]);
            }
        }

        if (active.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-coffee"></i>No tienes clases programadas para hoy.<br><br>Disfruta tu dia!</div>';
            return;
        }

        active.sort(function(a, b) { return a.start_time.localeCompare(b.start_time); });

        var html = '<div class="alert alert-info" style="margin-bottom:1rem"><strong>Hoy ' + today + '</strong> — Tienes <strong>' + active.length + ' clase(s)</strong> programada(s)</div>';

        for (var j = 0; j < active.length; j++) {
            var b = active[j];
            var now = new Date();
            var startParts = b.start_time.split(":");
            var classStart = new Date();
            classStart.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0);
            var endParts = b.end_time.split(":");
            var classEnd = new Date();
            classEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0);

            var timeStatus = "";
            if (b.status === "completada") {
                timeStatus = '<span class="badge badge-success">COMPLETADA</span>';
            } else if (now >= classStart && now <= classEnd) {
                timeStatus = '<span class="badge badge-warning" style="animation:pulse 1s infinite">EN CURSO</span>';
            } else if (now < classStart) {
                timeStatus = '<span class="badge badge-info">PENDIENTE</span>';
            } else {
                timeStatus = '<span class="badge badge-gray">FINALIZADA</span>';
            }

            var typeLabel = b.booking_type === "examen" ? "EXAMEN" : "Practica";

            html += '<div class="schedule-item" style="border-left:4px solid var(--primary)">'
                + '<div class="schedule-time" style="font-size:1.1rem">' + b.start_time + '<br><span style="font-size:0.75rem;color:var(--gray)">a ' + b.end_time + '</span></div>'
                + '<div class="schedule-info">'
                + '<div class="student-name" style="font-size:1.05rem"><i class="fas fa-user-graduate"></i> ' + (b.student_name || "Alumno") + '</div>'
                + '<div class="student-detail">Hora #' + (b.hour_number || "-") + ' | ' + typeLabel + '</div>'
                + '</div>'
                + '<div class="schedule-badge">' + timeStatus + '</div>'
                + '</div>';
        }

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    }
}

// ========== MIS ALUMNOS ==========
async function loadMyStudents() {
    var container = document.getElementById("my-students-container");
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        // Obtener todas las reservas del instructor
        var bookings = await apiGet("/bookings/?instructor_id=" + currentInstructor.id);

        // Extraer IDs unicos de alumnos
        var studentIds = {};
        for (var i = 0; i < bookings.length; i++) {
            studentIds[bookings[i].student_id] = bookings[i].student_name || "Alumno";
        }

        var ids = Object.keys(studentIds);
        if (ids.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-user-graduate"></i>No tienes alumnos asignados aun.</div>';
            return;
        }

        // Obtener datos de cada alumno
        var students = [];
        for (var j = 0; j < ids.length; j++) {
            try {
                var student = await apiGet("/students/" + ids[j]);
                // Contar clases con este instructor
                var classCount = 0;
                for (var k = 0; k < bookings.length; k++) {
                    if (bookings[k].student_id === student.id && bookings[k].status === "completada") {
                        classCount++;
                    }
                }
                student._classesWithMe = classCount;
                students.push(student);
            } catch (e) {}
        }

        // Ordenar por nombre
        students.sort(function(a, b) { return a.full_name.localeCompare(b.full_name); });

        var html = '<div class="alert alert-info" style="margin-bottom:1rem">Has trabajado con <strong>' + students.length + ' alumno(s)</strong> en total.</div>';

        for (var s = 0; s < students.length; s++) {
            var st = students[s];
            var pct = st.total_hours_required > 0 ? Math.round(st.hours_completed / st.total_hours_required * 100) : 0;
            var remaining = st.total_hours_required - st.hours_completed;
            var catLabel = window.APP_CONFIG.CATEGORY_LABELS[st.category] || st.category;
            var statusBadge = { activo: "badge-success", completado: "badge-info", retirado: "badge-danger", pendiente: "badge-warning" };

            html += '<div class="student-progress-card">'
                + '<div class="student-progress-info">'
                + '<div class="sp-name"><i class="fas fa-user-graduate"></i> ' + st.full_name + '</div>'
                + '<div class="sp-detail">'
                + '<span class="badge badge-info">' + catLabel + '</span> '
                + '<span class="badge ' + (statusBadge[st.status] || "badge-gray") + '">' + st.status + '</span> '
                + st.phone + ' | ' + st._classesWithMe + ' clases contigo'
                + '</div>'
                + '</div>'
                + '<div class="student-progress-bar">'
                + '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>'
                + '<div class="progress-text" style="font-size:0.72rem;color:var(--gray)">' + st.hours_completed + '/' + st.total_hours_required + 'h (' + pct + '%) — Faltan ' + remaining + 'h</div>'
                + '</div>'
                + '</div>';
        }

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    }
}

// ========== UTILS ==========
function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
}
