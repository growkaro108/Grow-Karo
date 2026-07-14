import { errorMessage, infoMessage, successMessage } from "@/components/Message";


function showMessage(kind, response, fallback) {
    const message = response?.message || fallback;
    switch (kind) {
        case "success":
            successMessage(message);
            break;
        case "info":
            infoMessage(message);
            break;
        case "error":
        default:
            errorMessage(message);
            break;
    }
}

export function userSendOTPMessage(response) {
    const status = response?.status;

    switch (status) {
        case "success":
            showMessage("success", response, "OTP sent successfully");
            return true;
        case "present":
            showMessage("info", response, "Email already exists");
            return false;
        case "error":
            showMessage("error", response, "Internal server error");
            return false;
        default:
            showMessage("error", response, "Something went wrong");
            return false;
    }
}

export function userValidateOTPMessage(response) {
    const isOk = response?.status === "ok";
    showMessage(isOk ? "success" : "error", response, isOk ? "OTP validated successfully" : "Invalid OTP");
    return isOk;
}

export function userSignUpMessage(response) {
    const isOk = response?.status === "ok";
    showMessage(isOk ? "success" : "error", response, isOk ? "Signed up successfully" : "Sign up failed");
    return isOk;
}