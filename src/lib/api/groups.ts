// src/lib/api/groups.ts
/**
 * API Helper functions for AnalysisGroup operations
 */

export interface CreateGroupParams {
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateGroupParams {
  name?: string
  description?: string
  color?: string
  icon?: string
  sortOrder?: number
}

export interface Group {
  id: string
  userId: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  sortOrder: number
  analysisCount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Fetch all groups for the current user
 */
export async function fetchGroups(): Promise<{ groups: Group[] }> {
  const response = await fetch('/api/groups')

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch groups')
  }

  return response.json()
}

/**
 * Create a new group
 */
export async function createGroup(params: CreateGroupParams): Promise<{ group: Group }> {
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create group')
  }

  return response.json()
}

/**
 * Update a group
 */
export async function updateGroup(
  id: string,
  params: UpdateGroupParams
): Promise<{ group: Group }> {
  const response = await fetch(`/api/groups/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update group')
  }

  return response.json()
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/groups/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete group')
  }

  return response.json()
}

/**
 * Get a single group
 */
export async function getGroup(id: string): Promise<{ group: Group }> {
  const response = await fetch(`/api/groups/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch group')
  }

  return response.json()
}

/**
 * Predefined colors for groups
 */
export const GROUP_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Cyan', value: '#06B6D4' },
]

/**
 * Icon options for groups (lucide-react icon names)
 */
export const GROUP_ICONS = [
  'Folder',
  'Building',
  'TrendingUp',
  'DollarSign',
  'Target',
  'Star',
  'Home',
  'Briefcase',
  'PieChart',
  'BarChart',
  'LineChart',
  'Package',
]