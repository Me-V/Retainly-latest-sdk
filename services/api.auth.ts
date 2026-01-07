// services/api.auth.ts
import axios from "axios";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE; // change to your server IP

export async function loginWithGoogle(idToken: string, email: string) {
  try {
    const res = await axios.post(`${API_BASE}/backend/api/signup/`, {
      signup_method: "google",
      email: email,
      token: idToken,
    });
    return res.data; // this will contain { token, detail }
  } catch (err: any) {
    console.error("Google login error:", err.response?.data || err.message);
    throw err;
  }
}

export async function acceptConsent(consentVersion: string, pendingAuth: string) {
  try {
    const res = await axios.post(`${API_BASE}/backend/api/consent/accept/`, {
      consent_version: consentVersion,
      pending_auth: pendingAuth,
    });
    return res.data; // Returns { token, detail, user, ... }
  } catch (err: any) {
    console.error("Consent acceptance error:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ New function: signup with phone OTP
export async function signupWithPhoneOTP(phoneNumber: string, idToken: string) {
  try {
    const res = await axios.post(`${API_BASE}/backend/api/signup/`, {
      signup_method: "phone-otp",
      phone_number: phoneNumber,
      token: idToken,
    });
    return res.data; // { token, detail }
  } catch (err: any) {
    console.error("Phone OTP signup error:", err.response?.data || err.message);
    throw err;
  }
}

// Email & Password signup (also used to check verification)
export async function signupWithEmailPassword(
  email: string,
  password: string,
  idToken: string
) {
  try {
    const res = await axios.post(`${API_BASE}/backend/api/signup/`, {
      signup_method: "email-pwd",
      email,
      password,
      token: idToken,
    });
    return res.data; // backend returns 400 if email not verified, 200 with token if verified
  } catch (err: any) {
    console.error("Email-Pwd signup error:", err.response?.data || err.message);
    throw err;
  }
}

export async function loginWithEmailPassword(email: string, password: string) {
  try {
    const res = await axios.post(`${API_BASE}/backend/api/login/email/`, {
      email,
      password,
    });
    return res.data; // { token, detail }
  } catch (err: any) {
    console.error("Email login error:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ NEW: Update user profile (patch)
export async function patchMe(
  token: string,
  data: {
    alias?: string;
    phone_number?: string;
    email?: string;
    student_class?: string;
    board?: string;
    stream?: string;
    school?: string;
  }
) {
  try {
    const res = await axios.patch(`${API_BASE}/backend/api/account/me/`, data, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err: any) {
    console.error("patchMe error:", err.response?.data || err.message);
    throw err;
  }
}

export async function patchEmail(
  token: string,
  data: {
    email?: string;
    email_token?: string;
  }
) {
  try {
    const res = await axios.patch(`${API_BASE}/backend/api/account/email/`, data, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err: any) {
    console.error("patchMe error:", err.response?.data || err.message);
    throw err;
  }
}

export async function patchPhone(
  token: string,
  data: {
    phone_number?: string;
    phone_token?: string;
  }
) {
  try {
    const res = await axios.patch(`${API_BASE}/backend/api/account/phone/`, data, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err: any) {
    console.error("patchMe error:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ NEW: Get user profile
export async function getme(token: string) {
  try {
    const res = await axios.get(`${API_BASE}/backend/api/account/me/`, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("#######getme data", res.data);
    return res.data;
  } catch (err: any) {
    console.error("getme error:", err.response?.data || err.message);
    throw err;
  }
}

export async function logout(token: string) {
  try {
    await axios.post(
      `${API_BASE}/backend/api/login/logout/`,
      {},
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return true;
  } catch (err: any) {
    console.error("Logout error:", err.response?.data || err.message);
    throw err;
  }
}
