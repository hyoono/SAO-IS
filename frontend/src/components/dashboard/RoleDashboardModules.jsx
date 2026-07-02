import { useDashboardSummary } from '../../hooks/useDashboard'
import { Link } from 'react-router-dom'

const ROLE_MODULES = {
  admin: {
    header: 'System Control Center',
    description: 'Oversee platform configuration, users, and compliance visibility.',
    cards: [
      {
        title: 'User Administration',
        detail: 'Create accounts, assign roles, and review account activity.',
      },
      {
        title: 'Workflow Templates',
        detail: 'Maintain approval chains and enforce document policies.',
        path: '/workflows',
      },
      {
        title: 'Audit Oversight',
        detail: 'Monitor sensitive actions and investigate anomalies quickly.',
        path: '/audit-logs',
      },
    ],
  },
  staff: {
    header: 'Operations Queue',
    description: 'Process incoming records and keep approval lanes moving.',
    cards: [
      {
        title: 'Pending Reviews',
        detail: 'Prioritize newly submitted documents by request urgency.',
        path: '/approvals',
      },
      {
        title: 'Approval Actions',
        detail: 'Approve, reject, or request revisions with clear notes.',
        path: '/approvals',
      },
      {
        title: 'Daily Follow-ups',
        detail: 'Track unresolved cases and send reminders to stakeholders.',
        path: '/notifications',
      },
    ],
  },
  org_officer: {
    header: 'Organization Workspace',
    description: 'Prepare submissions and monitor organization requirements.',
    cards: [
      {
        title: 'Accreditation Packet',
        detail: 'Upload and maintain required files for org accreditation.',
        path: '/submit',
      },
      {
        title: 'Event Requests',
        detail: 'Submit permits and monitor reviewer feedback in one place.',
        path: '/submit',
      },
      {
        title: 'Compliance Timeline',
        detail: 'Stay ahead of deadlines and missing documentary items.',
        path: '/documents',
      },
    ],
  },
  student: {
    header: 'Student Request Hub',
    description: 'Submit documents and monitor approval progress with clarity.',
    cards: [
      {
        title: 'Clearance Submission',
        detail: 'Start new requests and attach supporting materials securely.',
        path: '/submit',
      },
      {
        title: 'Status Tracking',
        detail: 'See where each request sits in the review pipeline.',
        path: '/documents',
      },
      {
        title: 'Action Needed',
        detail: 'Resolve reviewer comments before deadlines are missed.',
        path: '/notifications',
      },
    ],
  },
  faculty: {
    header: 'Faculty Endorsements',
    description: 'Handle assigned endorsements and route decisions quickly.',
    cards: [
      {
        title: 'Assigned Endorsements',
        detail: 'Review requests delegated to your academic unit.',
        path: '/approvals',
      },
      {
        title: 'Decision Log',
        detail: 'Record endorsement outcomes with contextual notes.',
        path: '/approvals',
      },
      {
        title: 'Pending Follow-up',
        detail: 'Respond to clarifications and keep workflows unblocked.',
        path: '/notifications',
      },
    ],
  },
}

function resolveModulePath(role, title) {
  const loweredTitle = (title || '').toLowerCase()

  if (loweredTitle.includes('workflow')) {
    return '/workflows'
  }

  if (loweredTitle.includes('audit')) {
    return '/audit-logs'
  }

  if (loweredTitle.includes('notification')) {
    return '/notifications'
  }

  if (loweredTitle.includes('review') || loweredTitle.includes('endorsement') || loweredTitle.includes('awaiting info')) {
    return '/approvals'
  }

  if (loweredTitle.includes('request') || loweredTitle.includes('document') || loweredTitle.includes('compliance') || loweredTitle.includes('progress')) {
    return '/documents'
  }

  return ROLE_MODULES[role]?.cards.find((card) => card.title === title)?.path
}

function ModuleCard({ title, detail, path }) {
  return (
    <div className="rounded-xl border border-[var(--th-border)] bg-[var(--th-card-bg)] p-4">
      <p className="text-sm font-semibold text-[var(--th-text)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--th-text-secondary)]">{detail}</p>
      {path ? (
        <Link
          to={path}
          className="mt-4 inline-flex items-center rounded-lg border border-[var(--th-btn-success-border)] bg-[var(--th-btn-success-bg)] px-3 py-1.5 text-xs font-medium text-[var(--th-btn-success-text)] hover:bg-[var(--th-btn-success-hover)]"
        >
          Open module
        </Link>
      ) : (
        <button
          type="button"
          className="mt-4 inline-flex items-center rounded-lg border border-[var(--th-btn-primary-border)] bg-[var(--th-btn-primary-bg)] px-3 py-1.5 text-xs font-medium text-[var(--th-btn-primary-text)]"
        >
          Coming soon in Phase 2
        </button>
      )}
    </div>
  )
}

export default function RoleDashboardModules({ role }) {
  const { data, isLoading, isError } = useDashboardSummary()
  const moduleConfig = ROLE_MODULES[role]

  if (!moduleConfig) {
    return null
  }

  const apiModules = data?.modules
  const cards = Array.isArray(apiModules) && apiModules.length > 0
    ? apiModules.map((entry) => ({
      title: entry.title,
      detail: `${entry.detail} Current value: ${entry.value}.`,
      path: resolveModulePath(role, entry.title),
    }))
    : moduleConfig.cards

  return (
    <section className="mt-8 rounded-2xl border border-[var(--th-section-border)] bg-[var(--th-section-bg)] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--th-section-label)]">Role Modules</p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--th-text)]">{moduleConfig.header}</h2>
      <p className="mt-1 text-sm text-[var(--th-section-desc)]">{moduleConfig.description}</p>

      {isLoading && (
        <p className="mt-4 text-sm text-[var(--th-loading-text)]">Loading live dashboard metrics...</p>
      )}

      {isError && (
        <p className="mt-4 text-sm text-[var(--th-btn-warning-text)]">Live metrics unavailable. Showing static role modules.</p>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <ModuleCard key={card.title} title={card.title} detail={card.detail} path={card.path} />
        ))}
      </div>
    </section>
  )
}
