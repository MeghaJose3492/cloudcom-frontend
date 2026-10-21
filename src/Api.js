import { useEffect, useState } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return '';
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(imageUrl)) return imageUrl;
  return new URL(imageUrl, `${API_BASE_URL}/`).toString();
}

const Api = {
  adminLogin: `${API_BASE_URL}/api/admin/login`,
  adminForgotPassword: `${API_BASE_URL}/api/admin/forgot-password`,
  adminResetPassword: `${API_BASE_URL}/api/admin/reset-password`,
  items: `${API_BASE_URL}/api/items`,
  inquiries: `${API_BASE_URL}/api/inquiries`,
  categories: `${API_BASE_URL}/api/categories/active`,
  categoriesAll: `${API_BASE_URL}/api/categories`,
};

async function postAdminPasswordRequest(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const error = new Error(result.detail || result.message || result.error || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json().catch(() => null);
}

export function requestAdminPasswordReset(email) {
  return postAdminPasswordRequest(Api.adminForgotPassword, { email });
}

export function resetAdminPassword(token, newPassword) {
  return postAdminPasswordRequest(Api.adminResetPassword, { token, newPassword });
}

export function createItemFormData(form) {
  const formData = new FormData();
  formData.append("name", form.name);
  formData.append("description", form.description);
  formData.append("categoryId", form.categoryId);
  formData.append("type", form.type);
  formData.append("stock", form.stock);
  formData.append("cgstPercentage", form.cgstPercentage);
  formData.append("sgstPercentage", form.sgstPercentage);
  formData.append("rate", form.rate);
  formData.append("active", form.active);

  if (form.image instanceof File) {
    formData.append("image", form.image);
  } else if (form.imageUrl) {
    formData.append("imageUrl", form.imageUrl);
  }

  return formData;
}

export default Api;

const demo = (items) => ({ loading: false, items, demo: true });

export const PRODUCTS_DEMO = [
  { id: "product-laptop", name: "CloudPro Laptop", category: "Laptops", desc: "High-performance laptop configured for work, study and creative tasks.", price: 89999, stock: 8, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80" },
  { id: "product-pc", name: "CloudX Desktop PC", category: "Desktops", desc: "Custom desktop with balanced performance and a compact footprint.", price: 54999, stock: 4, image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80" },
  { id: "product-monitor", name: "ClearView Monitor", category: "Accessories", desc: "Sharp, responsive display for work, design and entertainment.", price: 24999, stock: 12, image: "https://images.unsplash.com/photo-1527445093-50dc189a2bf8?auto=format&fit=crop&w=900&q=80" },
];

export const SERVICES_DEMO = [
  { id: "service-repair", name: "Computer Repair", desc: "Diagnostics, component replacement and dependable system repair.", price: 999, cgst: 9, sgst: 9, image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80" },
  { id: "service-install", name: "Hardware Installation", desc: "Professional installation for desktops, laptops and peripherals.", price: 499, cgst: 9, sgst: 9, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80" },
];

export const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

export function useItems(type, fallback) {
  const [state, setState] = useState({ loading: true, items: [], demo: false });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`${Api.items}/active`);
        if (!response.ok) throw new Error("API unavailable");
        const payload = await response.json();
        const items = Array.isArray(payload)
          ? payload.filter((item) => item.type === type).map((item) => ({
              ...item,
              id: item.id,
              name: item.name,
              category: item.categoryName || item.category || "Uncategorized",
              desc: item.description || item.desc || "",
              price: item.rate ?? item.price ?? 0,
              stock: item.stock ?? 0,
              image: resolveImageUrl(item.imageUrl || item.image || ""),
              cgst: item.cgstPercentage ?? item.cgst ?? 0,
              sgst: item.sgstPercentage ?? item.sgst ?? 0,
            }))
          : [];
        if (active) setState({ loading: false, items, demo: false });
      } catch {
        if (active) setState(demo(fallback));
      }
    };
    load();
    return () => { active = false; };
  }, [type, fallback]);

  return state;
}

export async function sendInquiry(body) {
  const response = await fetch(Api.inquiries, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.detail || result.message || result.error || "Unable to send inquiry.");
  }
}