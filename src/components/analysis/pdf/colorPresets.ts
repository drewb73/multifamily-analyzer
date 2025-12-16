// src/components/analysis/pdf/colorPresets.ts

export interface ColorPreset {
  name: string
  bg: string
  text: string
  accent: string
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Professional Blue',
    bg: '#1E40AF',
    text: '#FFFFFF',
    accent: '#3B82F6'
  },
  {
    name: 'Success Green',
    bg: '#059669',
    text: '#FFFFFF',
    accent: '#10B981'
  },
  {
    name: 'Executive Red',
    bg: '#DC2626',
    text: '#FFFFFF',
    accent: '#EF4444'
  },
  {
    name: 'Royal Purple',
    bg: '#7C3AED',
    text: '#FFFFFF',
    accent: '#8B5CF6'
  },
  {
    name: 'Modern Dark',
    bg: '#1F2937',
    text: '#FFFFFF',
    accent: '#6B7280'
  },
  {
    name: 'Clean Light',
    bg: '#F3F4F6',
    text: '#1F2937',
    accent: '#E5E7EB'
  },
  {
    name: 'Teal Fresh',
    bg: '#0D9488',
    text: '#FFFFFF',
    accent: '#14B8A6'
  },
  {
    name: 'Orange Bold',
    bg: '#EA580C',
    text: '#FFFFFF',
    accent: '#F97316'
  }
]