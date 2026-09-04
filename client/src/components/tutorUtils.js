export function formatDate(value) { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
export function formatTime(value) { return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
export function getError(error, fallback) { return error.response?.data?.message || error.message || fallback; }