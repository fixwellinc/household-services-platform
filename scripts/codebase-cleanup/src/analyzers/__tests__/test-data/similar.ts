// Similar file with minor differences (extra comment and whitespace)
export interface User {
  id: string;
  name: string;
  email: string;
  // Added comment here
}

export function createUser(name: string, email: string): User {
  return {
    id: Math.random().toString(36),
    name,
    email
  };
}

// Extra function to make it slightly different
export function validateUser(user: User): boolean {
  return user.name.length > 0 && user.email.includes('@');
}