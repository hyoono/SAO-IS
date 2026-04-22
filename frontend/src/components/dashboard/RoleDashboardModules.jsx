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
      },
      {
        title: 'Audit Oversight',
        detail: 'Monitor sensitive actions and investigate anomalies quickly.',
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
      },
      {
        title: 'Approval Actions',
        detail: 'Approve, reject, or request revisions with clear notes.',
      },
      {
        title: 'Daily Follow-ups',
        detail: 'Track unresolved cases and send reminders to stakeholders.',
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
      },
      {
        title: 'Event Requests',
        detail: 'Submit permits and monitor reviewer feedback in one place.',
      },
      {
        title: 'Compliance Timeline',
        detail: 'Stay ahead of deadlines and missing documentary items.',
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
      },
      {
        title: 'Status Tracking',
        detail: 'See where each request sits in the review pipeline.',
      },
      {
        title: 'Action Needed',
        detail: 'Resolve reviewer comments before deadlines are missed.',
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
      },
      {
        title: 'Decision Log',
        detail: 'Record endorsement outcomes with contextual notes.',
      },
      {
        title: 'Pending Follow-up',
        detail: 'Respond to clarifications and keep workflows unblocked.',
      },
    ],
  },
}

function ModuleCard({ title, detail }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
      <button
        type="button"
        className="mt-4 inline-flex items-center rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200"
      >
        Coming soon in Phase 2
      </button>
    </div>
  )
}

export default function RoleDashboardModules({ role }) {
  const moduleConfig = ROLE_MODULES[role]

  if (!moduleConfig) {
    return null
  }

  return (
    <section className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">Role Modules</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{moduleConfig.header}</h2>
      <p className="mt-1 text-sm text-blue-100/80">{moduleConfig.description}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {moduleConfig.cards.map((card) => (
          <ModuleCard key={card.title} title={card.title} detail={card.detail} />
        ))}
      </div>
    </section>
  )
}
