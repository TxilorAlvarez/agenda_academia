var currentStudent = null;
var currentWeekStart = null;
var selectedDate = null;

// ========== LOGIN ==========
async function loginStudent(ev) {
    ev.preventDefault();
    var doc = document.getElementById("login-doc").value.trim();
    var errorDiv = document.getElementById("login-error");
    errorDiv.style.display = "none";

    try {
        var students = await apiGet("/students/?status=activo");
        var found = null;
        for (var i = 0; i < students.length; i++) {
            if (students[i].document === doc) {
                found = students[i];
                break;
            }
        }

        if (!found) {
            // Buscar en todos los estados
            var allStudents = await apiGet("/students/");
            for (var j = 0; j < allStudents.length; j++) {
                if (allStudents[j].document === doc) {
                    found = allStudents[j];
                    break;
                }
            }
            if (found && found.status !== "activo") {
                errorDiv.textContent = "Tu cuenta esta en estado: " + found.status + ". Contacta a la academia.";
                errorDiv.style.display = "block";
                return;
            }
        }

        if (!found) {
            errorDiv.textContent = "Documento no encontrado. Verifica tu numero o contacta a la academia.";
            errorDiv.style.display = "block";
            return;
        }

        currentStudent = found;
        showPortal();

    } catch (err) {
        errorDiv.textContent = "Error de conexion: " + err.message;
        errorDiv.style.display = "block";
    }
}

function logout() {
    currentStudent = null;
    document.getElementById("login-section").style.display = "flex";
    document.getElementById("student-portal").style.display = "none";
    document.getElementById("nav-user").style.display = "none";
    document.getElementById("login-doc").value = "";
}

// ========== PORTAL ==========
function showPortal() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("student-portal").style.display = "block";
    document.getElementById("nav-user").style.display = "flex";
    document.getElementById("nav-username").textContent = currentStudent.full_name;

    renderStudentInfo();
    initCalendar();
    switchTab("calendar");
}

function renderStudentInfo() {
    var s = currentStudent;
    var pct = s.total_hours_required > 0 ? Math.round(s.hours_completed / s.total_hours_required * 100) : 0;
    var remaining = s.total_hours_required - s.hours_completed;
    var catLabel = window.APP_CONFIG.CATEGORY_LABELS[s.category] || s.category;

    document.getElementById("student-info").innerHTML =
        '<h2><i class="fas fa-user-graduate"></i> Bienvenido, ' + s.full_name + '</h2>'
        + '<div class="student-details">'
        + '<span><i class="fas fa-id-card"></i> ' + s.document + '</span>'
        + '<span><i class="fas fa-car"></i> ' + catLabel + '</span>'
        + '<span><i class="fas fa-phone"></i> ' + s.phone + '</span>'
        + '</div>'
        + '<div class="progress-info">'
        + '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>'
        + '<div class="progress-text">' + s.hours_completed + '/' + s.total_hours_required + ' horas (' + pct + '%) — Faltan ' + remaining + 'h</div>'
        + '</div>';
}

// ========== TABS ==========
function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(function(t) { t.classList.remove("active"); });
    document.querySelectorAll(".tab-content").forEach(function(t) { t.style.display = "none"; });

    if (tab === "calendar") {
        document.querySelectorAll(".tab")[0].classList.add("active");
        document.getElementById("tab-calendar").style.display = "block";
    } else {
        document.querySelectorAll(".tab")[1].classList.add("active");
        document.getElementById("tab-my-bookings").style.display = "block";
        loadMyBookings();
    }
}

// ========== CALENDARIO ==========
function initCalendar() {
    var today = new Date();
    // Ir al lunes de esta semana
    var day = today.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + diff);
    currentWeekStart.setHours(0, 0, 0, 0);
    renderWeek();
}

function changeWeek(direction) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction * 7));

    // No permitir ir al pasado
    var minStart = new Date(today);
    var dayOfWeek = minStart.getDay();
    var diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    minStart.setDate(minStart.getDate() + diffToMon);

    if (newStart < minStart) return;

    // Maximo 2 semanas adelante
    var maxStart = new Date(minStart);
    maxStart.setDate(maxStart.getDate() + 7);
    if (newStart > maxStart) return;

    currentWeekStart = newStart;
    renderWeek();
}

