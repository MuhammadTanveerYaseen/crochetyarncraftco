/**
 * Clean, lightweight GraphQL Client utility for Next.js app components.
 * Bypasses massive client bundles (Apollo/Urql) by wrapping native fetch.
 */
export async function graphqlRequest<T = any>(
  query: string, 
  variables: Record<string, any> = {}
): Promise<T> {
  const endpoint = '/api/graphql';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // Force Next.js dynamic behaviors
      cache: 'no-store'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GraphQL request failed: HTTP ${response.status} - ${text}`);
    }

    const json = await response.json();

    if (json.errors && json.errors.length > 0) {
      console.error('GraphQL validation/execution errors:', json.errors);
      throw new Error(json.errors[0].message || 'GraphQL query error occurred');
    }

    return json.data as T;
  } catch (error: any) {
    console.error('GraphQL query client wrapper error:', error);
    throw error;
  }
}

export default graphqlRequest;
