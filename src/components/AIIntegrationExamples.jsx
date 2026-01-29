/**
 * AI Integration Example Components
 * 
 * This file demonstrates how to integrate Simon and Kyle into React components
 * These are starting templates that you can customize for your needs
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { AI } from '@/api/aiIntegrations';

// ============================================================================
// SIMON: JOB ANALYSIS COMPONENTS
// ============================================================================

/**
 * Quick Ghost Job Checker
 * Shows ghost job score for a job listing
 */
export function GhostJobChecker({ jd, company, title }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await AI.checkGhostJob(jd, company, title);
      setResult(analysis.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW':
        return 'text-green-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreBarColor = (score) => {
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Ghost Job Detector</h3>
        <p className="text-gray-600">
          Get a quick assessment of whether this job posting might be a ghost job
        </p>

        <Button onClick={handleCheck} disabled={loading}>
          {loading ? 'Analyzing...' : 'Check Ghost Job Score'}
        </Button>

        {error && <Alert variant="destructive">{error}</Alert>}

        {result && (
          <div className="space-y-4">
            {/* Score Display */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Ghost Job Score</span>
                <span className="text-2xl font-bold">{result.score}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`${getScoreBarColor(result.score)} h-4 rounded-full`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </div>

            {/* Risk Level */}
            <div>
              <span className="font-semibold">Risk Level: </span>
              <span className={`font-bold ${getRiskColor(result.risk_level)}`}>
                {result.risk_level}
              </span>
            </div>

            {/* Recommendation */}
            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
              <p className="font-semibold">Recommendation</p>
              <p className="text-sm text-gray-700">{result.recommendation}</p>
            </div>

            {/* Red Flags */}
            {result.indicators && result.indicators.length > 0 && (
              <div>
                <p className="font-semibold text-red-600 mb-2">⚠️ Red Flags</p>
                <ul className="space-y-1">
                  {result.indicators.map((indicator, i) => (
                    <li key={i} className="text-sm text-red-600">
                      • {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Positive Signals */}
            {result.positive_signals && result.positive_signals.length > 0 && (
              <div>
                <p className="font-semibold text-green-600 mb-2">✓ Positive Signals</p>
                <ul className="space-y-1">
                  {result.positive_signals.map((signal, i) => (
                    <li key={i} className="text-sm text-green-600">
                      • {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Complete Job Analysis with Simon
 * Full analysis including role classification, quality assessment, and recommendations
 */
export function JobAnalysisPanel({ jobData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await AI.analyzeJob(jobData);
      setResult(analysis.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'APPLY':
        return 'bg-green-50 border-green-200';
      case 'MONITOR':
        return 'bg-yellow-50 border-yellow-200';
      case 'SKIP':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'APPLY':
        return '✅';
      case 'MONITOR':
        return '👀';
      case 'SKIP':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Job Analysis - By Simon</h2>

        <Button onClick={handleAnalyze} disabled={loading} className="mb-4">
          {loading ? 'Analyzing...' : 'Analyze Job Opportunity'}
        </Button>

        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Decision Card */}
          <Card className={`p-6 border ${getDecisionColor(result.recommendation.decision)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Simon's Recommendation</p>
                <p className="text-3xl font-bold">
                  {getDecisionIcon(result.recommendation.decision)} {result.recommendation.decision}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Priority</p>
                <p className="text-2xl font-bold">{result.recommendation.priority}</p>
              </div>
            </div>
            <p className="text-gray-700 mt-3">{result.recommendation.reasoning}</p>
            <p className="text-xs text-gray-500 mt-2">
              Confidence: {result.recommendation.confidence}%
            </p>
          </Card>

          {/* Role Information */}
          <Card className="p-6">
            <h3 className="font-bold mb-3">Role Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Title</p>
                <p className="font-semibold">{result.role.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Company</p>
                <p className="font-semibold">{result.role.company}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="font-semibold">{result.role.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Tier</p>
                <p className="font-semibold">{result.role.tier}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Seniority</p>
                <p className="font-semibold">{result.role.seniority}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Special</p>
                <p className="font-semibold">
                  {result.role.is_deputy ? 'Deputy' : result.role.is_compliance ? 'Compliance' : 'Standard'}
                </p>
              </div>
            </div>
          </Card>

          {/* Job Quality Assessment */}
          <Card className="p-6">
            <h3 className="font-bold mb-3">Job Quality Assessment</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">Quality Score</span>
                  <span className="text-lg font-bold">{result.quality.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${result.quality.score}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm">
                <span className="font-semibold">Rating:</span> {result.quality.rating}
              </p>

              {result.quality.strengths && result.quality.strengths.length > 0 && (
                <div>
                  <p className="font-semibold text-green-600 mb-1">Strengths</p>
                  <ul className="text-sm space-y-1">
                    {result.quality.strengths.map((strength, i) => (
                      <li key={i} className="text-green-600">✓ {strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.quality.issues && result.quality.issues.length > 0 && (
                <div>
                  <p className="font-semibold text-orange-600 mb-1">Issues</p>
                  <ul className="text-sm space-y-1">
                    {result.quality.issues.map((issue, i) => (
                      <li key={i} className="text-orange-600">⚠️ {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Ghost Job Analysis */}
          <Card className="p-6">
            <h3 className="font-bold mb-3">Ghost Job Risk Assessment</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Ghost Score</span>
                <span className="text-2xl font-bold">{result.ghost_job.score}/100</span>
              </div>
              <div>
                <span className="font-semibold">Risk Level: </span>
                <span className="font-bold text-red-600">{result.ghost_job.risk_level}</span>
              </div>
              <p className="text-gray-700">{result.ghost_job.recommendation}</p>

              {result.ghost_job.red_flags && result.ghost_job.red_flags.length > 0 && (
                <div>
                  <p className="font-semibold text-red-600 mb-1">Red Flags</p>
                  <ul className="text-sm space-y-1">
                    {result.ghost_job.red_flags.map((flag, i) => (
                      <li key={i} className="text-red-600">⚠️ {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.ghost_job.positive_signals && result.ghost_job.positive_signals.length > 0 && (
                <div>
                  <p className="font-semibold text-green-600 mb-1">Positive Signals</p>
                  <ul className="text-sm space-y-1">
                    {result.ghost_job.positive_signals.map((signal, i) => (
                      <li key={i} className="text-green-600">✓ {signal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// KYLE: RESUME OPTIMIZATION COMPONENTS
// ============================================================================

/**
 * Resume Optimizer Component
 * Takes Simon's analysis and generates resume optimization strategies
 */
export function ResumeOptimizerPanel({ simonAnalysis, resumeData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      const optimization = await AI.optimizeResume(simonAnalysis, resumeData);
      setResult(optimization.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Resume Optimization - By Kyle</h2>

        <Button onClick={handleOptimize} disabled={loading} className="mb-4">
          {loading ? 'Optimizing...' : 'Optimize Resume for This Role'}
        </Button>

        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Positioning Strategy */}
          <Card className="p-6">
            <h3 className="font-bold mb-3">Positioning Strategy</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Target Role</p>
                <p className="text-lg font-semibold">{result.positioning.role}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Positioning</p>
                <p className="text-gray-700">{result.positioning.positioning}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Guidance</p>
                <p className="text-sm text-gray-700">{result.positioning.guidance}</p>
              </div>

              {result.positioning.positioning && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Key Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {result.positioning.positioning.key_themes?.map((theme, i) => (
                      <div key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {theme}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Resume/CV Strategy */}
          <Card className="p-6">
            <h3 className="font-bold mb-3">Resume Best Practices</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Key Practices</p>
                <ul className="space-y-2">
                  {result.cv_strategy.best_practices?.map((practice, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700">{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {result.cv_strategy.confidence && (
                <p className="text-sm text-gray-600">
                  Confidence: {result.cv_strategy.confidence}%
                </p>
              )}
            </div>
          </Card>

          {/* Cover Letter Strategy */}
          <Card className="p-6">
            <h3 className="font-bold mb-3">Cover Letter Strategy</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Best Practices</p>
                <ul className="space-y-2">
                  {result.cover_letter_strategy.best_practices?.map((practice, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold mt-1">✓</span>
                      <span className="text-gray-700">{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {result.cover_letter_strategy.key_elements && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Key Elements</p>
                  <div className="flex flex-wrap gap-2">
                    {result.cover_letter_strategy.key_elements.map((element, i) => (
                      <div key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm">
                        {element}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Interview Preparation */}
          <Card className="p-6">
            <h3 className="font-bold mb-3">Interview Preparation</h3>
            <div className="space-y-3">
              <p className="text-gray-700">{result.interview_prep.preparation}</p>

              {result.interview_prep.star_method && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">STAR Method</p>
                  <p className="text-sm text-gray-700 mb-2">
                    {result.interview_prep.star_method.instructions}
                  </p>
                  <p className="text-sm text-gray-600">
                    Available Templates: {result.interview_prep.star_method.templates?.length || 0}
                  </p>
                </div>
              )}

              {result.interview_prep.questions && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Question Categories</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(result.interview_prep.questions.by_category || {}).map(([category, questions]) => (
                      <div key={category} className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold text-sm capitalize">{category}</p>
                        <p className="text-xs text-gray-600">
                          {Array.isArray(questions) ? questions.length : 0} questions
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Bullet Point Strategies */}
          {result.bullet_strategies && (
            <Card className="p-6">
              <h3 className="font-bold mb-3">Bullet Point Strategies</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Formulas</p>
                  <ul className="space-y-2">
                    {result.bullet_strategies.formulas?.map((formula, i) => (
                      <li key={i} className="text-sm bg-gray-50 p-2 rounded font-mono">
                        {formula}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPLETE WORKFLOW: SIMON → KYLE
// ============================================================================

/**
 * Complete Job Analysis and Resume Optimization Workflow
 * Combines Simon analysis with Kyle optimization in one component
 */
export function CompleteWorkflowPanel({ jobData, resumeData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(null);

  const handleStartWorkflow = async () => {
    setLoading(true);
    setError(null);
    setStep('analyzing');
    try {
      const workflowResult = await AI.analyzeAndOptimize(jobData, resumeData);
      setResult(workflowResult);
      setStep('complete');
    } catch (err) {
      setError(err.message);
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-2xl font-bold mb-2">Complete Application Analysis</h2>
        <p className="text-gray-600 mb-4">Simon analyzes the job → Kyle optimizes your application</p>

        <Button onClick={handleStartWorkflow} disabled={loading}>
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {step === 'analyzing' ? 'Simon analyzing...' : 'Kyle optimizing...'}
            </>
          ) : (
            'Start Analysis'
          )}
        </Button>

        {error && <Alert variant="destructive" className="mt-4">{error}</Alert>}
      </Card>

      {/* Progress Visualization */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`p-3 rounded text-center ${step === 'analyzing' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <p className="font-semibold">Simon Analyzing</p>
                {step === 'analyzing' && <p className="text-sm text-blue-600">🔍 In Progress</p>}
                {step !== 'analyzing' && <p className="text-sm text-gray-600">✓ Complete</p>}
              </div>
            </div>
            <div className="px-4">→</div>
            <div className="flex-1">
              <div className={`p-3 rounded text-center ${step === 'optimizing' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <p className="font-semibold">Kyle Optimizing</p>
                {step === 'optimizing' && <p className="text-sm text-purple-600">✨ In Progress</p>}
                {step === 'optimizing' && <p className="text-sm text-gray-600">Waiting...</p>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Decision */}
          {!result.pursue ? (
            <Card className="p-6 bg-red-50 border border-red-200">
              <h3 className="text-xl font-bold text-red-800">❌ Not Recommended</h3>
              <p className="text-red-700 mt-2">{result.reason}</p>
              <p className="text-sm text-red-600 mt-2">
                Ghost Job Score: {result.ghostScore}/100
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Recommendation */}
              <Card className="p-6 bg-green-50 border border-green-200">
                <h3 className="text-xl font-bold text-green-800">✅ Recommended</h3>
                <p className="text-green-700 mt-2">
                  Priority: <span className="font-bold">{result.priority}</span>
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Ghost Job Score: {result.ghostScore}/100 (Low Risk)
                </p>
              </Card>

              {/* Simon's Analysis Summary */}
              {result.simonAnalysis && (
                <Card className="p-6">
                  <h3 className="font-bold mb-3">📊 Simon's Analysis</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-semibold">Role Type</p>
                      <p>{result.simonAnalysis.role.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Tier</p>
                      <p>{result.simonAnalysis.role.tier}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Quality Rating</p>
                      <p>{result.simonAnalysis.quality.rating}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Quality Score</p>
                      <p>{result.simonAnalysis.quality.score}/100</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Kyle's Optimization Summary */}
              {result.kyleOptimization && (
                <Card className="p-6">
                  <h3 className="font-bold mb-3">✨ Kyle's Optimization</h3>
                  <div className="space-y-3">
                    {/* Positioning */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Positioning</p>
                      <p className="text-sm">{result.kyleOptimization.positioning.positioning}</p>
                    </div>

                    {/* Interview Prep */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Interview Readiness</p>
                      <div className="text-sm space-y-1">
                        <p>
                          STAR Templates:{' '}
                          <span className="font-semibold">
                            {result.kyleOptimization.interview_prep.star_method?.templates?.length || 0}
                          </span>
                        </p>
                        <p>
                          Question Categories:{' '}
                          <span className="font-semibold">
                            {Object.keys(result.kyleOptimization.interview_prep.questions?.by_category || {}).length}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* CV Strategy */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Resume Strategy</p>
                      <p className="text-xs text-blue-600 cursor-pointer hover:underline">
                        View {result.kyleOptimization.cv_strategy?.best_practices?.length || 0} best practices →
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Next Steps */}
              <Card className="p-6 bg-blue-50">
                <h3 className="font-bold mb-3">📋 Next Steps</h3>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>Review Simon's job analysis</li>
                  <li>Update resume using Kyle's positioning strategy</li>
                  <li>Draft cover letter using Kyle's recommendations</li>
                  <li>Prepare for interview using STAR method templates</li>
                  <li>Submit application</li>
                </ol>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default {
  GhostJobChecker,
  JobAnalysisPanel,
  ResumeOptimizerPanel,
  CompleteWorkflowPanel
};