function renderWeek() {
    var grid = document.getElementById("week-grid");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    var monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // Week label
    var weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    document.getElementById("week-label").textContent =
        currentWeekStart.getDate() + " " + monthNames[currentWeekStart.getMonth()] +
        " - " + weekEnd.getDate() + " " + monthNames[weekEnd.getMonth()];

    var html = "";
    for (var i = 0; i < 7; i++) {
        var d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        var dateStr = formatDate(d);
        var isPast = d < today;
        var isToday = d.getTime() === today.getTime();
        var isSelected = selectedDate === dateStr;
        var isSunday = d.getDay() === 0;

        var classes = "day-card";
        if (isPast || isSunday) classes += " past";
        if (isToday) classes += " today";
        if (isSelected) classes += " selected";

        var onclick = (isPast || isSunday) ? "" : ' onclick="selectDate(\'' + dateStr + '\')"';

        html += '<div class="' + classes + '"' + onclick + '>'
            + '<div class="day-name">' + dayNames[i] + '</div>'
            + '<div class="day-number">' + d.getDate() + '</div>'
            + '<div class="day-month">' + monthNames[d.getMonth()] + '</div>'
            + '</div>';
    }
    grid.innerHTML = html;
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    renderWeek();
    loadSlots(dateStr);
}

async function loadSlots(dateStr) {
    var slotsCard = document.getElementById("slots-card");
    var container = document.getElementById("slots-container");
    slotsCard.style.display = "block";

    var parts = dateStr.split("-");
    var monthNames = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    var dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
    var d = new Date(dateStr + "T12:00:00");
    document.getElementById("selected-date-label").textContent =
        dayNames[d.getDay()] + " " + parseInt(parts[2]) + " de " + monthNames[parseInt(parts[1])];

    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280"><i class="fas fa-spinner fa-spin"></i> Cargando horarios...</div>';

    try {
        var category = currentStudent.category;
        var slots = await apiGet("/availability/slots?date=" + dateStr + "&vehicle_type=" + category + "&booking_type=practica");

        if (slots.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay horarios disponibles para esta fecha.</div>';
            return;
        }

        // Separar manana y tarde
        var morningHtml = "";
        var afternoonHtml = "";
        var hasMorning = false;
        var hasAfternoon = false;

        for (var i = 0; i < slots.length; i++) {
            var s = slots[i];
            var badgeClass = s.status === "disponible" ? "slot-badge-available" : (s.status === "pocas_plazas" ? "slot-badge-few" : "slot-badge-full");
            var badgeText = s.status === "disponible" ? "Disponible" : (s.status === "pocas_plazas" ? "Pocas plazas" : "Lleno");
            var onclick = s.status !== "lleno" ? ' onclick="confirmBooking(\'' + dateStr + '\',\'' + s.start_time + '\',\'' + s.end_time + '\')"' : '';

            var card = '<div class="slot-card slot-' + s.status + '"' + onclick + '>'
                + '<div class="slot-time">' + s.start_time + ' - ' + s.end_time + '</div>'
                + '<div class="slot-info">' + s.available + ' instructor(es) disponible(s)</div>'
                + '<span class="slot-badge ' + badgeClass + '">' + badgeText + '</span>'
                + '</div>';

            if (s.shift === "manana") { morningHtml += card; hasMorning = true; }
            else { afternoonHtml += card; hasAfternoon = true; }
        }

        var html = "";
        if (hasMorning) {
            html += '<h3 style="margin-bottom:0.8rem;color:var(--dark)"><i class="fas fa-sun" style="color:var(--primary)"></i> Manana (6am - 2pm)</h3>'
                + '<div class="slots-grid">' + morningHtml + '</div>';
        }
        if (hasAfternoon) {
            html += '<h3 style="margin:1.5rem 0 0.8rem;color:var(--dark)"><i class="fas fa-moon" style="color:var(--primary)"></i> Tarde / Noche (2pm - 10pm)</h3>'
                + '<div class="slots-grid">' + afternoonHtml + '</div>';
        }

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    }
}

