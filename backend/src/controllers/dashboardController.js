// backend/src/controllers/dashboardController.js

/**
 * PATENT-CRITICAL: Dashboard Controller
 * Quantum Security Analytics and User Insights
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * PATENT-CRITICAL: Get Dashboard Statistics
 * Provides quantum-aware security metrics
 */
const getStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`[DASHBOARD-STATS] Getting stats for user ${userId}`);

    // Get password statistics
    const passwords = await prisma.password.findMany({
      where: { userId: userId },
      select: {
        id: true,
        strength: true,
        isQuantum: true,
        quantumSource: true,
        category: true,
        createdAt: true,
        lastUsed: true,
        isFavorite: true
      }
    });

    // Calculate quantum metrics
    const totalPasswords = passwords.length;
    const quantumPasswords = passwords.filter(p => p.isQuantum).length;
    const quantumPercentage = totalPasswords > 0 ? Math.round((quantumPasswords / totalPasswords) * 100) : 0;

    // Strength analysis
    const strengthStats = {
      strong: passwords.filter(p => p.strength >= 80).length,
      medium: passwords.filter(p => p.strength >= 50 && p.strength < 80).length,
      weak: passwords.filter(p => p.strength < 50).length
    };

    // Category breakdown
    const categoryStats = {};
    passwords.forEach(p => {
      const category = p.category || 'General';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    // Recent activity
    const recentPasswords = passwords
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Get recovery status
    const recoveryKits = await prisma.recoveryKit.findMany({
      where: {
        userId: userId,
        isActive: true
      }
    });

    const stats = {
      passwords: {
        total: totalPasswords,
        quantum: quantumPasswords,
        quantumPercentage: quantumPercentage,
        favorites: passwords.filter(p => p.isFavorite).length
      },
      security: {
        strength: strengthStats,
        quantumAdvantage: quantumPasswords > 0 ? 'Your quantum passwords are resistant to quantum computer attacks' : 'Generate quantum passwords for maximum security'
      },
      categories: categoryStats,
      recovery: {
        hasRecovery: recoveryKits.length > 0,
        kitsActive: recoveryKits.length,
        quantumRecovery: recoveryKits.some(k => k.type === 'QUANTUM_SHAMIR')
      },
      activity: {
        recentPasswords: recentPasswords.map(p => ({
          id: p.id,
          site: 'Protected', // Don't expose site names in stats
          isQuantum: p.isQuantum,
          created: p.createdAt
        }))
      }
    };

    res.json({
      success: true,
      stats: stats,
      quantumCertification: 'Quankey Quantum Security Active'
    });

  } catch (error) {
    console.error('[DASHBOARD-STATS-ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics'
    });
  }
};

