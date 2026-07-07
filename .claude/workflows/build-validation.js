export const meta = {
  name: 'build-validation',
  description: 'Cost-optimized build validation: scan diff, review correctness, verify in app, suggest optimizations',
  phases: [
    { title: 'Analyze', detail: 'Quick scan of what changed' },
    { title: 'Review', detail: 'Check for bugs and correctness issues' },
    { title: 'Test', detail: 'Verify in real app' },
    { title: 'Optimize', detail: 'Suggest improvements' },
  ],
}

const DIFF_SCHEMA = {
  type: 'object',
  properties: {
    changedFiles: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of changed files with short summary of what changed'
    },
    riskAreas: {
      type: 'array',
      items: { type: 'string' },
      description: 'High-risk areas: API changes, schema migrations, auth logic, payment code'
    },
    scope: {
      type: 'string',
      enum: ['small', 'medium', 'large'],
      description: 'Is this a small tweak, medium feature, or large refactor?'
    }
  },
  required: ['changedFiles', 'riskAreas', 'scope']
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    bugs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          description: { type: 'string' },
          file: { type: 'string' },
          suggestedFix: { type: 'string' }
        }
      }
    },
    improvements: {
      type: 'array',
      items: { type: 'string' },
      description: 'Code simplifications, performance wins, readability improvements'
    }
  }
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    safe: { type: 'boolean', description: 'Is this safe to deploy?' },
    reason: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } }
  }
}

// Phase 1: Quick analysis of changes
phase('Analyze')
const analysis = await agent(
  `Analyze the current git diff. What files changed? What's the scope (small/medium/large)?
   Identify high-risk areas: API/schema changes, auth, database migrations, payment code, external integrations.
   Format as: changed files list, risk areas, scope estimate.`,
  { label: 'analyze-diff', phase: 'Analyze', schema: DIFF_SCHEMA, effort: 'low' }
)

if (!analysis) {
  log('Diff analysis failed, skipping workflow')
  return { success: false, reason: 'Could not analyze diff' }
}

log(`Scope: ${analysis.scope} | Risk areas: ${analysis.riskAreas.join(', ') || 'none'}`)

// Phase 2: Correctness review (parallelize multiple angles)
phase('Review')

const reviewPrompts = [
  {
    label: 'correctness',
    prompt: `Review this diff for functional correctness. Look for:
     - Logic errors, off-by-one bugs, null/undefined checks
     - Type mismatches, unhandled edge cases
     - Breaking changes to APIs or contracts
     Report critical bugs only (not style).`,
    effort: analysis.scope === 'large' ? 'high' : 'medium'
  },
  {
    label: 'security',
    prompt: `Security audit of the diff. Look for:
     - SQL injection, XSS, CSRF vulnerabilities
     - Unvalidated user input, missing auth checks
     - Exposed secrets, weak crypto
     Only flag actual security issues.`,
    effort: 'high'
  },
  {
    label: 'schema',
    prompt: analysis.riskAreas.includes('schema') || analysis.riskAreas.includes('database')
      ? `Database schema review:
        - Are migrations safe? Can they be rolled back?
        - Data loss risks? Default values for NOT NULL additions?
        - Backward compatibility with running code?`
      : null
  }
]

const reviews = await parallel(
  reviewPrompts
    .filter(r => r.prompt)
    .map(r => () =>
      agent(r.prompt, {
        label: `review:${r.label}`,
        phase: 'Review',
        schema: FINDINGS_SCHEMA,
        effort: r.effort
      })
    )
)

const criticalBugs = reviews
  .filter(Boolean)
  .flatMap(r => r.bugs || [])
  .filter(b => b.severity === 'critical')

if (criticalBugs.length > 0) {
  log(`⚠️  ${criticalBugs.length} critical issue(s) found — review before proceeding`)
}

// Phase 3: Verify in real app
phase('Test')

let verified = null
if (analysis.scope !== 'large') {
  // Small/medium changes: quick verify
  verified = await agent(
    `The user has uncommitted changes. Verify they work:
     1. Start the app (mobile or web as appropriate)
     2. Test the golden path for the feature
     3. Check for crashes or obvious regressions
     Report: does it work, any issues found?`,
    { label: 'verify-app', phase: 'Test', schema: VERDICT_SCHEMA, effort: 'low' }
  )
} else {
  // Large changes: require thorough test
  log('Large scope — recommend manual testing before merge')
}

// Phase 4: Optimization suggestions (only if no critical bugs)
phase('Optimize')

let optimizations = null
if (criticalBugs.length === 0 && analysis.scope !== 'large') {
  optimizations = await agent(
    `Review the diff for:
     - Simplifications: repeated code, unnecessary conditionals, unused imports
     - Performance: n+1 queries, unnecessary re-renders, bundle size
     - Readability: confusing variable names, missing comments on WHY
     Suggest top 3 actionable improvements only.`,
    { label: 'simplify-suggestions', phase: 'Optimize', schema: FINDINGS_SCHEMA, effort: 'low' }
  )
}

// Return summary
return {
  scope: analysis.scope,
  riskAreas: analysis.riskAreas,
  criticalBugs: criticalBugs.length,
  canDeploy: criticalBugs.length === 0 && (!verified || verified.safe),
  verified: verified?.safe,
  improvements: optimizations?.improvements || [],
  summary: criticalBugs.length > 0
    ? `❌ ${criticalBugs.length} critical issues. Fix before merge.`
    : verified === false
    ? `⚠️  App test failed. Review needed.`
    : `✅ Ready to merge. ${optimizations?.improvements.length || 0} suggestions included.`
}
