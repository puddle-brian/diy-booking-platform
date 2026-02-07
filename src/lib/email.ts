import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Admin email for notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'brian@drool.ws';

// From address (must be verified domain in Resend, or use onboarding@resend.dev for testing)
const FROM_EMAIL = process.env.FROM_EMAIL || 'DIY Shows <onboarding@resend.dev>';

interface DiscoverySummary {
  jobsRun: number;
  venuesFound: number;
  artistsFound: number;
  totalCost: number; // in cents
  dailyBudgetUsed: number; // percent
  monthlyBudgetUsed: number; // percent
  pendingJobs: number;
  pendingReview: number;
  errors: string[];
}

export async function sendDiscoveryDigest(summary: DiscoverySummary): Promise<boolean> {
  if (!resend) {
    console.log('Email not configured (missing RESEND_API_KEY)');
    return false;
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #22d3ee; margin: 0; font-size: 24px; }
    .header p { color: #888; margin: 5px 0 0; font-size: 14px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat { background: #1a1a1a; border: 1px solid #333; padding: 15px; }
    .stat-label { color: #888; font-size: 12px; text-transform: uppercase; }
    .stat-value { color: #22d3ee; font-size: 28px; font-weight: bold; margin-top: 5px; }
    .stat-value.green { color: #22c55e; }
    .stat-value.yellow { color: #eab308; }
    .stat-value.red { color: #ef4444; }
    .budget { background: #1a1a1a; border: 1px solid #333; padding: 15px; margin: 15px 0; }
    .budget-bar { height: 8px; background: #333; border-radius: 4px; margin-top: 8px; }
    .budget-fill { height: 8px; border-radius: 4px; }
    .budget-fill.green { background: #22c55e; }
    .budget-fill.yellow { background: #eab308; }
    .budget-fill.red { background: #ef4444; }
    .action { background: #22d3ee; color: #000; padding: 12px 24px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: bold; }
    .errors { background: #1a0a0a; border: 1px solid #ef4444; padding: 15px; margin-top: 15px; }
    .errors h3 { color: #ef4444; margin: 0 0 10px; }
    .errors li { color: #f87171; font-size: 14px; }
    .footer { border-top: 1px solid #333; padding-top: 15px; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Discovery Digest</h1>
      <p>${today}</p>
    </div>

    <div class="stat-grid">
      <div class="stat">
        <div class="stat-label">Jobs Run Today</div>
        <div class="stat-value">${summary.jobsRun}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Cost Today</div>
        <div class="stat-value">$${(summary.totalCost / 100).toFixed(2)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Venues Found</div>
        <div class="stat-value green">${summary.venuesFound}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Artists Found</div>
        <div class="stat-value green">${summary.artistsFound}</div>
      </div>
    </div>

    <div class="budget">
      <div style="display: flex; justify-content: space-between;">
        <span class="stat-label">Daily Budget</span>
        <span style="color: ${summary.dailyBudgetUsed >= 90 ? '#ef4444' : summary.dailyBudgetUsed >= 70 ? '#eab308' : '#22c55e'}">
          ${summary.dailyBudgetUsed}% used
        </span>
      </div>
      <div class="budget-bar">
        <div class="budget-fill ${summary.dailyBudgetUsed >= 90 ? 'red' : summary.dailyBudgetUsed >= 70 ? 'yellow' : 'green'}" 
             style="width: ${Math.min(summary.dailyBudgetUsed, 100)}%"></div>
      </div>
    </div>

    <div class="budget">
      <div style="display: flex; justify-content: space-between;">
        <span class="stat-label">Monthly Budget</span>
        <span style="color: ${summary.monthlyBudgetUsed >= 90 ? '#ef4444' : summary.monthlyBudgetUsed >= 70 ? '#eab308' : '#22c55e'}">
          ${summary.monthlyBudgetUsed}% used
        </span>
      </div>
      <div class="budget-bar">
        <div class="budget-fill ${summary.monthlyBudgetUsed >= 90 ? 'red' : summary.monthlyBudgetUsed >= 70 ? 'yellow' : 'green'}" 
             style="width: ${Math.min(summary.monthlyBudgetUsed, 100)}%"></div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat">
        <div class="stat-label">Jobs in Queue</div>
        <div class="stat-value">${summary.pendingJobs}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Awaiting Review</div>
        <div class="stat-value ${summary.pendingReview > 50 ? 'yellow' : ''}">${summary.pendingReview}</div>
      </div>
    </div>

    ${summary.errors.length > 0 ? `
    <div class="errors">
      <h3>⚠️ Errors Today</h3>
      <ul>
        ${summary.errors.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <a href="https://www.diy-shows.com/admin/staging" class="action">
      Review Staged Entries →
    </a>

    <div class="footer">
      <p>DIY Shows Database Builder</p>
      <p>Automated discovery running every 6 hours.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🔍 Discovery Digest: ${summary.venuesFound + summary.artistsFound} new entries found`,
      html
    });

    if (error) {
      console.error('Email send error:', error);
      return false;
    }

    console.log('Discovery digest sent to', ADMIN_EMAIL);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

export async function sendErrorAlert(error: string, context: string): Promise<boolean> {
  if (!resend) {
    console.log('Email not configured (missing RESEND_API_KEY)');
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `⚠️ DIY Shows Discovery Error`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #ef4444;">Discovery Error</h2>
          <p><strong>Context:</strong> ${context}</p>
          <pre style="background: #1a1a1a; color: #f87171; padding: 15px; overflow-x: auto;">${error}</pre>
          <p><a href="https://www.diy-shows.com/admin/staging/automation">View Automation Dashboard →</a></p>
        </div>
      `
    });
    return true;
  } catch {
    return false;
  }
}
