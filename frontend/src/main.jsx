import { StrictMode, useEffect, useState } from 'react';
import { Download, FileText, FolderOpen, LogIn, LogOut, MessageCircle, Save, Search, Send, ShieldCheck } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import './styles.css';

const API_BASE = 'http://localhost:8000';
const DEFAULT_TEMPLATE = 'Mutual-NDA-coverpage.md';

const standardTerms = `
## Standard Terms

1. **Introduction**. This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page) allows each party to disclose or make available information in connection with the Purpose.

2. **Use and Protection of Confidential Information**. The Receiving Party shall use Confidential Information solely for the Purpose, protect it using reasonable care, and not disclose it except as permitted by this agreement.

3. **Exceptions**. The Receiving Party's obligations do not apply to information that is publicly available, already known without restriction, rightfully obtained from a third party, or independently developed.

4. **Disclosures Required by Law**. The Receiving Party may disclose Confidential Information to the extent required by law, provided it gives reasonable advance notice where legally permitted.

5. **Term and Termination**. This MNDA commences on the Effective Date and expires at the end of the MNDA Term. Confidentiality obligations survive for the Term of Confidentiality.

6. **Return or Destruction**. Upon expiration, termination, or request, the Receiving Party will cease using and return or destroy Confidential Information, subject to lawful retention requirements.

7. **Proprietary Rights**. The Disclosing Party retains all rights in its Confidential Information.

8. **Disclaimer**. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTIES.

9. **Governing Law and Jurisdiction**. This MNDA is governed by the laws of the State of Governing Law. Proceedings must be instituted in the courts located in Jurisdiction.

10. **General**. This MNDA constitutes the entire agreement regarding its subject matter and may only be amended in writing signed by both parties.
`;

const initialForm = {
  purpose: 'Evaluating whether to enter into a business relationship with the other party.',
  effectiveDate: new Date().toISOString().slice(0, 10),
  mndaTerm: 'expires',
  mndaYears: '1',
  confidentialityTerm: 'one-year',
  confidentialityYears: '1',
  governingLaw: '',
  jurisdiction: '',
  modifications: '',
  party1: { name: '', title: '', company: '', address: '' },
  party2: { name: '', title: '', company: '', address: '' },
};

