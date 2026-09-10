import { StrictMode, useState } from 'react';
import { Download, FileText, ShieldCheck } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import './styles.css';

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

function App() {
  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState('cover');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateParty = (party, key, value) => setForm((current) => ({ ...current, [party]: { ...current[party], [key]: value } }));
  const download = () => {
    const blob = new Blob([getDocument(form)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mutual-nda.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Pre-Legal home"><span className="brand-mark"><ShieldCheck size={19} /></span><span>pre-legal</span></a>
        <div className="header-meta"><span className="status-dot" /> Draft workspace <span className="divider" /> Mutual NDA</div>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">Document builder / 01</p>
          <h1>Mutual NDA</h1>
          <p className="lede">Shape a clear agreement between two parties, then take the finished document with you.</p>
        </div>
        <button className="download-button" onClick={download}><Download size={17} /> Download .md</button>
      </section>
      <div className="workspace">
        <section className="panel form-panel">
          <div className="panel-heading"><div><p className="eyebrow">Agreement details</p><h2>Build your cover page</h2></div><FileText size={22} /></div>
          <div className="form-content">
            <div className="section-label">01 / Purpose & timing</div>
            <Field label="Purpose"><textarea rows="3" value={form.purpose} onChange={(event) => update('purpose', event.target.value)} /></Field>
            <div className="two-column"><Field label="Effective date"><input type="date" value={form.effectiveDate} onChange={(event) => update('effectiveDate', event.target.value)} /></Field><Field label="Governing law"><input value={form.governingLaw} onChange={(event) => update('governingLaw', event.target.value)} placeholder="e.g. Delaware" /></Field></div>
            <Field label="Jurisdiction"><input value={form.jurisdiction} onChange={(event) => update('jurisdiction', event.target.value)} placeholder="e.g. courts located in Wilmington, DE" /></Field>
            <div className="two-column"><Field label="MNDA term"><select value={form.mndaTerm} onChange={(event) => update('mndaTerm', event.target.value)}><option value="expires">Expires after a set period</option><option value="ongoing">Continues until terminated</option></select></Field>{form.mndaTerm === 'expires' && <Field label="Length in years"><input type="number" min="1" value={form.mndaYears} onChange={(event) => update('mndaYears', event.target.value)} /></Field>}</div>
            <div className="two-column"><Field label="Confidentiality term"><select value={form.confidentialityTerm} onChange={(event) => update('confidentialityTerm', event.target.value)}><option value="one-year">Set period + trade secrets</option><option value="perpetuity">In perpetuity</option></select></Field>{form.confidentialityTerm === 'one-year' && <Field label="Length in years"><input type="number" min="1" value={form.confidentialityYears} onChange={(event) => update('confidentialityYears', event.target.value)} /></Field>}</div>
            <Field label="Modifications" hint="Optional changes to the standard terms."><textarea rows="3" value={form.modifications} onChange={(event) => update('modifications', event.target.value)} placeholder="No modifications" /></Field>
            <div className="section-label party-label">02 / Signing parties</div>
            <div className="party-grid"><PartyFields number="1" party={form.party1} onChange={(key, value) => updateParty('party1', key, value)} /><PartyFields number="2" party={form.party2} onChange={(key, value) => updateParty('party2', key, value)} /></div>
          </div>
        </section>
        <section className="panel preview-panel">
          <div className="preview-header"><div><p className="eyebrow">Live document</p><h2>Preview</h2></div><span className="autosave">Updates as you type</span></div>
          <div className="tabs" role="tablist"><button className={activeTab === 'cover' ? 'active' : ''} onClick={() => setActiveTab('cover')}>Cover page</button><button className={activeTab === 'terms' ? 'active' : ''} onClick={() => setActiveTab('terms')}>Standard terms</button></div>
          <article className="document-preview">
            {activeTab === 'cover' ? <><p className="document-kicker">COMMON PAPER / VERSION 1.0</p><h3>Mutual Non-Disclosure Agreement</h3><div className="document-rule" /><h4>Purpose</h4><p>{form.purpose || '[How Confidential Information may be used]'}</p><h4>Effective Date</h4><p>{formatDate(form.effectiveDate)}</p><div className="preview-grid"><div><h4>MNDA Term</h4><p>{form.mndaTerm === 'expires' ? `${form.mndaYears || '[ ]'} year(s) from Effective Date` : 'Until terminated'}</p></div><div><h4>Confidentiality</h4><p>{form.confidentialityTerm === 'one-year' ? `${form.confidentialityYears || '[ ]'} year(s) + trade secrets` : 'In perpetuity'}</p></div></div><h4>Governing Law & Jurisdiction</h4><p>{form.governingLaw || '[State]'} / {form.jurisdiction || '[Jurisdiction]'}</p><h4>Parties</h4><div className="party-summary"><div><strong>{form.party1.company || 'Party 1'}</strong><span>{form.party1.name || 'Name pending'}</span></div><div><strong>{form.party2.company || 'Party 2'}</strong><span>{form.party2.name || 'Name pending'}</span></div></div><div className="signature-lines"><span>Signature</span><span>Signature</span></div></> : <div className="terms-preview">{standardTerms.split('\n').map((line, index) => <p key={index}>{line || '\u00a0'}</p>)}</div>}
          </article>
        </section>
      </div>
      <footer><span>Source template: Common Paper Mutual NDA</span><span>CC BY 4.0</span></footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);