// cookies management for the backend api
"use server";
import { cookies } from "next/headers";
import LZString from "lz-string";

export const getCookies = async () => {
    const cookieStore = await cookies();
    return cookieStore.getAll();
};

const defaultCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict', // strict, lax, none
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
};

export const setSecureCookie = async (name, value, options) => {
    try {
        if (!name || !value) {
            return { success: false, message: 'Name and value are required' };
        }
        const compressData = LZString.compressToUTF16(JSON.stringify(value));
        const cookieStore = await cookies();
        cookieStore.set(name, compressData, { ...defaultCookieOptions, ...options });
        return { success: true, message: 'Cookie set successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to set cookie', error: error.message };
    }
};

export const getSecureCookie = async (name) => {
    try {
        if (!name) {
            return { error: 'Name is required' };
        }
        const cookieStore = await cookies();
        const cookie = cookieStore.get(name);
        if (!cookie) {
            return;
        }

        const decompressed = LZString.decompressFromUTF16(cookie.value);
        if (!decompressed) return null;

        const userData = JSON.parse(decompressed);
        return { success: true, data: userData };
    } catch (error) {
        return { error: 'Failed to get cookie', error: error.message, success: false };
    }
};

export const deleteSecureCookie = async (name) => {
    try {
        if (!name) {
            return { success: false, message: 'Name is required' };
        }
        const cookieStore = await cookies();
        cookieStore.delete(name);
        return { success: true, message: 'Cookie deleted successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to delete cookie', error: error.message };
    }
};



