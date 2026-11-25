/**
 * Navigation Config
 *
 * Add one entry per nav item. Routes are handled by generouted
 * (file-based routing in src/pages/), this just controls what
 * appears in the navigation bar.
 */

import type { Role } from './constants'

export interface NavItem {
  path: string
  label: string
  roles?: Role[]
  devOnly?: boolean
}

export const nav: NavItem[] = [
  { path: '/home', label: 'Photo Studio' },
  // /settings remains available but is not shown in this focused prototype.
  // Add `{ path: '/settings', label: 'Settings' }` to restore it.
  // ── Features add nav items below this line ──
  { path: '/assistant', label: 'AI Chat', roles: ['member' as Role] },
]
