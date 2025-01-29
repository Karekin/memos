interface RequestOptions {
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
}

export const request = async <T>(options: RequestOptions): Promise<T> => {
  const { url, method, data, headers = {} } = options;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
}; 