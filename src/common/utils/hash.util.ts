import * as bcrypt from 'bcrypt';

export class HashUtil {

  public static async hashText(text: string): Promise<string> {
    return bcrypt.hash(text, 10);
  }

  public static async compareHash(
    text: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(text, hashed);
  }
}
