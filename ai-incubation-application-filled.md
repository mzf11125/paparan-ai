# AI Incubation for Public Sector - Application 2026

## Team / Organization Information

### Team / Organization Name
Paparan (BINUS University)

### Participation Category
Academic Institution

### Team Leader Name
Muhammad Zidan Fatonie

### Team Leader Email
muhammad.fatonie@binus.ac.id

### Team Leader WhatsApp Number
+62 812 3456 7890

---

## Team Profile

### Team Summary & Key Roles (max. 150 words)
Paparan team consists of 3 members with expertise in AI/ML, software development, and business development. Led by Muhammad Zidan Fatonie (AI/ML, System Architecture), our roles include Marcell (Business Development, stakeholder management) and Komang (Full-stack Development). We have successfully delivered Paparan Brief, an AI-powered policy intelligence system with delta detection and ASEAN specialization. Our team strength lies in combining technical AI capabilities with deep understanding of government policy needs and institutional formats.

### Portfolio Link
https://paparanbrief.com
https://paparanbreif.com
https://github.com/mzf11125/paparan-ai

---

## Best Project Description

### Describe Your Best Project (max. 150 words)
Paparan Brief aimed to solve information overload for policymakers by transforming fragmented data into structured, decision-ready briefs. We implemented multi-agent AI system using LangGraph and Anthropic Claude, integrating RAG with Tavily search and OSINT tools like Bellingcat. The solution achieved automatic delta detection (NEW/UPDATED/ESCALATED labels), RPJMN alignment scoring, and source traceability. Key challenges addressed included maintaining institutional format consistency while enabling AI-powered analysis. The project has been validated by working diplomats and is publicly accessible at paparanbrief.com.

---

## Use Case Applications

### How many use cases are you applying to?
Two

---

## Use Case 1

### Which problem owner are you applying to?
Bappenas (Badan Perencanaan Pembangunan Nasional - National Development Planning Agency)

### Proposal Deck (Use Case 1)
**Requirements:**
- Format: PDF / PPT
- Maximum: 10 slides
- Maximum size: 5 MB

**Cover the following points:**

#### 1. Problem Statement (specific to the public sector)
Bappenas analysts face overwhelming information overload. Policy documents, reports, and news arrive daily in fragmented formats. Manual synthesis takes hours and results in missed signals. There is no tool that tracks what changed across documents over time.

#### 2. AI Solution (approach & type of AI)
Paparan Brief uses multi-agent AI system with LangGraph orchestration. Technologies include LLMs (Claude), RAG (Tavily), vector search (PGVector), and specialized agents for scraping, analysis, and synthesis. Outputs follow strict 7-section institutional format.

#### 3. Data Requirements
Policy documents from Bappenas archives, public news feeds, sector code databases, and K/L classification systems. Data integration via Bappenas APIs. Volume: thousands of documents. Privacy handled via RLS, PII redaction, user data isolation.

#### 4. Simple Architecture (optional, added value)
User interface (Next.js) - API Layer (FastAPI) - Multi-Agent System (LangGraph) - Data Layer (Supabase, PGVector) - External Integrations (Bappenas APIs, Tavily, Bellingcat OSINT). Row-Level Security for controlled access.

#### 5. Use Case / Target Users (Ministry/Agency/Local Government)
Ministry/Agency: Bappenas. Primary users: policy analysts, planners, researchers. User workflow: upload documents or select topic, receive structured brief. Solution fits into existing document workflows.

#### 6. Expected Impact
Brief preparation time reduced from 2-4 hours to 15-30 minutes. Information coverage increases 3x with automatic multi-source retrieval. Delta detection provides temporal awareness. Source traceability ensures verifiability.

#### 7. MVP Plan (brief timeline)
Phase 1 (Weeks 1-2): Discovery, data access agreement, Bappenas API integration
Phase 2 (Weeks 3-4): Core development, Bappenas module, initial testing
Phase 3 (Weeks 5-6): Sandbox testing, user feedback, refinement
Total timeline: 8 weeks

#### 8. Risks & Mitigation
- Technical Risks: API integration delays. Mitigation: Alternative public sources, manual fallback
- Data/Privacy Risks: Sensitive document handling. Mitigation: PII redaction, RLS, audit logging
- Adoption Risks: User resistance. Mitigation: Training, user-centered design
- Resource Risks: Development capacity. Mitigation: Academic team with flexible schedule