/**
 * PATENT-CRITICAL: Get Security Recommendations
 * AI-powered quantum security recommendations
 */
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`[DASHBOARD-RECOMMENDATIONS] Getting recommendations for user ${userId}`);

    // Get user passwords for analysis
    const passwords = await prisma.password.findMany({
      where: { userId: userId },
      select: {
        strength: true,
        isQuantum: true,
        createdAt: true,
        lastUsed: true
      }
    });

    // Get recovery status
    const hasRecovery = await prisma.recoveryKit.count({
      where: {
        userId: userId,
        isActive: true
      }
    }) > 0;

    const recommendations = [];

    // Quantum upgrade recommendations
    const nonQuantumCount = passwords.filter(p => !p.isQuantum).length;
    if (nonQuantumCount > 0) {
      recommendations.push({
        type: 'quantum_upgrade',
        priority: 'high',
        title: 'Upgrade to Quantum Security',
        description: `You have ${nonQuantumCount} passwords that could benefit from quantum generation`,
        action: 'Generate new quantum passwords to replace weak ones',
        quantumAdvantage: 'Quantum passwords are resistant to attacks from quantum computers'
      });
    }

    // Weak password recommendations
    const weakCount = passwords.filter(p => p.strength < 50).length;
    if (weakCount > 0) {
      recommendations.push({
        type: 'weak_passwords',
        priority: 'high',
        title: 'Strengthen Weak Passwords',
        description: `${weakCount} passwords are below recommended strength`,
        action: 'Replace weak passwords with quantum-generated strong passwords'
      });
    }

    // Recovery recommendation
    if (!hasRecovery) {
      recommendations.push({
        type: 'recovery_setup',
        priority: 'critical',
        title: 'Set Up Quantum Recovery',
        description: 'Protect your account with quantum-secured recovery shares',
        action: 'Generate a recovery kit to enable password-free account recovery',
        quantumAdvantage: 'First password manager with quantum recovery - no master password needed'
      });
    }

    // Old passwords recommendation
    const oldPasswords = passwords.filter(p => {
      const daysSinceCreated = (Date.now() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 90;
    }).length;

    if (oldPasswords > 0) {
      recommendations.push({
        type: 'password_rotation',
        priority: 'medium',
        title: 'Rotate Old Passwords',
        description: `${oldPasswords} passwords are over 90 days old`,
        action: 'Consider updating old passwords with fresh quantum-generated ones'
      });
    }

    // Security score calculation
    const totalPasswords = passwords.length;
    const quantumPasswords = passwords.filter(p => p.isQuantum).length;
    const strongPasswords = passwords.filter(p => p.strength >= 80).length;
    
    let securityScore = 0;
    if (totalPasswords > 0) {
      securityScore += (quantumPasswords / totalPasswords) * 40; // 40% for quantum
      securityScore += (strongPasswords / totalPasswords) * 30; // 30% for strength
      securityScore += hasRecovery ? 30 : 0; // 30% for recovery setup
    }

    res.json({
      success: true,
      recommendations: recommendations,
      securityScore: Math.round(securityScore),
      quantumMetrics: {
        quantumPasswords: quantumPasswords,
        totalPasswords: totalPasswords,
        quantumPercentage: totalPasswords > 0 ? Math.round((quantumPasswords / totalPasswords) * 100) : 0,
        hasQuantumRecovery: hasRecovery
      }
    });

  } catch (error) {
    console.error('[DASHBOARD-RECOMMENDATIONS-ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security recommendations'
    });
  }
};

/**
 * PATENT-CRITICAL: Get Activity Log
 * Quantum-aware security activity tracking
 */
const getActivity = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit) || 20;
    console.log(`[DASHBOARD-ACTIVITY] Getting activity for user ${userId}`);

    // Get recent audit logs
    const activities = await prisma.auditLog.findMany({
      where: { userId: userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        timestamp: true,
        ipAddress: true,
        metadata: true
      }
    });

    // Transform activities for display
    const activityLog = activities.map(activity => {
      let description = '';
      let type = 'general';
      let quantumOperation = false;

      switch (activity.action) {
        case 'PASSWORD_CREATED':
          description = 'Created new password';
          type = 'password';
          quantumOperation = activity.metadata?.isQuantum === true;
          break;
        case 'PASSWORD_UPDATED':
          description = 'Updated password';
          type = 'password';
          break;
        case 'PASSWORD_DELETED':
          description = 'Deleted password';
          type = 'password';
          break;
        case 'QUANTUM_PASSWORD_GENERATED':
          description = 'Generated quantum password';
          type = 'quantum';
          quantumOperation = true;
          break;
        case 'QUANTUM_RECOVERY_KIT_GENERATED':
          description = 'Generated quantum recovery kit';
          type = 'recovery';
          quantumOperation = true;
          break;
        case 'SHARE_DOWNLOADED':
          description = 'Downloaded recovery share';
          type = 'recovery';
          break;
        case 'LOGIN':
          description = 'Logged in with biometric authentication';
          type = 'auth';
          break;
        case 'BULK_IMPORT':
          const imported = activity.metadata?.totalImported || 0;
          description = `Imported ${imported} passwords`;
          type = 'import';
          break;
        default:
          description = activity.action.toLowerCase().replace(/_/g, ' ');
      }

      return {
        id: activity.id,
        description: description,
        type: type,
        timestamp: activity.timestamp,
        ipAddress: activity.ipAddress?.substring(0, 8) + '***', // Privacy protection
        quantumOperation: quantumOperation,
        metadata: {
          entityType: activity.entityType
        }
      };
    });

    res.json({
      success: true,
      activities: activityLog,
      totalCount: activities.length,
      quantumOperations: activityLog.filter(a => a.quantumOperation).length
    });

  } catch (error) {
    console.error('[DASHBOARD-ACTIVITY-ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity log'
    });
  }
};

module.exports = {
  getStats,
  getRecommendations,
  getActivity
};