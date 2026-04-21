import { useAuth } from '../../hooks/useAuth'

/**
 * Renders children only if the current user's role is in the allowed list.
 *
 * @param {Object} props
 * @param {string[]} props.allowed - Array of role strings permitted to see the children.
 * @param {React.ReactNode} props.children - Content to render if role matches.
 * @param {React.ReactNode} [props.fallback=null] - Content to render if role doesn't match.
 */
export default function RoleGuard({ allowed, children, fallback = null }) {
  const { role } = useAuth()

  if (!role || !allowed.includes(role)) {
    return fallback
  }

  return children
}
