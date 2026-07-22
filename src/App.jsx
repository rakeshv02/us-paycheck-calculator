
const { useState, useCallback } = React;

const FEDERAL_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  married_separate: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  head: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTIONS = { single: 14600, married: 29200, married_separate: 14600, head: 21900 };

const STATE_TAXES = {
  AL: { name: "Alabama", rate: 0.05 }, AK: { name: "Alaska", rate: 0, noTax: true },
  AZ: { name: "Arizona", rate: 0.025 }, AR: { name: "Arkansas", rate: 0.044 },
  CA: { name: "California", rate: 0.093 }, CO: { name: "Colorado", rate: 0.044 },
  CT: { name: "Connecticut", rate: 0.065 }, DE: { name: "Delaware", rate: 0.066 },
  FL: { name: "Florida", rate: 0, noTax: true }, GA: { name: "Georgia", rate: 0.055 },
  HI: { name: "Hawaii", rate: 0.11 }, ID: { name: "Idaho", rate: 0.058 },
  IL: { name: "Illinois", rate: 0.0495 }, IN: { name: "Indiana", rate: 0.0315 },
  IA: { name: "Iowa", rate: 0.046 }, KS: { name: "Kansas", rate: 0.057 },
  KY: { name: "Kentucky", rate: 0.045 }, LA: { name: "Louisiana", rate: 0.06 },
  ME: { name: "Maine", rate: 0.075 }, MD: { name: "Maryland", rate: 0.0575 },
  MA: { name: "Massachusetts", rate: 0.09 }, MI: { name: "Michigan", rate: 0.0425 },
  MN: { name: "Minnesota", rate: 0.0985 }, MS: { name: "Mississippi", rate: 0.047 },
  MO: { name: "Missouri", rate: 0.048 }, MT: { name: "Montana", rate: 0.059 },
  NE: { name: "Nebraska", rate: 0.0664 }, NV: { name: "Nevada", rate: 0, noTax: true },
  NH: { name: "New Hampshire", rate: 0, noTax: true }, NJ: { name: "New Jersey", rate: 0.0897 },
  NM: { name: "New Mexico", rate: 0.059 }, NY: { name: "New York", rate: 0.0685 },
  NC: { name: "North Carolina", rate: 0.045 }, ND: { name: "North Dakota", rate: 0.025 },
  OH: { name: "Ohio", rate: 0.04 }, OK: { name: "Oklahoma", rate: 0.0475 },
  OR: { name: "Oregon", rate: 0.099 }, PA: { name: "Pennsylvania", rate: 0.0307 },
  RI: { name: "Rhode Island", rate: 0.0599 }, SC: { name: "South Carolina", rate: 0.07 },
  SD: { name: "South Dakota", rate: 0, noTax: true }, TN: { name: "Tennessee", rate: 0, noTax: true },
  TX: { name: "Texas", rate: 0, noTax: true }, UT: { name: "Utah", rate: 0.0485 },
  VT: { name: "Vermont", rate: 0.0875 }, VA: { name: "Virginia", rate: 0.0575 },
  WA: { name: "Washington", rate: 0, noTax: true }, WV: { name: "West Virginia", rate: 0.065 },
  WI: { name: "Wisconsin", rate: 0.0765 }, WY: { name: "Wyoming", rate: 0, noTax: true },
  DC: { name: "Washington D.C.", rate: 0.0895 },
};

const PAY_PERIODS = { annual: 1, monthly: 12, biweekly: 26, weekly: 52 };

function calcFederalTax(taxableIncome, filingStatus) {
  const brackets = FEDERAL_BRACKETS_2024[filingStatus];
  let tax = 0;
  for (const b of brackets) {
    if (taxableIncome <= b.min) break;
    const taxable = Math.min(taxableIncome, b.max) - b.min;
    tax += taxable * b.rate;
  }
  return tax;
}

function fmt(n) {
  return "$" + Math.round(n).toLocaleString();
}

function pct(n) {
  return (n * 100).toFixed(1) + "%";
}