// ========== CONFIRMAR RESERVA ==========
function confirmBooking(dateStr, startTime, endTime) {
    // Verificar limite de 2 horas diarias (1 bloque de 2h)
    var modal = document.getElementById("modal-content");
    var overlay = document.getElementById("modal-overlay");

    var parts = dateStr.split("-");
    var monthNames = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    modal.innerHTML = '<h2><i class="fas fa-calendar-check" style="color:var(--primary)"></i> Confirmar Reserva</h2>'
        + '<p><strong>Fecha:</strong> ' + parseInt(parts[2]) + ' de ' + monthNames[parseInt(parts[1])] + ' de ' + parts[0] + '<br>'
        + '<strong>Horario:</strong> ' + startTime + ' - ' + endTime + ' (2 horas)<br>'
        + '<strong>Categoria:</strong> ' + (window.APP_CONFIG.CATEGORY_LABELS[currentStudent.category] || currentStudent.category) + '</p>'
        + '<div class="alert alert-warning" style="text-align:left;margin-bottom:1rem">'
        + '<strong><i class="fas fa-exclamation-triangle"></i> Importante:</strong><br>'
        + 'Si no puedes asistir, debes cancelar con al menos <strong>24 horas de anticipacion</strong>. '
        + 'De lo contrario se cobrara multa por inasistencia.'
        + '</div>'
        + '<div style="display:flex;gap:0.5rem;justify-content:center">'
        + '<button class="btn btn-primary" onclick="submitBooking(\'' + dateStr + '\',\'' + startTime + '\',\'' + endTime + '\')"><i class="fas fa-check"></i> Confirmar</button>'
        + '<button class="btn btn-danger" onclick="closeModal()"><i class="fas fa-times"></i> Cancelar</button>'
        + '</div>';

    overlay.classList.remove("hidden");
}

async function submitBooking(dateStr, startTime, endTime) {
    var modal = document.getElementById("modal-content");

    try {
        // Verificar si ya tiene reserva ese dia
        var myBookings = await apiGet("/bookings/?student_id=" + currentStudent.id + "&date_from=" + dateStr + "&date_to=" + dateStr + "&status=reservada");
        if (myBookings.length > 0) {
            modal.innerHTML = '<h2 style="color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Ya tienes reserva</h2>'
                + '<p>Ya tienes una clase reservada para este dia:<br><strong>' + myBookings[0].start_time + ' - ' + myBookings[0].end_time + '</strong><br>Solo puedes agendar 1 bloque de 2 horas por dia.</p>'
                + '<button class="btn btn-primary" onclick="closeModal()">Entendido</button>';
            return;
        }

        // Buscar instructor libre
        var freeInstructors = await apiGet("/availability/free-instructors?date=" + dateStr + "&start_time=" + startTime + ":00&vehicle_type=" + currentStudent.category);

        if (freeInstructors.length === 0) {
            modal.innerHTML = '<h2 style="color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Sin disponibilidad</h2>'
                + '<p>Ya no hay instructores disponibles en este horario. Intenta otro horario.</p>'
                + '<button class="btn btn-primary" onclick="closeModal()">Entendido</button>';
            return;
        }

        // Asignar el primer instructor libre
        var instructor = freeInstructors[0];

        var payload = {
            student_id: currentStudent.id,
            instructor_id: instructor.id,
            date: dateStr,
            start_time: startTime + ":00",
            end_time: endTime + ":00",
            booking_type: "practica",
            notes: "Reservado por el alumno desde el portal"
        };

        await apiPost("/bookings/", payload);

        // Actualizar info del alumno
        var updatedStudent = await apiGet("/students/" + currentStudent.id);
        currentStudent = updatedStudent;
        renderStudentInfo();

        modal.innerHTML = '<h2 style="color:var(--success)"><i class="fas fa-check-circle"></i> Reserva Exitosa!</h2>'
            + '<p>Tu clase ha sido agendada:<br><strong>' + dateStr + '</strong><br><strong>' + startTime + ' - ' + endTime + '</strong><br>Instructor: <strong>' + instructor.full_name + '</strong></p>'
            + '<div class="alert alert-warning" style="text-align:left">'
            + '<i class="fas fa-exclamation-triangle"></i> Recuerda: cancela con 24h de anticipacion para evitar multa.'
            + '</div>'
            + '<button class="btn btn-primary" onclick="closeModal(); loadSlots(\'' + dateStr + '\')">Aceptar</button>';

    } catch (err) {
        modal.innerHTML = '<h2 style="color:var(--danger)"><i class="fas fa-times-circle"></i> Error</h2>'
            + '<p>' + err.message + '</p>'
            + '<button class="btn btn-primary" onclick="closeModal()">Cerrar</button>';
    }
}

