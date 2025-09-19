// Sample TypeScript file for testing duplicate detection
export interface User {
  id: string;
  name: string;
  email: string;
}

export function createUser(name: string, email: string): User {
  return {
    id: Math.random().toString(36),
    name,
    email
  };
}