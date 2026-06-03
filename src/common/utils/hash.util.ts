import * as bcrypt from 'bcrypt';

export async function hashText(text: string): Promise<string> {
  return bcrypt.hash(text, 10);
}

export async function compareHash(
  text: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(text, hashed);
}
