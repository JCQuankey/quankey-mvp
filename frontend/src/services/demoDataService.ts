import { VaultEntry } from './vaultService';

/**
 * Demo Data Service for Investor Presentations
 * 
 * Provides realistic sample data showcasing Quankey's capabilities
 * Demonstrates quantum vs traditional password security
 */

export interface DemoPassword {
  title: string;
  website: string;
  username: string;
  password: string;
  category: string;
  isQuantum: boolean;
  notes?: string;
  entropy?: string;
  createdDaysAgo?: number;
  updatedDaysAgo?: number;
  strengthScore?: number;
}

// Realistic demo passwords showcasing different security levels
export const DEMO_PASSWORDS: DemoPassword[] = [
  // Quantum-Protected High-Security Accounts
  {
    title: "Defense Contractor Portal",
    website: "portal.defense-corp.mil",
    username: "ciso.johnson@defense-corp.mil",
    password: "Q#7mN$pL9@xR2wK5^bH3&vF8*zC4!jD6",
    category: "Defense",
    isQuantum: true,
    notes: "NIST 800-171 compliant, quantum-resistant encryption",
    entropy: "ANU QRNG (Quantum Vacuum)",
    createdDaysAgo: 15,
    updatedDaysAgo: 2,
    strengthScore: 100
  },
  {
    title: "NATO Secure Comms",
    website: "secure.nato.int",
    username: "ops-commander@nato.int",
    password: "Ω∆∂7ηφ9Ψ$κλ3&μν5@πρ2σ#τυ8χ!ωΞ4",
    category: "Defense",
    isQuantum: true,
    notes: "Top Secret clearance required",
    entropy: "IBM Quantum Network",
    createdDaysAgo: 45,
    updatedDaysAgo: 7,
    strengthScore: 100
  },
  {
    title: "Healthcare HIPAA System",
    website: "ehr.medical-center.org",
    username: "dr.smith@medical-center.org",
    password: "Hx9#Qm7@Rn4$Kp2&Ws6!Yt3^Zb8*Lc5",
    category: "Healthcare",
    isQuantum: true,
    notes: "Patient data access - HIPAA compliant",
    entropy: "Cloudflare drand beacon",
    createdDaysAgo: 30,
    updatedDaysAgo: 5,
    strengthScore: 98
  },
  {
    title: "Bank of America Corporate",
    website: "corporate.bankofamerica.com",
    username: "treasury.dept@bofa.com",
    password: "BΦ4@κ7#λ9$μ2&ν5!ρ3^σ8*τ6ω1Ψ0Ξ",
    category: "Financial",
    isQuantum: true,
    notes: "Wire transfer authorization",
    entropy: "Intel RDRAND + Von Neumann",
    createdDaysAgo: 60,
    updatedDaysAgo: 14,
    strengthScore: 99
  },
  {
    title: "AWS Root Account",
    website: "console.aws.amazon.com",
    username: "admin@techcorp.com",
    password: "Λ7#Σ4@Π9$Θ2&Δ5!Γ3^Ω8*Φ6Ψ1Ξ0",
    category: "Cloud Infrastructure",
    isQuantum: true,
    notes: "Production environment - critical",
    entropy: "Multi-source quantum",
    createdDaysAgo: 90,
    updatedDaysAgo: 21,
    strengthScore: 100
  },

  // Traditional Passwords (Vulnerable)
  {
    title: "Gmail Personal",
    website: "gmail.com",
    username: "john.doe@gmail.com",
    password: "MyPassword123!",
    category: "Email",
    isQuantum: false,
    notes: "Personal email - needs upgrade",
    createdDaysAgo: 180,
    updatedDaysAgo: 180,
    strengthScore: 45
  },
  {
    title: "Facebook",
    website: "facebook.com",
    username: "johndoe@email.com",
    password: "Facebook2024!",
    category: "Social Media",
    isQuantum: false,
    notes: "Social account",
    createdDaysAgo: 365,
    updatedDaysAgo: 200,
    strengthScore: 40
  },
  {
    title: "Netflix Family",
    website: "netflix.com",
    username: "family@email.com",
    password: "NetflixWatch123",
    category: "Entertainment",
    isQuantum: false,
    notes: "Shared family account",
    createdDaysAgo: 270,
    updatedDaysAgo: 270,
    strengthScore: 35
  },
  {
    title: "LinkedIn Professional",
    website: "linkedin.com",
    username: "professional@email.com",
    password: "LinkedIn2024Pro!",
    category: "Professional",
    isQuantum: false,
    notes: "Professional networking",
    createdDaysAgo: 150,
    updatedDaysAgo: 95,
    strengthScore: 50
  },
  {
    title: "GitHub Developer",
    website: "github.com",
    username: "developer",
    password: "GitHubDev2024!@#",
    category: "Development",
    isQuantum: false,
    notes: "Code repositories",
    createdDaysAgo: 120,
    updatedDaysAgo: 45,
    strengthScore: 60
  },

  // Mixed Security Levels
  {
    title: "Microsoft 365 Business",
    website: "office365.com",
    username: "admin@company.com",
    password: "M$365BizAdmin2024!@#$",
    category: "Business",
    isQuantum: false,
    notes: "Company email and documents",
    createdDaysAgo: 75,
    updatedDaysAgo: 30,
    strengthScore: 65
  },
  {
    title: "Salesforce CRM",
    website: "salesforce.com",
    username: "sales.manager@company.com",
    password: "SF*crm2024$Team#Lead",
    category: "Business",
    isQuantum: false,
    notes: "Customer database access",
    createdDaysAgo: 90,
    updatedDaysAgo: 15,
    strengthScore: 70
  },
  {
    title: "PayPal Business",
    website: "paypal.com",
    username: "finance@company.com",
    password: "PayPal$Biz2024!Secure",
    category: "Financial",
    isQuantum: false,
    notes: "Payment processing",
    createdDaysAgo: 100,
    updatedDaysAgo: 60,
    strengthScore: 55
  },
  {
    title: "Zoom Enterprise",
    website: "zoom.us",
    username: "meetings@company.com",
    password: "ZoomEnt#2024Meet!",
    category: "Communication",
    isQuantum: false,
    notes: "Video conferencing",
    createdDaysAgo: 45,
    updatedDaysAgo: 10,
    strengthScore: 58
  },
  {
    title: "Dropbox Team",
    website: "dropbox.com",
    username: "storage@company.com",
    password: "DropBox#Team2024!",
    category: "Storage",
    isQuantum: false,
    notes: "File sharing and backup",
    createdDaysAgo: 200,
    updatedDaysAgo: 100,
    strengthScore: 52
  }
];

