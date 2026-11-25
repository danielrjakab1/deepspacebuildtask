import type { CollectionSchema } from 'deepspace/schema'

export const photoAnalysesSchema: CollectionSchema = {
  name: 'photo-analyses',
  columns: [
    { name: 'fileName', storage: 'text', interpretation: 'plain', required: true },
    { name: 'score', storage: 'number', interpretation: 'plain', required: true },
    { name: 'label', storage: 'text', interpretation: 'plain', required: true },
    { name: 'topLabel', storage: 'text', interpretation: 'plain', required: true },
    { name: 'confidence', storage: 'number', interpretation: 'plain', required: true },
    { name: 'brightness', storage: 'number', interpretation: 'plain', required: true },
    { name: 'contrast', storage: 'number', interpretation: 'plain', required: true },
    { name: 'saturation', storage: 'number', interpretation: 'plain', required: true },
    { name: 'edgeDensity', storage: 'number', interpretation: 'plain', required: true },
    { name: 'desiredAdjectives', storage: 'text', interpretation: 'plain', required: false },
  ],
  permissions: {
    member: { read: 'own', create: 'own', update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
