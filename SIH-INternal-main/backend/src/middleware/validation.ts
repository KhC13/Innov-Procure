import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const id = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/);
const text = (max = 500) => z.string().min(1).max(max).regex(/^(?=.*\S)[^\x00-\x1F\x7F]+$/);
const optionalText = (max = 500) => z.string().max(max).regex(/^[^\x00-\x1F\x7F]*$/);
const numberInput = z.union([
  z.number().finite(),
  z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/).max(30),
]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2}))?$/).max(40);

const bodySchemas: Record<string, z.ZodTypeAny> = {
  'POST /auth/login': z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) }).strict(),
  'POST /auth/register': z.object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(128),
    name: text(100),
    role: z.enum(['SUPER_ADMIN', 'GOVERNMENT_ADMIN', 'STARTUP', 'EVALUATOR', 'PROCUREMENT_OFFICER']).optional(),
    departmentId: id.optional(),
    startupId: id.optional(),
    designation: optionalText(100),
    phone: z.string().regex(/^[+\d][\d\s().-]{5,29}$/).optional(),
  }).strict(),
  'POST /auth/logout': z.object({}).strict(),
  'POST /problems': z.object({
    title: text(200),
    description: text(10000),
    departmentId: id,
    sector: text(100),
    location: optionalText(200),
    budget: numberInput,
    timelineMonths: z.union([z.number().int().min(1).max(120), z.string().regex(/^[1-9]\d{0,2}$/)]).optional(),
    expectedImpact: optionalText(5000),
    targetBeneficiaries: optionalText(500),
    requirements: z.array(z.object({
      title: text(200),
      description: optionalText(5000),
      isMandatory: z.boolean(),
    }).strict()).max(100).optional(),
    technologies: z.array(text(100)).max(100).optional(),
    weights: z.object({
      technical: numberInput,
      innovation: numberInput,
      feasibility: numberInput,
      financial: numberInput,
      scalability: numberInput,
      impact: numberInput,
      security: numberInput,
      compliance: numberInput,
    }).strict().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'SHORTLISTED', 'PILOT', 'PROCUREMENT', 'COMPLETED', 'CLOSED']).optional(),
  }).strict(),
  'PUT /problems/:id': z.object({
    title: text(200).optional(),
    description: text(10000).optional(),
    sector: text(100).optional(),
    location: optionalText(200).optional(),
    budget: numberInput.optional(),
    timelineMonths: z.union([z.number().int().min(1).max(120), z.string().regex(/^[1-9]\d{0,2}$/)]).optional(),
    expectedImpact: optionalText(5000).optional(),
    targetBeneficiaries: optionalText(500).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'SHORTLISTED', 'PILOT', 'PROCUREMENT', 'COMPLETED', 'CLOSED']).optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  'POST /problems/:id/publish': z.object({}).strict(),
  'POST /problems/:id/close': z.object({}).strict(),
  'POST /applications': z.object({
    problemId: id,
    startupId: id.optional(),
    proposalTitle: text(200),
    technicalApproach: text(10000),
    implementationPlan: optionalText(10000),
    timelineMonths: z.union([z.number().int().min(1).max(120), z.string().regex(/^[1-9]\d{0,2}$/)]).optional(),
    proposedBudget: numberInput.optional(),
    expectedImpact: optionalText(5000),
    teamDetails: optionalText(10000),
    documents: z.array(z.object({
      title: text(200).optional(),
      fileType: z.string().regex(/^[a-z]+\/[-+.a-z0-9]+$/i).max(100).optional(),
      fileUrl: z.string().url().max(2048).optional(),
      fileSize: z.number().int().min(0).max(25 * 1024 * 1024).optional(),
    }).strict()).max(5).optional(),
  }).strict(),
  'POST /applications/:id/shortlist': z.object({}).strict(),
  'POST /applications/:id/reject': z.object({ reason: optionalText(2000) }).strict(),
  'POST /matches/generate': z.object({ problemId: id, limit: z.number().int().min(1).max(100).optional() }).strict(),
  'POST /evaluations': z.object({
    applicationId: id,
    technicalScore: z.number().min(0).max(100).optional(),
    innovationScore: z.number().min(0).max(100).optional(),
    feasibilityScore: z.number().min(0).max(100).optional(),
    financialScore: z.number().min(0).max(100).optional(),
    scalabilityScore: z.number().min(0).max(100).optional(),
    impactScore: z.number().min(0).max(100).optional(),
    securityScore: z.number().min(0).max(100).optional(),
    complianceScore: z.number().min(0).max(100).optional(),
    comments: optionalText(5000),
  }).strict(),
  'POST /pilots': z.object({
    applicationId: id,
    title: text(200),
    objectives: optionalText(5000),
    expectedOutcomes: optionalText(5000),
    budget: numberInput,
    startDate: isoDate,
    endDate: isoDate,
    milestones: z.array(z.object({
      title: text(200),
      description: optionalText(5000),
      dueDate: isoDate.optional(),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED']).optional(),
      completionPercentage: z.number().min(0).max(100).optional(),
      owner: optionalText(100),
    }).strict()).max(100).optional(),
    kpis: z.array(z.object({
      name: text(200),
      unit: optionalText(50),
      baseline: numberInput.optional(),
      target: numberInput.optional(),
      current: numberInput.optional(),
    }).strict()).max(100).optional(),
  }).strict(),
  'POST /pilots/:id/kpis': z.object({
    name: text(200),
    metricUnit: optionalText(50),
    baselineValue: numberInput.optional(),
    targetValue: numberInput.optional(),
    currentValue: numberInput.optional(),
  }).strict(),
  'PUT /kpis/:id': z.object({ currentValue: numberInput, targetValue: numberInput.optional() }).strict(),
  'POST /scale': z.object({
    pilotId: id,
    impactScore: z.number().min(0).max(100).optional(),
    technicalReadinessScore: z.number().min(0).max(100).optional(),
    operationalReadinessScore: z.number().min(0).max(100).optional(),
    financialSustainabilityScore: z.number().min(0).max(100).optional(),
    userAdoptionScore: z.number().min(0).max(100).optional(),
    securityScore: z.number().min(0).max(100).optional(),
    complianceScore: z.number().min(0).max(100).optional(),
    scalabilityScore: z.number().min(0).max(100).optional(),
    summary: optionalText(5000),
    recommendations: z.array(text(500)).max(100).optional(),
  }).strict(),
  'POST /procurement': z.object({
    pilotId: id.optional(),
    problemId: id,
    startupId: id,
    departmentId: id.optional(),
    title: text(200),
    estimatedValue: numberInput,
    approvedBudget: numberInput.optional(),
    currentStage: z.enum(['RECOMMENDATION', 'TECHNICAL_EVALUATION', 'FINANCIAL_APPROVAL', 'TENDER', 'CONTRACT', 'PURCHASE_ORDER', 'IMPLEMENTATION', 'COMPLETED']).optional(),
    targetCompletionDate: isoDate.optional(),
  }).strict(),
  'POST /procurement/:id/stage': z.object({
    toStage: z.enum(['RECOMMENDATION', 'TECHNICAL_EVALUATION', 'FINANCIAL_APPROVAL', 'TENDER', 'CONTRACT', 'PURCHASE_ORDER', 'IMPLEMENTATION', 'COMPLETED']),
    notes: optionalText(5000),
  }).strict(),
  'POST /contracts': z.object({
    procurementId: id,
    startupId: id.optional(),
    departmentId: id.optional(),
    contractNumber: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9/_.-]{0,127}$/).optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    contractValue: numberInput,
    terms: text(10000),
    documentUrl: z.string().url().max(2048).optional(),
  }).strict(),
  'PUT /notifications/:id/read': z.object({}).strict(),
  'PUT /notifications/read-all': z.object({}).strict(),
  'POST /files/upload': z.object({}).strict(),
  'POST /system/reset-demo': z.object({}).strict(),
};