// ========== MIS RESERVAS ==========
async function loadMyBookings() {
    var container = document.getElementById("my-bookings-container");
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280"><i class="fas fa-spinner fa-spin"></i> Cargando reservas...</div>';

    try {
        var bookings = await apiGet("/bookings/?student_id=" + currentStudent.id);

        if (bookings.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No tienes reservas aun. Ve a <strong>Agendar Clase</strong> para reservar.</div>';
            return;
        }

        // Separar futuras y pasadas
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var todayStr = formatDate(today);

        var futureHtml = "";
        var pastHtml = "";
        var futureCount = 0;
        var pastCount = 0;

        for (var i = 0; i < bookings.length; i++) {
            var b = bookings[i];
            var isFuture = b.date >= todayStr;
            var canCancel = false;

            if (b.status === "reservada" && isFuture) {
                // Verificar si faltan mas de 24 horas
                var bookingDateTime = new Date(b.date + "T" + b.start_time);
                var now = new Date();
                var hoursUntil = (bookingDateTime - now) / (1000 * 60 * 60);
                canCancel = hoursUntil > 24;
            }

            var statusBadge = {
                reservada: "badge-warning",
                completada: "badge-success",
                cancelada: "badge-danger",
                no_asistio: "badge-gray",
                en_espera: "badge-info"
            };

            var item = '<div class="booking-item">'
                + '<div class="booking-info">'
                + '<div class="booking-date"><i class="fas fa-calendar"></i> ' + b.date + '</div>'
                + '<div class="booking-time"><i class="fas fa-clock"></i> ' + b.start_time + ' - ' + b.end_time
                + ' <span class="badge ' + (b.booking_type === "examen" ? "badge-danger" : "badge-info") + '">' + (b.booking_type === "examen" ? "EXAMEN" : "Practica") + '</span></div>'
                + '<div class="booking-detail">Instructor: ' + (b.instructor_name || "Por asignar") + ' | Hora #' + (b.hour_number || "-") + '</div>'
                + '</div>'
                + '<div class="booking-actions">'
                + '<span class="badge ' + (statusBadge[b.status] || "badge-gray") + '">' + b.status + '</span>';

            if (canCancel) {
                item += ' <button class="btn btn-danger btn-sm" onclick="cancelMyBooking(' + b.id + ')"><i class="fas fa-times"></i> Cancelar</button>';
            } else if (b.status === "reservada" && isFuture) {
                item += ' <span style="font-size:0.7rem;color:var(--danger)"><i class="fas fa-lock"></i> -24h</span>';
            }

            item += '</div></div>';

            if (isFuture && b.status === "reservada") {
                futureHtml += item;
                futureCount++;
            } else {
                pastHtml += item;
                pastCount++;
            }
        }

        var html = "";
        if (futureCount > 0) {
            html += '<h3 style="padding:1rem 1.2rem 0.5rem;color:var(--dark)"><i class="fas fa-calendar-alt" style="color:var(--primary)"></i> Proximas clases (' + futureCount + ')</h3>' + futureHtml;
        }
        if (pastCount > 0) {
            html += '<h3 style="padding:1rem 1.2rem 0.5rem;color:var(--gray)"><i class="fas fa-history"></i> Historial (' + pastCount + ')</h3>' + pastHtml;
        }

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = '<div class="alert alert-danger">Error: ' + err.message + '</div>';
    }
}

async function cancelMyBooking(bookingId) {
    var modal = document.getElementById("modal-content");
    var overlay = document.getElementById("modal-overlay");

    modal.innerHTML = '<h2><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Cancelar Reserva</h2>'
        + '<p>Estas seguro que deseas cancelar esta clase?<br>El horario quedara disponible para otros aprendices.</p>'
        + '<div style="display:flex;gap:0.5rem;justify-content:center">'
        + '<button class="btn btn-danger" onclick="confirmCancelBooking(' + bookingId + ')"><i class="fas fa-times"></i> Si, cancelar</button>'
        + '<button class="btn btn-primary" onclick="closeModal()">No, mantener</button>'
        + '</div>';

    overlay.classList.remove("hidden");
}

async function confirmCancelBooking(bookingId) {
    var modal = document.getElementById("modal-content");
    try {
        await apiPut("/bookings/" + bookingId + "/cancel", {});

        modal.innerHTML = '<h2 style="color:var(--success)"><i class="fas fa-check-circle"></i> Reserva Cancelada</h2>'
            + '<p>Tu clase ha sido cancelada y el horario esta disponible para otros.</p>'
            + '<button class="btn btn-primary" onclick="closeModal(); loadMyBookings()">Aceptar</button>';

    } catch (err) {
        modal.innerHTML = '<h2 style="color:var(--danger)"><i class="fas fa-times-circle"></i> Error</h2>'
            + '<p>' + err.message + '</p>'
            + '<button class="btn btn-primary" onclick="closeModal()">Cerrar</button>';
    }
}

// ========== UTILS ==========
function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
}

function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
}

document.getElementById("modal-overlay").addEventListener("click", function(e) {
    if (e.target.id === "modal-overlay") closeModal();
});
