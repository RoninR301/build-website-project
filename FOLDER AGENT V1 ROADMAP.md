FOLDER AGENT V1 ROADMAP

PROJECT GOAL

Build a simple AI-powered workspace where:

- User creates a project
- User selects a folder
- Gemini API receives prompts
- AI scans the selected folder
- AI creates or updates files directly in that folder
- Project can be reopened later
- Folder acts as project memory
- Chat shows only activity logs
- Code is written directly to files
- No code viewer required

---

PHASE 1

FOUNDATION

Create Project System

Features:

- Create Project Button
- Project Name Input
- Save Project
- Recent Projects List

Files:

- index.html
- app.js
- storage.js

Success Criteria:

- User can create project
- Project appears in recent projects
- Project persists after refresh

---

PHASE 2

FOLDER ACCESS

Features:

- Select Folder
- Store Folder Handle
- Restore Folder Access
- Verify Permission

Files:

- folder-access.js

Success Criteria:

- User selects folder
- Folder remains linked to project
- Reopen project restores folder access

---

PHASE 3

PROJECT SCANNER

Features:

- Read Folder
- Scan Files
- Generate Project Summary
- Count Files

Files:

- folder-scanner.js

Success Criteria:

- Folder contents detected
- Summary generated
- Agent knows current project structure

---

PHASE 4

GEMINI CONNECTION

Features:

- Gemini API Key Input
- Save API Key
- Test Connection
- Send Prompt

Files:

- gemini-client.js

Success Criteria:

- Gemini responds successfully
- API key saved locally

---

PHASE 5

AI AGENT

Features:

- Chat Input
- Send Prompt
- Build Context
- Receive Actions

Files:

- ai-agent.js

Success Criteria:

- Prompt reaches Gemini
- Agent understands project context

---

PHASE 6

FILE WRITER

Features:

- Create File
- Update File
- Delete File
- Write To Selected Folder

Files:

- file-writer.js

Success Criteria:

- AI creates files
- AI updates files
- Changes appear in selected folder

---

PHASE 7

CHAT ACTIVITY LOG

Features:

- Activity Messages
- Build Status
- Success Messages

Files:

- ui.js

Success Criteria:

Display:

- Scanning Folder...
- Building Files...
- Updating Project...
- Completed

No code displayed.

---

PHASE 8

PROJECT REOPEN

Features:

- Open Existing Project
- Scan Folder Again
- Rebuild Context

Files:

- app.js
- folder-scanner.js

Success Criteria:

User can:

- Close app
- Reopen project
- Continue building

---

UI RULES

Dark Theme Only

Required:

- Modern cards
- Rounded corners
- Premium look
- Mobile first
- Fast animations

Not Required:

- Dashboard
- Analytics
- Charts
- Complex menus

---

STRICTLY NOT INCLUDED IN V1

- ZIP Import
- ZIP Export
- Preview Window
- Code Editor
- Terminal
- Git Integration
- Multi Agent
- Dependency Scanner
- Templates Marketplace
- Plugin System
- Team Collaboration
- Cloud Sync

---

FINAL V1 GOAL

User selects a folder.

User writes:

"Create ecommerce website"

AI scans folder.

AI creates files.

AI updates files.

Everything is saved.

User returns later.

Project continues from the same folder.