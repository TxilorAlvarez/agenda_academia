var API = window.APP_CONFIG.API_V1;

async function apiGet(endpoint) {
    var res = await fetch(API + endpoint);
    if (!res.ok) {
        var err = await res.json();
        throw new Error(err.detail || "Error en la peticion");
    }
    return res.json();
}

async function apiPost(endpoint, data) {
    var res = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        var err = await res.json();
        throw new Error(err.detail || "Error al crear");
    }
    return res.json();
}

async function apiPut(endpoint, data) {
    var res = await fetch(API + endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        var err = await res.json();
        throw new Error(err.detail || "Error al actualizar");
    }
    return res.json();
}

async function apiDelete(endpoint) {
    var res = await fetch(API + endpoint, { method: "DELETE" });
    if (!res.ok) {
        var err = await res.json();
        throw new Error(err.detail || "Error al eliminar");
    }
    return res.json();
}

async function apiUploadCSV(endpoint, file) {
    var formData = new FormData();
    formData.append("file", file);
    var res = await fetch(API + endpoint, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        var err = await res.json();
        throw new Error(err.detail || "Error al importar");
    }
    return res.json();
}