function formatDate(value) {
  if (!value) return '[Effective date]';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function getDocument(form) {
  const mndaTerm = form.mndaTerm === 'expires'
    ? `Expires ${form.mndaYears || '[number of years]'} year(s) from Effective Date.`
    : 'Continues until terminated in accordance with the terms of the MNDA.';
  const confidentialityTerm = form.confidentialityTerm === 'one-year'
    ? `${form.confidentialityYears || '[number of years]'} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
    : 'In perpetuity.';

  return `# Mutual Non-Disclosure Agreement

## Cover Page

### Purpose
${form.purpose || '[How Confidential Information may be used]'}

### Effective Date
${formatDate(form.effectiveDate)}

### MNDA Term
${mndaTerm}

### Term of Confidentiality
${confidentialityTerm}

### Governing Law & Jurisdiction
Governing Law: ${form.governingLaw || '[State]'}

Jurisdiction: ${form.jurisdiction || '[City, county, or state]'}

### MNDA Modifications
${form.modifications || 'None.'}

By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.

| | Party 1 | Party 2 |
| --- | --- | --- |
| Print Name | ${form.party1.name || '[Name]'} | ${form.party2.name || '[Name]'} |
| Title | ${form.party1.title || '[Title]'} | ${form.party2.title || '[Title]'} |
| Company | ${form.party1.company || '[Company]'} | ${form.party2.company || '[Company]'} |
| Notice Address | ${form.party1.address || '[Address]'} | ${form.party2.address || '[Address]'} |
| Signature | | |
| Date | | |

${standardTerms}

Common Paper Mutual Non-Disclosure Agreement (Version 1.0), free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
`;
}

function Field({ label, hint, children }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function PartyFields({ number, party, onChange }) {
  return (
    <fieldset className="party-block">
      <legend>Party {number}</legend>
      <Field label="Print name"><input value={party.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Full name" /></Field>
      <Field label="Title"><input value={party.title} onChange={(event) => onChange('title', event.target.value)} placeholder="Authorized signatory" /></Field>
      <Field label="Company"><input value={party.company} onChange={(event) => onChange('company', event.target.value)} placeholder="Legal company name" /></Field>
      <Field label="Notice address" hint="Use an email or postal address."><input value={party.address} onChange={(event) => onChange('address', event.target.value)} placeholder="notices@company.com" /></Field>
    </fieldset>
  );
}

function parseChatMessage(message, currentForm) {
  const text = message.trim();
  const lowerText = text.toLowerCase();
  const updates = {};
  const partyUpdates = {};
  const captured = [];

  const purposeMatch = text.match(/purpose(?: is|:)?\s+(.+?)(?:\.|$)/i);
  const lawMatch = text.match(/(?:governing law|law)\s+(?:is|:)?\s+([A-Za-z .'-]+?)(?:\s+and\s+jurisdiction|\.|$)/i);
  const jurisdictionMatch = text.match(/jurisdiction\s+(?:is|:)?\s+(.+?)(?:\.|$)/i);
  const dateMatch = text.match(/(?:effective date|effective)\s+(?:is|:)?\s*(\d{4}-\d{2}-\d{2})/i);
  const yearsMatch = text.match(/(?:term|expires?)\D{0,20}(\d+)\s+years?/i);
  const confidentialityMatch = text.match(/confidentiality\D{0,20}(\d+)\s+years?/i);
  const partyMatch = text.match(/party\s*([12])\D+(?:name\s+)?(?:is|:)?\s*([^,.;]+)(?:,\s*([^,.;]+))?(?:,\s*([^,.;]+))?/i);

  if (purposeMatch) {
    updates.purpose = purposeMatch[1].trim();
    captured.push('purpose');
  }
  if (lawMatch) {
    updates.governingLaw = lawMatch[1].trim();
    captured.push('governing law');
  }
  if (jurisdictionMatch) {
    updates.jurisdiction = jurisdictionMatch[1].trim();
    captured.push('jurisdiction');
  }
  if (dateMatch) {
    updates.effectiveDate = dateMatch[1];
    captured.push('effective date');
  }
  if (yearsMatch) {
    updates.mndaYears = yearsMatch[1];
    updates.mndaTerm = 'expires';
    captured.push('MNDA term');
  } else if (lowerText.includes('until terminated') || lowerText.includes('ongoing')) {
    updates.mndaTerm = 'ongoing';
    captured.push('MNDA term');
  }
  if (confidentialityMatch) {
    updates.confidentialityYears = confidentialityMatch[1];
    updates.confidentialityTerm = 'one-year';
    captured.push('confidentiality term');
  } else if (lowerText.includes('confidentiality') && lowerText.includes('perpetuity')) {
    updates.confidentialityTerm = 'perpetuity';
    captured.push('confidentiality term');
  }
  if (partyMatch) {
    const partyKey = `party${partyMatch[1]}`;
    partyUpdates[partyKey] = {
      ...currentForm[partyKey],
      name: partyMatch[2].trim(),
      title: partyMatch[3]?.trim() || currentForm[partyKey].title,
      company: partyMatch[4]?.trim() || currentForm[partyKey].company,
    };
    captured.push(`party ${partyMatch[1]}`);
  }

  return {
    form: { ...currentForm, ...updates, ...partyUpdates },
    reply: captured.length > 0
      ? `I updated ${captured.join(', ')}. Keep going with another detail, or review the fields beside this conversation.`
      : 'Tell me details such as the purpose, effective date, governing law, jurisdiction, term, or party information. For example: “The purpose is evaluating a partnership, governed by Delaware law.”',
  };
}

function ChatPanel({ messages, value, onChange, onSubmit }) {
  return (
    <section className="chat-panel" aria-label="Agreement assistant">
      <div className="chat-heading"><div><p className="eyebrow">Draft assistant</p><h3>Tell me about the agreement</h3></div><MessageCircle size={20} /></div>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="2" placeholder="Example: We need a one-year NDA for evaluating a partnership..." aria-label="Message the agreement assistant" />
        <button type="submit" aria-label="Send message" title="Send message"><Send size={16} /></button>
      </form>
    </section>
  );
}

function AccountStrip({ user, mode, email, password, error, savedDrafts, onModeChange, onEmailChange, onPasswordChange, onSubmit, onOpenDraft, onSaveDraft, onSignOut }) {
  if (user) {
    return (
      <section className="account-strip signed-in">
        <div><p className="eyebrow">Signed in</p><strong>{user.email}</strong></div>
        <div className="saved-drafts"><FolderOpen size={16} /><span>{savedDrafts.length} saved draft{savedDrafts.length === 1 ? '' : 's'}</span>{savedDrafts.map((draft) => <button key={draft.id} type="button" onClick={() => onOpenDraft(draft)}>{draft.title}</button>)}</div>
        <div className="account-actions"><button className="quiet-button" type="button" onClick={onSaveDraft}><Save size={15} /> Save draft</button><button className="quiet-button" type="button" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div>
      </section>
    );
  }

  return (
    <section className="account-strip">
      <div className="account-copy"><p className="eyebrow">Your workspace</p><h2>{mode === 'signin' ? 'Sign in to reopen drafts' : 'Create your drafting workspace'}</h2><p>Save agreements in this browser and return to them later.</p></div>
      <form className="auth-form" onSubmit={onSubmit}>
        <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="you@company.com" aria-label="Email address" required />
        <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Password" aria-label="Password" minLength="8" required />
        <button className="download-button" type="submit"><LogIn size={15} /> {mode === 'signin' ? 'Sign in' : 'Sign up'}</button>
      </form>
      <div className="auth-footer"><button type="button" onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Need an account? Sign up' : 'Already registered? Sign in'}</button>{error && <span role="alert">{error}</span>}</div>
    </section>
  );
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState('cover');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);
  const [templateContent, setTemplateContent] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [authUser, setAuthUser] = useState(() => JSON.parse(localStorage.getItem('prelegal-user') || 'null'));
  const [authMode, setAuthMode] = useState('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'I can help fill this Mutual NDA. What is the agreement for, and who are the parties?' },
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/api/templates`)
      .then((response) => response.ok ? response.json() : [])
      .then((items) => {
        setTemplates(items);
        if (items.some((item) => item.filename === DEFAULT_TEMPLATE)) {
          setSelectedTemplate(DEFAULT_TEMPLATE);
        } else if (items.length > 0) {
          setSelectedTemplate(items[0].filename);
        }
      })
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (!selectedTemplate) return;

    fetch(`${API_BASE}/api/templates/${encodeURIComponent(selectedTemplate)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((item) => {
        setTemplateContent(item ? item.content : '');
      })
      .catch(() => setTemplateContent(''));
  }, [selectedTemplate]);

  useEffect(() => {
    if (!authUser) {
      setSavedDrafts([]);
      return;
    }
    setSavedDrafts(JSON.parse(localStorage.getItem(`prelegal-drafts-${authUser.email}`) || '[]'));
  }, [authUser]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateParty = (party, key, value) => setForm((current) => ({ ...current, [party]: { ...current[party], [key]: value } }));
  const sendChatMessage = (event) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message) return;

    const result = parseChatMessage(message, form);
    setForm(result.form);
    setChatMessages((current) => [...current, { role: 'user', content: message }, { role: 'assistant', content: result.reply }]);
    setChatInput('');
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE}/api/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Unable to authenticate');
      const user = payload.user;
      localStorage.setItem('prelegal-user', JSON.stringify(user));
      setAuthUser(user);
      setAuthPassword('');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const saveDraft = () => {
    if (!authUser) return;
    const draft = {
      id: `${Date.now()}`,
      title: selectedTemplateTitle,
      template: selectedTemplate,
      form,
      content: templateContent,
      updatedAt: new Date().toISOString(),
    };
    const nextDrafts = [draft, ...savedDrafts.filter((item) => item.template !== selectedTemplate)].slice(0, 10);
    localStorage.setItem(`prelegal-drafts-${authUser.email}`, JSON.stringify(nextDrafts));
    setSavedDrafts(nextDrafts);
  };

  const openDraft = (draft) => {
    setSelectedTemplate(draft.template);
    setForm(draft.form);
    setTemplateContent(draft.content || '');
  };

  const signOut = () => {
    localStorage.removeItem('prelegal-user');
    setAuthUser(null);
  };

  const download = () => {
    const documentText = selectedTemplate === DEFAULT_TEMPLATE ? getDocument(form) : (templateContent || getDocument(form));

    if (selectedTemplate !== DEFAULT_TEMPLATE) {
      const blob = new Blob([documentText], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${selectedTemplate.replace(/\.[^.]+$/, '')}.md`;
      downloadLink.click();
      URL.revokeObjectURL(url);
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const lineHeight = 6;
    let y = margin;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    documentText.split('\n').forEach((line) => {
      const plainText = line.replace(/^#{1,6}\s/, '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
      const wrappedLines = pdf.splitTextToSize(plainText || ' ', pageWidth - margin * 2);
      wrappedLines.forEach((wrappedLine) => {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(wrappedLine, margin, y);
        y += lineHeight;
      });
    });

    pdf.save('mutual-nda.pdf');
  };

  const activeTemplate = templates.find((item) => item.filename === selectedTemplate) || { name: 'Mutual NDA', filename: DEFAULT_TEMPLATE };
  const selectedTemplateTitle = activeTemplate.name || 'Template';
  const filteredTemplates = templates.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(templateSearch.toLowerCase()));
  const unsupportedTemplateMessage = templateSearch.trim() && filteredTemplates.length === 0
    ? `We do not have a template matching “${templateSearch}”. Try one of the available agreements below, such as ${templates[0]?.name || 'Mutual NDA'}.`
    : '';

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Pre-Legal home"><span className="brand-mark"><ShieldCheck size={19} /></span><span>pre-legal</span></a>
        <div className="header-meta"><span className="status-dot" /> Draft workspace <span className="divider" /> {selectedTemplateTitle}</div>
      </header>
      <AccountStrip user={authUser} mode={authMode} email={authEmail} password={authPassword} error={authError} savedDrafts={savedDrafts} onModeChange={setAuthMode} onEmailChange={setAuthEmail} onPasswordChange={setAuthPassword} onSubmit={handleAuth} onOpenDraft={openDraft} onSaveDraft={saveDraft} onSignOut={signOut} />
      <section className="intro">
        <div>
          <p className="eyebrow">Document builder / 01</p>
          <h1>{selectedTemplateTitle}</h1>
          <p className="lede">Shape a clear agreement, then export the finished draft for review.</p>
        </div>
        <div className="intro-actions"><button className="download-button" onClick={download}><Download size={17} /> Download</button>{authUser && <button className="secondary-button" onClick={saveDraft}><Save size={16} /> Save draft</button>}</div>
      </section>
      <div className="workspace">
        <section className="panel form-panel">
          <div className="panel-heading"><div><p className="eyebrow">Agreement details</p><h2>Choose a document</h2></div><FileText size={22} /></div>
          <div className="form-content">
            <div className="library-heading"><div><div className="section-label">Document library</div><p className="library-copy">Choose from every agreement currently supported by Pre-Legal.</p></div><Search size={18} /></div>
            <Field label="Search templates"><input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Search by agreement name" /></Field>
            {unsupportedTemplateMessage && <p className="unsupported-message" role="status">{unsupportedTemplateMessage}</p>}
            <Field label="Document type">
              <select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)}>
                {(filteredTemplates.length > 0 ? filteredTemplates : templates).map((item) => (
                  <option key={item.filename} value={item.filename}>{item.name}</option>
                ))}
              </select>
            </Field>
            <p className="template-description">{activeTemplate.description || 'Mutual Non-Disclosure Agreement with a cover page and standard terms.'}</p>

            {selectedTemplate === DEFAULT_TEMPLATE && <ChatPanel messages={chatMessages} value={chatInput} onChange={setChatInput} onSubmit={sendChatMessage} />}

            {selectedTemplate === DEFAULT_TEMPLATE && (
              <>
                <div className="section-label">01 / Purpose & timing</div>
                <Field label="Purpose"><textarea rows="3" value={form.purpose} onChange={(event) => update('purpose', event.target.value)} /></Field>
                <div className="two-column"><Field label="Effective date"><input type="date" value={form.effectiveDate} onChange={(event) => update('effectiveDate', event.target.value)} /></Field><Field label="Governing law"><input value={form.governingLaw} onChange={(event) => update('governingLaw', event.target.value)} placeholder="e.g. Delaware" /></Field></div>
                <Field label="Jurisdiction"><input value={form.jurisdiction} onChange={(event) => update('jurisdiction', event.target.value)} placeholder="e.g. courts located in Wilmington, DE" /></Field>
                <div className="two-column"><Field label="MNDA term"><select value={form.mndaTerm} onChange={(event) => update('mndaTerm', event.target.value)}><option value="expires">Expires after a set period</option><option value="ongoing">Continues until terminated</option></select></Field>{form.mndaTerm === 'expires' && <Field label="Length in years"><input type="number" min="1" value={form.mndaYears} onChange={(event) => update('mndaYears', event.target.value)} /></Field>}</div>
                <div className="two-column"><Field label="Confidentiality term"><select value={form.confidentialityTerm} onChange={(event) => update('confidentialityTerm', event.target.value)}><option value="one-year">Set period + trade secrets</option><option value="perpetuity">In perpetuity</option></select></Field>{form.confidentialityTerm === 'one-year' && <Field label="Length in years"><input type="number" min="1" value={form.confidentialityYears} onChange={(event) => update('confidentialityYears', event.target.value)} /></Field>}</div>
                <Field label="Modifications" hint="Optional changes to the standard terms."><textarea rows="3" value={form.modifications} onChange={(event) => update('modifications', event.target.value)} placeholder="No modifications" /></Field>
                <div className="section-label party-label">02 / Signing parties</div>
                <div className="party-grid"><PartyFields number="1" party={form.party1} onChange={(key, value) => updateParty('party1', key, value)} /><PartyFields number="2" party={form.party2} onChange={(key, value) => updateParty('party2', key, value)} /></div>
              </>
            )}
          </div>
        </section>
        <section className="panel preview-panel">
          <div className="preview-header"><div><p className="eyebrow">Live document</p><h2>Preview</h2></div><span className="autosave">Updates as you type</span></div>
          {selectedTemplate === DEFAULT_TEMPLATE ? (
            <>
              <div className="tabs" role="tablist"><button className={activeTab === 'cover' ? 'active' : ''} onClick={() => setActiveTab('cover')}>Cover page</button><button className={activeTab === 'terms' ? 'active' : ''} onClick={() => setActiveTab('terms')}>Standard terms</button></div>
              <article className="document-preview">
                {activeTab === 'cover' ? <><p className="document-kicker">COMMON PAPER / VERSION 1.0</p><h3>Mutual Non-Disclosure Agreement</h3><div className="document-rule" /><h4>Purpose</h4><p>{form.purpose || '[How Confidential Information may be used]'}</p><h4>Effective Date</h4><p>{formatDate(form.effectiveDate)}</p><div className="preview-grid"><div><h4>MNDA Term</h4><p>{form.mndaTerm === 'expires' ? `${form.mndaYears || '[ ]'} year(s) from Effective Date` : 'Until terminated'}</p></div><div><h4>Confidentiality</h4><p>{form.confidentialityTerm === 'one-year' ? `${form.confidentialityYears || '[ ]'} year(s) + trade secrets` : 'In perpetuity'}</p></div></div><h4>Governing Law & Jurisdiction</h4><p>{form.governingLaw || '[State]'} / {form.jurisdiction || '[Jurisdiction]'}</p><h4>Parties</h4><div className="party-summary"><div><strong>{form.party1.company || 'Party 1'}</strong><span>{form.party1.name || 'Name pending'}</span></div><div><strong>{form.party2.company || 'Party 2'}</strong><span>{form.party2.name || 'Name pending'}</span></div></div><div className="signature-lines"><span>Signature</span><span>Signature</span></div></> : <div className="terms-preview">{standardTerms.split('\n').map((line, index) => <p key={index}>{line || '\u00a0'}</p>)}</div>}
              </article>
            </>
          ) : (
            <article className="document-preview template-document-preview">
              <p className="document-kicker">{selectedTemplate}</p>
              <h3>{selectedTemplateTitle}</h3>
              {templateContent ? templateContent.split('\n').map((line, index) => <p key={index}>{line || '\u00a0'}</p>) : <p>Loading template...</p>}
            </article>
          )}
        </section>
      </div>
      <footer><span>Template library: {templates.length || 1} documents</span><span className="legal-disclaimer">Draft, subject to legal review. Pre-Legal does not provide legal advice.</span><span>Pre-Legal</span></footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
