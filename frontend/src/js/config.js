var isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

window.APP_CONFIG = {
    API_BASE_URL: isLocal ? "http://127.0.0.1:8000" : "https://agenda-academia-api.onrender.com",
    API_V1: isLocal ? "http://127.0.0.1:8000/api/v1" : "https://agenda-academia-api.onrender.com/api/v1",
    HOURS_MAP: {
        moto: { practice: 14, exam: 1, total: 15 },
        carro_b1: { practice: 19, exam: 1, total: 20 },
        carro_c1: { practice: 29, exam: 1, total: 30 },
    },
    CATEGORY_LABELS: {
        moto: "Moto",
        carro_b1: "Carro B1",
        carro_c1: "Carro C1",
    },
    SHIFT_LABELS: {
        manana: "Mañana (6am-2pm)",
        tarde: "Tarde (2pm-10pm)",
    },
};
