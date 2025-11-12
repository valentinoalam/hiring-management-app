export const apiFetch = async (url: string, options?: RequestInit) => {
  // Don't automatically set Content-Type for FormData
  const headers: Record<string, string> = {};
  
  // Only set Content-Type to JSON if body is not FormData
  if (options?.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    headers: {
      ...headers,
      ...options?.headers,
    },
    ...options,
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};