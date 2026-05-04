import { z } from 'zod';
import { 
  insertFamilySchema, 
  insertMedicationFullSchema, 
  families, 
  medications, 
  medicationCatalog, 
  users, 
  logs, 
  loginSchema,
  insertLogSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    user: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, 'password'>>(),
        401: errorSchemas.notFound,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: loginSchema,
      responses: {
        200: z.custom<Omit<typeof users.$inferSelect, 'password'>>(),
        401: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  families: {
    list: {
      method: 'GET' as const,
      path: '/api/families',
      responses: {
        200: z.array(z.custom<typeof families.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/families',
      input: insertFamilySchema,
      responses: {
        201: z.custom<typeof families.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/families/:id',
      responses: {
        200: z.custom<typeof families.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/families/:id',
      input: insertFamilySchema.partial(),
      responses: {
        200: z.custom<typeof families.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/families/:id',
      responses: {
        204: z.void(),
        400: errorSchemas.internal,
      },
    },
  },
  medications: {
    list: {
      method: 'GET' as const,
      path: '/api/medications',
      input: z.object({
        search: z.string().optional(),
        familyId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof medications.$inferSelect & { catalog: typeof medicationCatalog.$inferSelect; family?: typeof families.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/medications/:id',
      responses: {
        200: z.custom<typeof medications.$inferSelect & { catalog: typeof medicationCatalog.$inferSelect; family?: typeof families.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/medications',
      input: insertMedicationFullSchema,
      responses: {
        201: z.custom<typeof medications.$inferSelect & { catalog: typeof medicationCatalog.$inferSelect }>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/medications/:id',
      input: insertMedicationFullSchema.partial(),
      responses: {
        200: z.custom<typeof medications.$inferSelect & { catalog: typeof medicationCatalog.$inferSelect }>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    patch: {
      method: 'PATCH' as const,
      path: '/api/medications/:id',
      input: insertMedicationFullSchema.partial(),
      responses: {
        200: z.custom<typeof medications.$inferSelect & { catalog: typeof medicationCatalog.$inferSelect }>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/medications/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    import: {
      method: 'POST' as const,
      path: '/api/medications/import',
      input: z.array(z.any()),
      responses: {
        200: z.object({ message: z.string(), count: z.number() }),
        400: errorSchemas.validation,
      },
    },
    deleteAll: {
      method: 'DELETE' as const,
      path: '/api/medications/all',
      responses: {
        200: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      responses: {
        200: z.array(z.custom<typeof logs.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/logs',
      input: insertLogSchema,
      responses: {
        201: z.custom<typeof logs.$inferSelect>(),
      },
    },
  },
  inventory: {
    stats: {
      method: 'GET' as const,
      path: '/api/inventory/stats',
      responses: {
        200: z.object({
          totalProducts: z.number(),
          lowStock: z.number(),
          outOfStock: z.number(),
          totalItems: z.number(),
        }),
      },
    },
    chat: {
      method: 'POST' as const,
      path: '/api/inventory/chat',
      input: z.object({
        prompt: z.string().min(1),
      }),
      responses: {
        200: z.object({ answer: z.string() }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