#### 9. Team Profile & Background
Team has deep understanding of government policy needs. Relevant experience: direct collaboration with diplomats for requirements validation, understanding of RPJMN alignment and ASEAN policy frameworks. Technical capabilities: full-stack development (Next.js, FastAPI), AI/ML (LangGraph, Anthropic Claude), database (Supabase, PGVector).

---

## Use Case 2 (Optional - Skip if applying to one use case only)

### Which problem owner are you applying to?
BKPM (Badan Koordinasi Penanaman Modal - Investment Coordinating Board)

### Proposal Updates (Use Case 2)
[Focus only on key updates relevant to your selected use case. A full new deck is not required.]

#### 1. AI Solution
Same multi-agent AI core adapted for investment intelligence. New agents: corporate actor identification, investment screening, risk assessment. Shift from policy analysis to corporate entity tracking and due diligence support.

#### 2. Simple Architecture
Same architecture with BKPM OSS integration instead of Bappenas APIs. New data flow: corporate entities, investment records, licensing status from OSS database.

#### 3. Selected Use Case
Problem: BKPM investment officers need to conduct due diligence on hundreds of proposals with scattered corporate actor information. Challenge: time-sensitive decisions require fast, accurate intelligence but manual research leads to incomplete risk assessment.

#### 4. Expected Impact
Due diligence time reduced from 3-7 days to 4-8 hours. Corporate data coverage increases 3x with automatic multi-source synthesis. Risk detection accuracy improves with AI + human review. Consistent proposal processing format.

---

## Additional Information

### How did you hear about this programme?
[Select all that apply]
- [ ] Social Media
- [x] Website
- [ ] Referral
- [ ] Government Agency
- [ ] Partner Organization
- [ ] Event/Conference
- [ ] Email Newsletter
- [ ] Other: [specify]

---

## Terms & Conditions Agreement

By submitting this form, I hereby declare that:

### 1. Accuracy of Information
All information and documents submitted by me and/or my team during the registration process are truthful, accurate, and can be held accountable.

### 2. Participation Commitment
I am willing to participate in all stages of the AI Incubation for Public Sector program from start to finish, including:
- Curation
- Incubation
- Mentoring
- Piloting
- Demo day

### 3. Collaboration with Government
I understand that this program involves collaboration with government ministries and agencies, and I am willing to actively collaborate with them as problem owners in developing solutions.

### 4. Conflict of Interest
I declare that I have no conflict of interest and will not engage in any practices that violate the principles of integrity.

### 5. Confidentiality
I agree to comply with all terms related to access, use, and management of data provided during the program, including:
- Maintaining data confidentiality
- Sharing data as necessary to support the program and develop AI solutions
- Not misusing data
- Using data solely for the purpose of solution development within the program

The program organizers and partners will also maintain the confidentiality of participants' sensitive information in accordance with applicable regulations.

### 6. Compliance with Applicable Law
I am committed to:
1. Developing AI solutions that take into account ethical considerations, data security, privacy, and mitigation of bias and other risks.
2. Complying with all applicable laws and regulations in Indonesia.

### 7. Intellectual Property (IP)
1. I understand that the terms governing ownership and use of development outputs (IP) will be further defined in the program agreement, and I agree to comply with those terms.
2. I grant the organizers permission to use my team's name, logo, and solution description for program publication purposes.

### 8. Implementation Readiness
I declare that my team has the capacity and commitment to develop solutions through to the MVP/pilot stage during the program period.

### 9. Rights and Authority of the Organizer
I understand that the organizers have the right to:
1. Evaluate and determine participants' progression at each stage of the program.
2. Terminate my participation in the program if I fail to meet my commitments or violate any of the terms.

### 10. Limitation of Liability
Participants grant the organizers permission to use the team's name, logo, and solution description for program publication purposes.

### 11. Participation Limitation for Civil Servants (ASN)
For the purpose of maintaining fairness, objectivity, and avoiding potential conflicts of interest, participants who are civil servants or government employees are strongly advised to select a challenge statement outside their own ministry, agency, or institution.

---

**Declaration:**
[x] I have read, understood, and agreed to all terms and conditions applicable to the AI Incubation for Public Sector program.

---

## Preparation Checklist

Before submitting, ensure:

- [x] All required fields are filled
- [ ] Proposal deck meets requirements (PDF/PPT, max 10 slides, max 5 MB)
- [x] Portfolio link is accessible
- [x] All word count limits respected (150 words each)
- [x] WhatsApp number format is correct
- [x] Terms and conditions checkbox is selected
- [x] No sensitive personal information included

---

**Need help?** Contact: incubation@amana.id