export default function USPaycheckCalculator() {
  const [salary, setSalary] = useState("75000");
  const [filingStatus, setFilingStatus] = useState("single");
  const [state, setState] = useState("TX");
  const [payFreq, setPayFreq] = useState("biweekly");
  const [additionalWithholding, setAdditionalWithholding] = useState("0");
  const [retirement401k, setRetirement401k] = useState("5");
  const [result, setResult] = useState(null);

  const calculate = useCallback(() => {
    const grossAnnual = parseFloat(salary) || 0;
    const retirePct = (parseFloat(retirement401k) || 0) / 100;
    const extraW = parseFloat(additionalWithholding) || 0;
    const periods = PAY_PERIODS[payFreq];

    const retirement401kAmt = Math.min(grossAnnual * retirePct, 23000);
    const adjustedGross = grossAnnual - retirement401kAmt;

    const standardDeduction = STANDARD_DEDUCTIONS[filingStatus];
    const taxableIncome = Math.max(0, adjustedGross - standardDeduction);

    const federalTax = calcFederalTax(taxableIncome, filingStatus);

    const ssTaxableWage = Math.min(grossAnnual, 168600);
    const socialSecurity = ssTaxableWage * 0.062;
    const medicare = grossAnnual * 0.0145 + Math.max(0, grossAnnual - 200000) * 0.009;

    const stateData = STATE_TAXES[state];
    const stateTax = stateData.noTax ? 0 : adjustedGross * stateData.rate;

    const additionalAnnual = extraW * periods;
    const totalTax = federalTax + socialSecurity + medicare + stateTax + additionalAnnual;
    const netAnnual = grossAnnual - totalTax - retirement401kAmt;

    const effectiveRate = grossAnnual > 0 ? totalTax / grossAnnual : 0;

    setResult({
      grossAnnual, netAnnual, federalTax, socialSecurity, medicare,
      stateTax, retirement401kAmt, totalTax, effectiveRate,
      periods, stateData,
      perPeriod: {
        gross: grossAnnual / periods,
        net: netAnnual / periods,
        federal: federalTax / periods,
        ss: socialSecurity / periods,
        medicare: medicare / periods,
        state: stateTax / periods,
        retire: retirement401kAmt / periods,
      }
    });
  }, [salary, filingStatus, state, payFreq, additionalWithholding, retirement401k]);

  const periodLabel = { annual: "Annual", monthly: "Monthly", biweekly: "Bi-weekly", weekly: "Weekly" }[payFreq];

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: "#f0f4ff", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🇺🇸</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#1a1a2e" }}>US Paycheck Calculator</h1>
          <p style={{ margin: "8px 0 0", color: "#555", fontSize: 16 }}>Federal + State taxes, FICA, and 401(k) — 2024 tax year</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#333" }}>Annual Gross Salary</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666", fontWeight: 600 }}>$</span>
                <input type="number" value={salary} onChange={e => setSalary(e.target.value)}
                  style={{ width: "100%", padding: "12px 12px 12px 28px", border: "2px solid #e0e7ff", borderRadius: 10, fontSize: 16, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#333" }}>Filing Status</label>
              <select value={filingStatus} onChange={e => setFilingStatus(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "2px solid #e0e7ff", borderRadius: 10, fontSize: 15, background: "#fff", outline: "none" }}>
                <option value="single">Single</option>
                <option value="married">Married Filing Jointly</option>
                <option value="married_separate">Married Filing Separately</option>
                <option value="head">Head of Household</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#333" }}>State</label>
              <select value={state} onChange={e => setState(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "2px solid #e0e7ff", borderRadius: 10, fontSize: 15, background: "#fff", outline: "none" }}>
                {Object.entries(STATE_TAXES).sort((a,b) => a[1].name.localeCompare(b[1].name)).map(([code, s]) => (
                  <option key={code} value={code}>{s.name}{s.noTax ? " (No income tax)" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#333" }}>Pay Frequency</label>
              <select value={payFreq} onChange={e => setPayFreq(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "2px solid #e0e7ff", borderRadius: 10, fontSize: 15, background: "#fff", outline: "none" }}>
                <option value="annual">Annual (1x/year)</option>
                <option value="monthly">Monthly (12x/year)</option>
                <option value="biweekly">Bi-weekly (26x/year)</option>
                <option value="weekly">Weekly (52x/year)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#333" }}>401(k) Contribution (%)</label>
              <div style={{ position: "relative" }}>
                <input type="number" value={retirement401k} min="0" max="100" onChange={e => setRetirement401k(e.target.value)}
                  style={{ width: "100%", padding: "12px 32px 12px 12px", border: "2px solid #e0e7ff", borderRadius: 10, fontSize: 16, boxSizing: "border-box", outline: "none" }} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#666", fontWeight: 600 }}>%</span>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#333" }}>Extra Withholding (per paycheck)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666", fontWeight: 600 }}>$</span>
                <input type="number" value={additionalWithholding} min="0" onChange={e => setAdditionalWithholding(e.target.value)}
                  style={{ width: "100%", padding: "12px 12px 12px 28px", border: "2px solid #e0e7ff", borderRadius: 10, fontSize: 16, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>
          </div>
          <button onClick={calculate}
            style={{ width: "100%", marginTop: 24, padding: "16px", background: "linear-gradient(135deg, #3b5bdb, #1971c2)", color: "#fff", border: "none", borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}>
            Calculate My Paycheck
          </button>
        </div>

        {result && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: `${periodLabel} Gross`, value: fmt(result.perPeriod.gross), color: "#3b5bdb", bg: "#eef2ff" },
                { label: `${periodLabel} Take-Home`, value: fmt(result.perPeriod.net), color: "#2f9e44", bg: "#ebfbee" },
                { label: `${periodLabel} Taxes`, value: fmt((result.totalTax - result.retirement401kAmt) / result.periods), color: "#e03131", bg: "#fff5f5" },
                { label: "Effective Tax Rate", value: pct(result.effectiveRate), color: "#e67700", bg: "#fff9db" },
              ].map((item, i) => (
                <div key={i} style={{ background: item.bg, borderRadius: 14, padding: 20, textAlign: "center", border: `2px solid ${item.color}22` }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 4, fontWeight: 500 }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Annual Breakdown</h3>
                {[
                  { label: "Gross Salary", value: fmt(result.grossAnnual), bold: true },
                  { label: "401(k) Pre-tax", value: `−${fmt(result.retirement401kAmt)}`, color: "#7950f2" },
                  { label: "Federal Income Tax", value: `−${fmt(result.federalTax)}`, color: "#e03131" },
                  { label: `${result.stateData.name} State Tax`, value: result.stateData.noTax ? "−$0 ✓" : `−${fmt(result.stateTax)}`, color: result.stateData.noTax ? "#2f9e44" : "#e03131" },
                  { label: "Social Security (6.2%)", value: `−${fmt(result.socialSecurity)}`, color: "#e03131" },
                  { label: "Medicare (1.45%+)", value: `−${fmt(result.medicare)}`, color: "#e03131" },
                  { label: "Annual Take-Home", value: fmt(result.netAnnual), bold: true, color: "#2f9e44", border: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: row.border ? "2px solid #e9ecef" : "1px solid #f1f3f5", marginTop: row.border ? 4 : 0 }}>
                    <span style={{ fontSize: 14, color: "#444", fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: row.bold ? 700 : 600, color: row.color || "#222" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{periodLabel} Paycheck</h3>
                {[
                  { label: "Gross Pay", value: fmt(result.perPeriod.gross), bold: true },
                  { label: "401(k)", value: `−${fmt(result.perPeriod.retire)}`, color: "#7950f2" },
                  { label: "Federal Tax", value: `−${fmt(result.perPeriod.federal)}`, color: "#e03131" },
                  { label: "State Tax", value: result.stateData.noTax ? "−$0 ✓" : `−${fmt(result.perPeriod.state)}`, color: result.stateData.noTax ? "#2f9e44" : "#e03131" },
                  { label: "Social Security", value: `−${fmt(result.perPeriod.ss)}`, color: "#e03131" },
                  { label: "Medicare", value: `−${fmt(result.perPeriod.medicare)}`, color: "#e03131" },
                  { label: "Net Take-Home", value: fmt(result.perPeriod.net), bold: true, color: "#2f9e44", border: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: row.border ? "2px solid #e9ecef" : "1px solid #f1f3f5", marginTop: row.border ? 4 : 0 }}>
                    <span style={{ fontSize: 14, color: "#444", fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: row.bold ? 700 : 600, color: row.color || "#222" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 12, padding: 16, fontSize: 13, color: "#664d03" }}>
              <strong>Estimate only.</strong> State tax uses marginal top-rate approximation. Actual withholding depends on your W-4 elections, local taxes, pre-tax benefits, and employer policies. Consult a tax professional for precise figures.
            </div>
          </>
        )}

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginTop: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>📊 2024 Federal Tax Brackets</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f1f3f5" }}>
                  {["Rate", "Single", "Married Filing Jointly"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#333" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["10%", "Up to $11,600", "Up to $23,200"],
                  ["12%", "$11,601 – $47,150", "$23,201 – $94,300"],
                  ["22%", "$47,151 – $100,525", "$94,301 – $201,050"],
                  ["24%", "$100,526 – $191,950", "$201,051 – $383,900"],
                  ["32%", "$191,951 – $243,725", "$383,901 – $487,450"],
                  ["35%", "$243,726 – $609,350", "$487,451 – $731,200"],
                  ["37%", "Over $609,350", "Over $731,200"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f3f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: "10px 14px", color: j === 0 ? "#3b5bdb" : "#333", fontWeight: j === 0 ? 700 : 400 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