/**
 * Generate demo vault entries from demo passwords
 */
export const generateDemoEntries = (): VaultEntry[] => {
  const now = new Date();
  
  return DEMO_PASSWORDS.map((demo, index) => {
    const createdAt = new Date(now.getTime() - (demo.createdDaysAgo || 30) * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(now.getTime() - (demo.updatedDaysAgo || 7) * 24 * 60 * 60 * 1000);
    
    return {
      id: `demo-${Date.now()}-${index}`,
      title: demo.title,
      website: demo.website,
      username: demo.username,
      password: demo.password,
      category: demo.category,
      isQuantum: demo.isQuantum,
      notes: demo.notes || '',
      entropy: demo.entropy || (demo.isQuantum ? 'Quantum-generated' : 'Traditional'),
      createdAt,
      updatedAt
    };
  });
};

/**
 * Security comparison data for demonstrations
 */
export const SECURITY_COMPARISON = {
  traditional: {
    averageCrackTime: "< 24 hours",
    quantumComputerTime: "< 1 second",
    vulnerabilities: [
      "Pattern-based attacks",
      "Dictionary attacks",
      "Rainbow tables",
      "Quantum algorithms (Shor's, Grover's)"
    ],
    riskLevel: "CRITICAL"
  },
  quantum: {
    averageCrackTime: "∞ (Mathematically Impossible)",
    quantumComputerTime: "∞ (Quantum-Resistant)",
    advantages: [
      "True random entropy from quantum sources",
      "NIST post-quantum cryptography",
      "ML-KEM-768 encryption",
      "ML-DSA-65 signatures"
    ],
    riskLevel: "SECURE"
  }
};

/**
 * Demo statistics for dashboard
 */
export const generateDemoStats = () => {
  const quantumCount = DEMO_PASSWORDS.filter(p => p.isQuantum).length;
  const traditionalCount = DEMO_PASSWORDS.filter(p => !p.isQuantum).length;
  const weakCount = DEMO_PASSWORDS.filter(p => (p.strengthScore || 0) < 60).length;
  const oldCount = DEMO_PASSWORDS.filter(p => (p.updatedDaysAgo || 0) > 90).length;
  
  return {
    totalPasswords: DEMO_PASSWORDS.length,
    quantumProtected: quantumCount,
    traditionalVulnerable: traditionalCount,
    weakPasswords: weakCount,
    needingUpdate: oldCount,
    securityScore: Math.round((quantumCount / DEMO_PASSWORDS.length) * 100),
    categories: Array.from(new Set(DEMO_PASSWORDS.map(p => p.category))).length,
    averageAge: Math.round(
      DEMO_PASSWORDS.reduce((sum, p) => sum + (p.updatedDaysAgo || 0), 0) / DEMO_PASSWORDS.length
    )
  };
};

/**
 * Clear demo data from vault
 */
export const clearDemoData = (entries: VaultEntry[]): VaultEntry[] => {
  return entries.filter(entry => !entry.id.startsWith('demo-'));
};

/**
 * Check if demo data is loaded
 */
export const isDemoDataLoaded = (entries: VaultEntry[]): boolean => {
  return entries.some(entry => entry.id.startsWith('demo-'));
};