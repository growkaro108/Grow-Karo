import Swal from "sweetalert2";

export function successMessage(message, title = "Success") {
    return Swal.fire({
        title: title,
        text: message,
        icon: "success",
        confirmButtonText: "OK",
    });
}

export function errorMessage(message, title = "Error") {
    return Swal.fire({
        title: title,
        text: message,
        icon: "error",
        confirmButtonText: "OK",
    });
}

export function warningMessage(message) {
    return Swal.fire({
        title: "Warning!",
        text: message,
        icon: "warning",
        confirmButtonText: "OK",
    });
}

export function infoMessage(message) {
    return Swal.fire({
        title: "Info!",
        text: message,
        icon: "info",
        confirmButtonText: "OK",
    });
}
export const confirmMessage = async (message, title = "Are you sure?", confirmButtonText = "Yes, I do") => {
    const result = await Swal.fire({
        title: title,
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: confirmButtonText,
        cancelButtonText: "No, cancel",
    });
    return result.isConfirmed;
};

export const allRounderMessage = (response) => {
    // Translate common API status variants to SweetAlert2 icon names
    const iconMap = {
        ok: 'success',
        success: 'success',
        error: 'error',
        failed: 'error',
        warning: 'warning',
        info: 'info'
    };

    const alertIcon = iconMap[response?.status] || 'info';

    Swal.fire({
        title: response?.title || 'Notification',
        text: response?.message || '',
        icon: alertIcon, // Safely falls back to a valid icon
    });
};