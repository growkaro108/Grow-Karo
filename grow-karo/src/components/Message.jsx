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

export const toastMessage = (message, title = "Success", icon = "success", timer = 2000) => {
    return Swal.fire({
        position: "top-end",
        icon: icon,
        title: title,
        text: message,
        showConfirmButton: false,
        timer: timer
    });
};