const querySchemas: Record<string, z.ZodTypeAny> = {
  'GET /problems': z.object({
    search: z.string().min(1).max(200).optional(),
    sector: z.string().min(1).max(100).optional(),
    departmentId: id.optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'SHORTLISTED', 'PILOT', 'PROCUREMENT', 'COMPLETED', 'CLOSED']).optional(),
    sortBy: z.enum(['created_at', 'budget', 'title', 'status']).optional(),
    order: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
  }).strict(),
  'GET /startups': z.object({
    search: z.string().min(1).max(200).optional(),
    sector: z.string().min(1).max(100).optional(),
    technology: z.string().min(1).max(100).optional(),
    location: z.string().min(1).max(200).optional(),
    stage: z.enum(['IDEA', 'MVP', 'GROWTH', 'SCALING']).optional(),
    certification: z.string().min(1).max(100).optional(),
  }).strict(),
  'GET /applications': z.object({ problemId: id.optional(), startupId: id.optional(), status: z.string().min(1).max(50).optional() }).strict(),
  'GET /evaluations': z.object({ applicationId: id.optional() }).strict(),
  'GET /pilots': z.object({ status: z.string().min(1).max(50).optional(), departmentId: id.optional() }).strict(),
  'GET /procurement': z.object({ stage: z.string().min(1).max(50).optional(), departmentId: id.optional() }).strict(),
  'GET /analytics/dashboard': z.object({ departmentId: id.optional(), sector: z.string().min(1).max(100).optional(), status: z.string().min(1).max(50).optional() }).strict(),
};

