// @ts-ignore
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["query"],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Tactical Lazy Proxy: Defers instantiation until real runtime access
export const prisma = new Proxy({} as any, {
  get: (target, prop) => {
    if (!globalThis.prisma) {
      globalThis.prisma = prismaClientSingleton();
    }
    return (globalThis.prisma as any)[prop];
  }
}) as ReturnType<typeof prismaClientSingleton>;
