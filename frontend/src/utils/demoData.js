const AGENTS_KEY = 'vital_gym_admin_agents';
const CONTRACTS_KEY = 'vital_gym_admin_contracts';

const sampleAgents = [
  {
    id: 1,
    username: 'alex.agent',
    full_name: 'Alex Morgan',
    email: 'alex.morgan@vitalgym.local',
    target_amount: 120000,
  },
  {
    id: 2,
    username: 'maya.nile',
    full_name: 'Maya Nile',
    email: 'maya.nile@vitalgym.local',
    target_amount: 180000,
  },
  {
    id: 3,
    username: 'mike.brown',
    full_name: 'Mike Brown',
    email: 'mike.brown@vitalgym.local',
    target_amount: 95000,
  },
];

const sampleContracts = [
  {
    id: 101,
    contract_code: 'VYT-101',
    member: { full_name: 'Zainab Yusuf' },
    sales_agent: { id: 1, full_name: 'Alex Morgan' },
    payment_method: 'Bank Transfer',
    amount: 420000,
    status: 'approved',
    created_at: '2026-06-03',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
  {
    id: 102,
    contract_code: 'VYT-102',
    member: { full_name: 'Amina Bala' },
    sales_agent: { id: 1, full_name: 'Alex Morgan' },
    payment_method: 'Cash',
    amount: 185000,
    status: 'pending',
    created_at: '2026-06-05',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
  {
    id: 103,
    contract_code: 'VYT-103',
    member: { full_name: 'Paul Okafor' },
    sales_agent: { id: 2, full_name: 'Maya Nile' },
    payment_method: 'POS',
    amount: 650000,
    status: 'approved',
    created_at: '2026-06-01',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
  {
    id: 104,
    contract_code: 'VYT-104',
    member: { full_name: 'Chioma Nwosu' },
    sales_agent: { id: 3, full_name: 'Mike Brown' },
    payment_method: 'Mobile Money',
    amount: 290000,
    status: 'pending',
    created_at: '2026-06-07',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
  {
    id: 105,
    contract_code: 'VYT-105',
    member: { full_name: 'Fatima Rahman' },
    sales_agent: { id: 2, full_name: 'Maya Nile' },
    payment_method: 'Bank Transfer',
    amount: 320000,
    status: 'rejected',
    created_at: '2026-05-28',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: 'Invalid payment reference',
  },
  {
    id: 106,
    contract_code: 'VYT-106',
    member: { full_name: 'Grace Adebayo' },
    sales_agent: { id: 2, full_name: 'Maya Nile' },
    payment_method: 'Bank Transfer',
    amount: 245000,
    status: 'approved',
    created_at: '2026-06-09',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
  {
    id: 107,
    contract_code: 'VYT-107',
    member: { full_name: 'Samuel Obi' },
    sales_agent: { id: 1, full_name: 'Alex Morgan' },
    payment_method: 'POS',
    amount: 128000,
    status: 'pending',
    created_at: '2026-06-11',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
  {
    id: 108,
    contract_code: 'VYT-108',
    member: { full_name: 'Rose Nkechi' },
    sales_agent: { id: 3, full_name: 'Mike Brown' },
    payment_method: 'Mobile Money',
    amount: 210000,
    status: 'approved',
    created_at: '2026-06-02',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
  {
    id: 109,
    contract_code: 'VYT-109',
    member: { full_name: 'Chinedu Emeka' },
    sales_agent: { id: 3, full_name: 'Mike Brown' },
    payment_method: 'Cash',
    amount: 98000,
    status: 'pending',
    created_at: '2026-06-12',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
  {
    id: 110,
    contract_code: 'VYT-110',
    member: { full_name: 'Aisha Bello' },
    sales_agent: { id: 1, full_name: 'Alex Morgan' },
    payment_method: 'Bank Transfer',
    amount: 320000,
    status: 'approved',
    created_at: '2026-06-08',
    payments: [{ receipt_url: 'https://via.placeholder.com/520x320/18181b/ffffff?text=Receipt' }],
    notes: '',
  },
];

function getStoredValue(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
}

export function loadDemoAgents() {
  return getStoredValue(AGENTS_KEY, sampleAgents);
}

export function saveDemoAgents(agents) {
  if (typeof window === 'undefined') return agents;
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
  return agents;
}

export function addDemoAgent(agent) {
  const agents = loadDemoAgents();
  const nextId = Math.max(0, ...agents.map((item) => item.id)) + 1;
  const newAgent = {
    id: nextId,
    username: agent.username,
    full_name: agent.full_name,
    email: agent.email || `${agent.username}@vitalgym.local`,
    target_amount: Number(agent.target_amount) || 0,
  };
  agents.push(newAgent);
  saveDemoAgents(agents);
  return newAgent;
}

export function updateDemoAgentTarget(agentId, targetAmount) {
  const agents = loadDemoAgents();
  const updated = agents.map((agent) => {
    if (agent.id === agentId) {
      return { ...agent, target_amount: Number(targetAmount) || 0 };
    }
    return agent;
  });
  saveDemoAgents(updated);
  return updated;
}

export function loadDemoContracts() {
  return getStoredValue(CONTRACTS_KEY, sampleContracts);
}

export function saveDemoContracts(contracts) {
  if (typeof window === 'undefined') return contracts;
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
  return contracts;
}

export function getPendingContracts() {
  return loadDemoContracts().filter((contract) => contract.status === 'pending');
}

export function approveDemoContract(contractId) {
  const contracts = loadDemoContracts();
  const updated = contracts.map((contract) => {
    if (contract.id === contractId) {
      return { ...contract, status: 'approved', notes: '' };
    }
    return contract;
  });
  saveDemoContracts(updated);
  return updated.find((contract) => contract.id === contractId);
}

export function rejectDemoContract(contractId, notes) {
  const contracts = loadDemoContracts();
  const updated = contracts.map((contract) => {
    if (contract.id === contractId) {
      return { ...contract, status: 'rejected', notes: notes || 'Rejected by admin' };
    }
    return contract;
  });
  saveDemoContracts(updated);
  return updated.find((contract) => contract.id === contractId);
}

export function filterDemoContracts(filters) {
  const contracts = loadDemoContracts();
  return contracts.filter((contract) => {
    const createdDate = new Date(contract.created_at);

    if (filters.from && new Date(filters.from) > createdDate) {
      return false;
    }

    if (filters.to && new Date(filters.to) < createdDate) {
      return false;
    }

    if (filters.agent_id && Number(filters.agent_id) !== contract.sales_agent.id) {
      return false;
    }

    if (filters.status && filters.status !== 'all' && filters.status !== contract.status) {
      return false;
    }

    return true;
  });
}

export function getAgentApprovedAmount(agentId) {
  return loadDemoContracts()
    .filter((contract) => contract.sales_agent.id === agentId && contract.status === 'approved')
    .reduce((sum, contract) => sum + contract.amount, 0);
}

export function getAgentPendingCount(agentId) {
  return loadDemoContracts().filter((contract) => contract.sales_agent.id === agentId && contract.status === 'pending').length;
}

export function getTotalApprovedRevenue() {
  return loadDemoContracts()
    .filter((contract) => contract.status === 'approved')
    .reduce((sum, contract) => sum + contract.amount, 0);
}

export function getTotalPendingCount() {
  return getPendingContracts().length;
}
