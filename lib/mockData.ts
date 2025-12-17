import { Cluster, Pod, LogEntry, AIFixSuggestion, Alert, Company } from '@/types';

export const mockClusters: Cluster[] = [
    {
        id: 'cluster-1',
        name: 'production-us-east',
        status: 'healthy',
        provider: 'aws',
        region: 'us-east-1',
        totalPods: 156,
        runningPods: 152,
        failedPods: 4,
        cpuUsage: 67,
        memoryUsage: 72,
        connectedAt: '2024-01-15T10:30:00Z',
    },
    {
        id: 'cluster-2',
        name: 'staging-eu-west',
        status: 'warning',
        provider: 'gcp',
        region: 'eu-west-1',
        totalPods: 89,
        runningPods: 85,
        failedPods: 4,
        cpuUsage: 82,
        memoryUsage: 68,
        connectedAt: '2024-01-20T14:20:00Z',
    },
    {
        id: 'cluster-3',
        name: 'dev-azure-central',
        status: 'healthy',
        provider: 'azure',
        region: 'central-us',
        totalPods: 45,
        runningPods: 45,
        failedPods: 0,
        cpuUsage: 45,
        memoryUsage: 52,
        connectedAt: '2024-02-01T09:15:00Z',
    },
];

export const mockPods: Pod[] = [
    {
        id: 'pod-1',
        name: 'api-gateway-7d9f8b6c5-xk2mn',
        namespace: 'production',
        clusterId: 'cluster-1',
        status: 'running',
        restarts: 0,
        age: '5d',
        cpuUsage: 45,
        memoryUsage: 512,
        image: 'api-gateway:v2.3.1',
        node: 'node-1',
        hasError: false,
    },
    {
        id: 'pod-2',
        name: 'auth-service-5c8d7f9-p4k7n',
        namespace: 'production',
        clusterId: 'cluster-1',
        status: 'crashloopbackoff',
        restarts: 12,
        age: '2h',
        cpuUsage: 85,
        memoryUsage: 1024,
        image: 'auth-service:v1.8.2',
        node: 'node-2',
        hasError: true,
        errorMessage: 'Database connection timeout after 30s',
    },
    {
        id: 'pod-3',
        name: 'payment-processor-9b4c2-qw8rt',
        namespace: 'production',
        clusterId: 'cluster-1',
        status: 'failed',
        restarts: 5,
        age: '1h',
        cpuUsage: 12,
        memoryUsage: 256,
        image: 'payment-processor:v3.1.0',
        node: 'node-3',
        hasError: true,
        errorMessage: 'OutOfMemoryError: Java heap space',
    },
    {
        id: 'pod-4',
        name: 'frontend-web-6f5d8c-m9n2p',
        namespace: 'production',
        clusterId: 'cluster-1',
        status: 'running',
        restarts: 1,
        age: '3d',
        cpuUsage: 23,
        memoryUsage: 384,
        image: 'frontend-web:v4.2.0',
        node: 'node-1',
        hasError: false,
    },
    {
        id: 'pod-5',
        name: 'data-pipeline-8c3f5-t7y9k',
        namespace: 'staging',
        clusterId: 'cluster-2',
        status: 'pending',
        restarts: 0,
        age: '5m',
        cpuUsage: 0,
        memoryUsage: 0,
        image: 'data-pipeline:v2.0.1',
        node: 'node-4',
        hasError: false,
    },
];

export const mockLogs: LogEntry[] = [
    {
        timestamp: '2024-11-28T10:15:32Z',
        level: 'error',
        message: 'Failed to connect to database at db.internal:5432 - Connection timeout',
        hasPII: false,
    },
    {
        timestamp: '2024-11-28T10:15:31Z',
        level: 'warn',
        message: 'Retry attempt 3/5 for database connection',
        hasPII: false,
    },
    {
        timestamp: '2024-11-28T10:15:30Z',
        level: 'info',
        message: 'User john.doe@example.com initiated authentication request from IP 192.168.1.105',
        hasPII: true,
        redactedMessage: 'User [EMAIL_REDACTED] initiated authentication request from IP [IP_REDACTED]',
    },
    {
        timestamp: '2024-11-28T10:15:28Z',
        level: 'error',
        message: 'JWT token validation failed for user ID: usr_8f7d9c2b',
        hasPII: false,
    },
    {
        timestamp: '2024-11-28T10:15:25Z',
        level: 'debug',
        message: 'Processing payment for card ending in 4242, amount: $125.50',
        hasPII: true,
        redactedMessage: 'Processing payment for card ending in [CARD_REDACTED], amount: $125.50',
    },
    {
        timestamp: '2024-11-28T10:15:20Z',
        level: 'info',
        message: 'Application started successfully on port 8080',
        hasPII: false,
    },
];

export const mockAIFix: AIFixSuggestion = {
    id: 'fix-1',
    podId: 'pod-2',
    analysis: 'The auth-service pod is experiencing a CrashLoopBackOff due to database connection timeouts. The root cause is an incorrect database connection string configuration and insufficient connection timeout settings.',
    rootCause: 'Database connection timeout (30s) is too short for the current network latency. Additionally, the connection pool is not properly configured, leading to connection exhaustion under load.',
    suggestedFix: 'Update the database connection configuration to increase timeout to 60s and configure connection pooling with proper limits. Also ensure the database service endpoint is correctly configured.',
    codeSnippet: `# Update deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    spec:
      containers:
      - name: auth-service
        env:
        - name: DB_CONNECTION_TIMEOUT
          value: "60000"  # Increased to 60s
        - name: DB_POOL_SIZE
          value: "20"
        - name: DB_POOL_MAX_IDLE
          value: "10"
        - name: DB_HOST
          value: "postgres.production.svc.cluster.local"`,
    confidence: 92,
    estimatedImpact: 'high',
    createdAt: '2024-11-28T10:16:00Z',
    status: 'pending',
};

