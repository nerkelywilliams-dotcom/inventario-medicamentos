import { z } from 'zod';
import { insertFamilySchema, insertMedicationSchema, families, medications } from './schema';

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
    }
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
        200: z.array(z.custom<typeof medications.$inferSelect & { family?: typeof families.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/medications/:id',
      responses: {
        200: z.custom<typeof medications.$inferSelect & { family?: typeof families.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/medications',
      input: insertMedicationSchema,
      responses: {
        201: z.custom<typeof medications.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/medications/:id',
      input: insertMedicationSchema.partial(),
      responses: {
        200: z.custom<typeof medications.$inferSelect>(),
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