function normalizePath(path: string): string {
  let normalized = path;
  normalized = normalized.replace(/\/problems\/[^/]+(?=\/|$)/g, '/problems/:id');
  normalized = normalized.replace(/\/startups\/[^/]+(?=\/|$)/g, '/startups/:id');
  normalized = normalized.replace(/\/applications\/[^/]+(?=\/|$)/g, '/applications/:id');
  normalized = normalized.replace(/\/matches\/problem\/[^/]+(?=\/|$)/g, '/matches/problem/:id');
  normalized = normalized.replace(/\/pilots\/[^/]+(?=\/|$)/g, '/pilots/:id');
  normalized = normalized.replace(/\/kpis\/[^/]+(?=\/|$)/g, '/kpis/:id');
  normalized = normalized.replace(/\/scale\/[^/]+(?=\/|$)/g, '/scale/:id');
  normalized = normalized.replace(/\/procurement\/[^/]+(?=\/|$)/g, '/procurement/:id');
  normalized = normalized.replace(/\/contracts\/[^/]+(?=\/|$)/g, '/contracts/:id');
  normalized = normalized.replace(/\/departments\/[^/]+(?=\/|$)/g, '/departments/:id');
  normalized = normalized.replace(/\/notifications\/(?!read-all(?:\/|$))[^/]+(?=\/|$)/g, '/notifications/:id');
  return normalized;
}

function validationError(res: Response, issues: z.ZodIssue[]) {
  return res.status(400).json({
    error: 'Invalid request',
    code: 'VALIDATION_ERROR',
    details: issues.map((issue) => ({
      field: issue.path.length ? issue.path.join('.') : 'request',
      message: issue.message,
    })),
  });
}

export function strictValidation(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization && !/^Bearer [A-Za-z0-9_.~+\/=-]{20,4096}$/.test(req.headers.authorization)) {
    return res.status(400).json({ error: 'Invalid Authorization header', code: 'VALIDATION_ERROR' });
  }

  const normalized = normalizePath(req.path);
  const key = `${req.method} ${normalized}`;

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const schema = bodySchemas[key];
    if (schema) {
      const body = req.body ?? {};
      const parsed = schema.safeParse(body);
      if (!parsed.success) return validationError(res, parsed.error.issues);
      req.body = parsed.data;
    }
  }

  const querySchema = querySchemas[key];
  if (req.method === 'GET' && querySchema) {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error.issues);
  }

  // Params use a shared strict identifier format and are checked even for routes
  // whose names vary from the route templates.
  for (const [name, value] of Object.entries(req.params)) {
    if (typeof value !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameter', code: 'VALIDATION_ERROR', field: name });
    }
    const parsed = id.safeParse(value);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid path parameter', code: 'VALIDATION_ERROR', field: name });
    }
  }

  return next();
}
