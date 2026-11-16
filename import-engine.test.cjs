const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const memory = new Map();
const document = {
  querySelector: () => null,
  createElement: () => ({}),
  head: { appendChild() {} },
  body: { appendChild() {} }
};
const localStorage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const context = { window: {}, document, localStorage, console, Date, Math, JSON, Promise, Set, Array, Object, String, Number, RegExp, Error, Uint8Array };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'reze-import-engine.js'), 'utf8'), context);
const sample = `JORDAN SAMPLE\nSECURITY ANALYST | APPLICATION SECURITY\njordan@example.com | +1 415 555 0134\nPROFESSIONAL SUMMARY\nSecurity analyst with experience testing web applications and APIs.\nCORE TECHNICAL SKILLS\nPenetration Testing: Burp Suite, OWASP ZAP, Nmap\nAutomation: Python, Bash\nPROFESSIONAL EXPERIENCE\nACME SECURITY LLC | Security Analyst | Jan 2023 – Present\n• Tested web applications and APIs.\n  Identified access-control weaknesses and documented remediation.\n• Automated repetitive validation tasks.\nEDUCATION\nBachelor of Science — Example University | May 2022\nCERTIFICATION\nCertified Ethical Hacker`;
const result = context.window.REZEImportEngine.classify({ text: sample, lines: sample.split(/\r?\n/).map(text => ({ text, page: 1, source: 'fixture' })) }, 'fixture-doc');
assert.equal(result.data.name, 'JORDAN SAMPLE');
assert.equal(result.data.email, 'jordan@example.com');
assert.equal(result.data.experience.length, 1);
assert.equal(result.data.experience[0].company, 'ACME SECURITY LLC');
assert.equal(result.data.experience[0].role, 'Security Analyst');
assert.match(result.data.experience[0].details, /Identified access-control weaknesses/);
assert.equal(result.data.skillsGroups.length, 2);
assert.equal(result.data.education[0].company, 'Example University');
assert.equal(result.data.certifications[0].name, 'Certified Ethical Hacker');
assert.equal(result.data.schemaVersion, 2);
assert.equal(result.data.metadata.professionalContext.industry, 'technology');
const finance = context.window.REZEImportEngine.inferProfessionalContext('Prepared financial reports, reconciliations, tax audits and budget forecasts.');
assert.equal(finance.industry, 'finance');
const general = context.window.REZEImportEngine.inferProfessionalContext('Experienced professional with a varied background.');
assert.equal(general.industry, 'general');
assert.ok(result.data.metadata.professionalContext.responsibilityThemes.includes('analysis'));

