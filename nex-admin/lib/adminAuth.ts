export function getAdminToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
  }
  return null;
}

export function setAdminToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function removeAdminToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}
