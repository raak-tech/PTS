export type AssignmentLink = {
  id: string;
  clientName: string;
  linkedAt: string;
};

export type AuditEvent = {
  id: string;
  kind: 'invite-generated' | 'linked' | 'unlinked';
  detail: string;
  at: string;
};

export type ProviderAssignmentState = {
  inviteCode: string;
  links: AssignmentLink[];
  auditTrail: AuditEvent[];
  autoAssignmentEnabled: boolean;
};

export const PROVIDER_ASSIGNMENT_STORAGE_KEY = 'pts.provider.assignment.v1';
const CHANGE_EVENT = 'pts-provider-assignment-change';

function nowIso() {
  return new Date().toISOString();
}

function randomCode() {
  return `PTS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function createAuditEvent(kind: AuditEvent['kind'], detail: string): AuditEvent {
  return {
    id: `${kind}-${Math.random().toString(16).slice(2)}`,
    kind,
    detail,
    at: nowIso(),
  };
}

export function createDefaultAssignmentState(): ProviderAssignmentState {
  return {
    inviteCode: 'PTS-START',
    links: [],
    auditTrail: [],
    autoAssignmentEnabled: false,
  };
}

export function generateNextInviteCode(): string {
  return randomCode();
}

export function readAssignmentStateSnapshot(): string {
  if (typeof window === 'undefined') {
    return JSON.stringify(createDefaultAssignmentState());
  }

  return window.localStorage.getItem(PROVIDER_ASSIGNMENT_STORAGE_KEY) ?? JSON.stringify(createDefaultAssignmentState());
}

export function readAssignmentState(): ProviderAssignmentState {
  try {
    return JSON.parse(readAssignmentStateSnapshot()) as ProviderAssignmentState;
  } catch {
    return createDefaultAssignmentState();
  }
}

export function writeAssignmentState(state: ProviderAssignmentState) {
  window.localStorage.setItem(PROVIDER_ASSIGNMENT_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToAssignmentStateChange(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function rotateInviteCode(state: ProviderAssignmentState): ProviderAssignmentState {
  const inviteCode = generateNextInviteCode();

  return {
    inviteCode,
    links: [],
    auditTrail: [createAuditEvent('invite-generated', `Generated a fresh invite code ${inviteCode}`)],
    autoAssignmentEnabled: state.autoAssignmentEnabled,
  };
}

export function linkClientIfCodeMatches(
  state: ProviderAssignmentState,
  inviteCode: string,
  clientName: string
): { state: ProviderAssignmentState; error?: string } {
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  const normalizedClientName = clientName.trim();

  if (!normalizedInviteCode || !normalizedClientName) {
    return { state, error: 'Enter both an invite code and a client name.' };
  }

  if (normalizedInviteCode !== state.inviteCode.toUpperCase()) {
    return { state, error: 'That invite code is not active yet.' };
  }

  const linkedAt = nowIso();
  const nextState: ProviderAssignmentState = {
    ...state,
    links: [
      ...state.links,
      {
        id: `${normalizedClientName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(16).slice(2, 8)}`,
        clientName: normalizedClientName,
        linkedAt,
      },
    ],
    auditTrail: [
      createAuditEvent('linked', `Linked ${normalizedClientName} with invite code ${state.inviteCode}`),
      ...state.auditTrail,
    ],
  };

  return { state: nextState };
}

export function unlinkClient(
  state: ProviderAssignmentState,
  clientId: string
): ProviderAssignmentState {
  const client = state.links.find((entry) => entry.id === clientId);

  if (!client) {
    return state;
  }

  return {
    ...state,
    links: state.links.filter((entry) => entry.id !== clientId),
    auditTrail: [
      createAuditEvent('unlinked', `Unlinked ${client.clientName} from invite code ${state.inviteCode}`),
      ...state.auditTrail,
    ],
  };
}

export function formatUtcTimestamp(isoTimestamp: string): string {
  return `${isoTimestamp.slice(0, 16).replace('T', ' ')} UTC`;
}
