import * as argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

export async function hashPin(pin: string): Promise<string> {
  return argon2.hash(pin, ARGON2_OPTIONS);
}

export async function verifyPin(
  pin: string,
  pinHash: string,
): Promise<boolean> {
  try {
    return await argon2.verify(pinHash, pin);
  } catch {
    return false;
  }
}