const abhishekResume = [
  'Manhalli Vijay Sriker Abhishek Emmanuel abhishekemmanuel99@gmail.com',
  'Senior DevOps Engineer +91-7993421089',
  'PROFESSIONAL SUMMARY :',
  'Senior DevOps Engineer with 6+ years of experience in cloud infrastructure management, CI/CD automation, Kubernetes administration, Infrastructure as Code, and DevSecOps practices across AWS, GCP, and on-premises environments.',
  'Technical Skills :',
  'Category : Skills',
  'Cloud Platforms : AWS (EC2, EKS, ECR, S3, IAM, VPC, RDS, CloudWatch, ALB, NLB, Route 53, SNS, AWS Backup, Amazon Inspector), GCP (GKE, Compute Engine), On-Premises Infrastructure.',
  'Infrastructure as Code : Terraform, Ansible, Shell, Bash Scripting, Infrastructure Provisioning, Configuration',
  '& Automation : Management, Deployment Automation.',
  'Containers & : Kubernetes, Amazon EKS, GKE, On-Premises Kubernetes, Docker, Helm Charts,',
  'Orchestration : Deployments, Services, Ingress, PV/PVC, Cluster Upgrades.',
  'CI/CD, SCM & GitOps : Jenkins, GitLab, Git, Argo CD, CI/CD Automation, Automated Build and Deployment Pipelines, GitOps, Versioned Container Images, Amazon ECR.',
  'Monitoring & Alerting : Prometheus, Grafana, Blackbox Exporter, Kubernetes Monitoring, Application and Infrastructure Monitoring, Custom Dashboards, Metrics, Alerting, Slack, Email, Twilio SMS.',
  'Security & DevSecOps : AWS IAM, Kubernetes RBAC, Security Groups, Firewall Policies, Trivy, SonarQube, Snyk, Amazon Inspector, Container/ECR Image Vulnerability Scanning, Security Hardening, Least-Privilege Access.',
  'Networking & DNS : AWS VPC, ALB/NLB, Cloudflare, DNS, Kubernetes Ingress, Network Security, Application Routing.',
  'Application & : Node.js, PM2, React, Java, Apache2, REST APIs, Microservices.',
  'Backend Technologies :',
  'Messaging, Caching & : RabbitMQ, Redis, Couchbase, MongoDB, MySQL, PostgreSQL.',
  'Databases :',
  'Platform & : Kubernetes Cluster Administration, Cluster/Node Group/Node Pool Upgrades, Add-on Management, Production Support, High Availability, Performance Optimization, Incident Management, Troubleshooting, Change Coordination.',
  'Production Operations :',
  'Professional Experience : -',
  'Project: - End-to-End DevOps Automation June 2025 – Present',
  'Role: - Senior DevOps Engineer | Cairs Solutions',
  'Technologies Used: AWS EKS, GKE, On-Premises Kubernetes, Terraform, Docker, Amazon ECR, ArgoCD, Jenkins, Git, Helm.',
  'Responsibilities: -',
  '• Manage AWS EKS, GKE, and on-premises Kubernetes clusters across Development, Staging, and Production environments.',
  '• Plan and perform Kubernetes cluster, node group/node pool, and add-on upgrades.',
  'Project: - End-to-End DevOps Automation July 2023 – May 2025',
  'Role: - DevOps Engineer | Techborn – IT Solutions.',
  'Technologies Used: Terraform, Kubernetes, Jenkins, Git, Redis. Responsibilities: -',
  '● Developed and deployed a scalable microservices architecture on AWS using EKS clusters.',
  'Project: - Cloud-Native Automation July 2021- June 2023',
  'Role: - DevOps Engineer | Techborn – IT Solutions.',
  'Technologies Used: Ansible, Terraform, Jenkins, AWS, Docker, Git Responsibilities: -',
  '● Led the development of a cloud automation platform using Terraform and Ansible.',
  'Project: - Enterprise-Level Monitoring and Automation Oct 2019 - July 2021',
  'Role: -DevOps Engineer | Techborn – IT Solutions.',
  'Technologies Used: AWS, Kubernetes, Prometheus, Grafana, Jenkins, GitLab, Helm Responsibilities: -',
  '● Engineered a scalable monitoring solution with Prometheus and Grafana on Kubernetes.',
  'Education: -',
  'Bachelor of Engineering - Methodist College of Engineering & Technology | 2015 - 2019'
];
const abhishekParsed = context.window.REZEImportEngine.classify({
  text: abhishekResume.join('\n'),
  lines: abhishekResume.map(text => ({ text, page: 1, source: 'abhishek-pdf-fixture' }))
}, 'abhishek-fixture');
const ad = abhishekParsed.data;
assert.equal(ad.name, 'Manhalli Vijay Sriker Abhishek Emmanuel');
assert.equal(ad.title, 'Senior DevOps Engineer');
assert.equal(ad.email, 'abhishekemmanuel99@gmail.com');
assert.equal(ad.phone, '+91-7993421089');
assert.match(ad.summary, /6\+ years of experience/);
assert.doesNotMatch(ad.summary, /Cloud Platforms|Terraform|Prometheus/);
assert.ok(ad.skillsGroups.length >= 8);
assert.ok(ad.skillsGroups.some(x => x.heading === 'Cloud Platforms' && /AWS/.test(x.description)));
assert.ok(ad.skillsGroups.some(x => x.heading === 'Infrastructure as Code & Automation' && /Terraform/.test(x.description)));
assert.ok(ad.skillsGroups.some(x => x.heading === 'Containers & Orchestration' && /Kubernetes/.test(x.description)));
assert.ok(ad.skillsGroups.some(x => x.heading === 'Application & Backend Technologies' && /Node\.js/.test(x.description)));
assert.equal(ad.experience.length, 4);
assert.deepEqual(ad.experience.map(x => x.role), ['Senior DevOps Engineer','DevOps Engineer','DevOps Engineer','DevOps Engineer']);
assert.equal(ad.experience[0].company, 'Cairs Solutions');
assert.equal(ad.experience[0].start, 'June 2025');
assert.equal(ad.experience[0].end, 'Present');
assert.match(ad.experience[0].details, /Project: End-to-End DevOps Automation/);
assert.match(ad.experience[0].details, /Technologies: AWS EKS/);
assert.match(ad.experience[0].details, /Manage AWS EKS/);
assert.equal(ad.experience[1].company, 'Techborn – IT Solutions.');
assert.equal(ad.experience[1].start, 'July 2023');
assert.equal(ad.experience[1].end, 'May 2025');
assert.equal(ad.experience[2].start, 'July 2021');
assert.equal(ad.experience[2].end, 'June 2023');
assert.equal(ad.experience[3].start, 'Oct 2019');
assert.equal(ad.experience[3].end, 'July 2021');
assert.equal(ad.education.length, 1);
assert.equal(ad.education[0].role, 'Bachelor of Engineering');
assert.equal(ad.education[0].company, 'Methodist College of Engineering & Technology');
assert.equal(ad.education[0].start, '2015');
assert.equal(ad.education[0].end, '2019');

console.log('Import engine fixture tests passed.');
