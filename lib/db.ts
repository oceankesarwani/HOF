import * as PrismaModule from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaModule.PrismaClient | undefined;
}

// Do not instantiate Prisma immediately because Turbopack 
// pre-evaluates modules in an Edge sandbox, causing crashes.
export const prisma = new Proxy({} as PrismaModule.PrismaClient, {
  get: (target, prop) => {
    if (!global.prisma) {
      global.prisma = new PrismaModule.PrismaClient({ log: ["query"] });
    }
    return (global.prisma as any)[prop];
  }
});