export const mockAlerts: Alert[] = [
    {
        id: 'alert-1',
        type: 'crash_loop',
        severity: 'critical',
        podId: 'pod-2',
        podName: 'auth-service-5c8d7f9-p4k7n',
        clusterId: 'cluster-1',
        message: 'Pod is in CrashLoopBackOff state with 12 restarts',
        timestamp: '2024-11-28T10:15:00Z',
        acknowledged: false,
    },
    {
        id: 'alert-2',
        type: 'pod_error',
        severity: 'critical',
        podId: 'pod-3',
        podName: 'payment-processor-9b4c2-qw8rt',
        clusterId: 'cluster-1',
        message: 'Pod failed with OutOfMemoryError',
        timestamp: '2024-11-28T09:45:00Z',
        acknowledged: false,
    },
    {
        id: 'alert-3',
        type: 'high_cpu',
        severity: 'warning',
        podId: 'pod-2',
        podName: 'auth-service-5c8d7f9-p4k7n',
        clusterId: 'cluster-1',
        message: 'CPU usage at 85% (threshold: 80%)',
        timestamp: '2024-11-28T10:10:00Z',
        acknowledged: true,
    },
];

export const mockCompanies: Company[] = [
    { name: 'TechCorp Global', logo: '🏢', industry: 'Technology' },
    { name: 'CloudScale Inc', logo: '☁️', industry: 'Cloud Services' },
    { name: 'DataFlow Systems', logo: '📊', industry: 'Data Analytics' },
    { name: 'SecureBank', logo: '🏦', industry: 'Financial Services' },
    { name: 'HealthTech Solutions', logo: '🏥', industry: 'Healthcare' },
    { name: 'RetailMax', logo: '🛒', industry: 'E-commerce' },
    { name: 'MediaStream Co', logo: '🎬', industry: 'Media & Entertainment' },
    { name: 'AutoDrive Motors', logo: '🚗', industry: 'Automotive' },
];

export const chatbotKnowledge = {
    greeting: "Hello! I'm the KubeGuardian assistant. I can help you learn about our AI-powered Kubernetes monitoring platform. What would you like to know?",
    features: {
        keywords: ['feature', 'what', 'can', 'do', 'capability'],
        response: "KubeGuardian offers:\n\n✨ AI-Powered Log Analysis - Intelligent analysis of pod logs with automatic error detection\n🔒 PII Redaction - Automatic detection and redaction of sensitive information\n👤 Human Approval Workflow - Review and approve AI-suggested fixes before deployment\n🔔 Real-time Alerts - Customizable notifications for pod failures and errors\n📊 Multi-Cluster Support - Monitor all your clusters from one dashboard\n🔐 Enterprise Security - SOC 2, ISO 27001, and GDPR compliant\n\nWould you like to know more about any specific feature?"
    },
    pricing: {
        keywords: ['price', 'cost', 'plan', 'tier', 'subscription'],
        response: "We offer three pricing tiers:\n\n🆓 Free Trial - Perfect for testing\n- 1 cluster\n- Up to 50 pods\n- 7-day log retention\n- Email support\n\n💼 Professional ($299/month)\n- Up to 5 clusters\n- Unlimited pods\n- 30-day log retention\n- Priority support\n- Advanced analytics\n\n🏢 Enterprise (Custom pricing)\n- Unlimited clusters\n- Unlimited pods\n- Custom log retention\n- 24/7 dedicated support\n- Custom integrations\n- SLA guarantees\n\nWould you like to start a free trial?"
    },
    integration: {
        keywords: ['integrate', 'connect', 'setup', 'install', 'configure'],
        response: "Connecting your cluster is simple and secure:\n\n1️⃣ Choose your connection method:\n   - Upload kubeconfig file\n   - Use service account token\n   - Cloud provider integration (AWS/GCP/Azure)\n\n2️⃣ We establish a secure, encrypted connection\n\n3️⃣ Start monitoring immediately!\n\nOur platform is compliant with SOC 2, ISO 27001, and GDPR. All data is encrypted in transit and at rest.\n\nReady to connect your cluster?"
    },
    ai: {
        keywords: ['ai', 'llm', 'analysis', 'fix', 'suggestion'],
        response: "Our AI engine provides:\n\n🧠 Intelligent Analysis - Analyzes pod logs to identify root causes\n💡 Fix Suggestions - Generates actionable solutions with code snippets\n🎯 High Accuracy - 90%+ confidence in recommendations\n👥 Human-in-the-Loop - All fixes require human approval before deployment\n🔄 Continuous Learning - Improves based on feedback\n\nYou can choose between raw or sanitized log analysis, with automatic PII redaction for compliance."
    },
    security: {
        keywords: ['security', 'secure', 'compliance', 'pii', 'gdpr', 'privacy'],
        response: "Security is our top priority:\n\n🔐 Enterprise-grade encryption (AES-256)\n🛡️ SOC 2 Type II certified\n📋 ISO 27001 compliant\n🌍 GDPR compliant\n🔒 Automatic PII redaction\n🔑 Role-based access control\n📝 Audit logging\n🏢 Data residency options\n\nYour cluster credentials are encrypted and never stored in plain text."
    },
    default: "I can help you with:\n\n• Features and capabilities\n• Pricing and plans\n• Integration and setup\n• AI analysis and fixes\n• Security and compliance\n\nWhat would you like to know more about?"
};
