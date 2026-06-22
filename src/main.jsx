import React, { useMemo, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const ACCENT = '#9eee90'
const STORAGE_KEY = 'smashd-race-dashboard-v3'
const defaultData = {
  goal: 10000000,
  lastUpdated: new Date().toLocaleString(),
  rockstars: [
    { id:'bill', name:'Bill', role:'Wholesale', avatar:'/bill.jpeg', revenue: 869280.34, note:'Wholesale driver' },
    { id:'benny', name:'Benny', role:'Field Accelerator', avatar:'/benny.jpeg', revenue: 152000, note:'Boosts velocity and demand' },
    { id:'tim', name:'Tim', role:'Wholesale', avatar:'/tim.png', revenue: 0, note:'Ready to race' },
    { id:'andy', name:'Andy', role:'Wholesale', avatar:'/andy.png', revenue: 0, note:'Ready to race' }
  ],
  weeks: [
    { label:'05/01-05/31', bill:450858.81, benny:30000, tim:0, andy:0 },
    { label:'06/01-06/06', bill:142020.54, benny:35000, tim:0, andy:0 },
    { label:'06/08-06/12', bill:121254.87, benny:35000, tim:0, andy:0 },
    { label:'06/15-06/19', bill:155146.12, benny:52000, tim:0, andy:0 },
    { label:'06/22-06/26', bill:0, benny:0, tim:0, andy:0 },
    { label:'06/29-07/03', bill:0, benny:0, tim:0, andy:0 }
  ],
  kpis: [
    { id:'doors', label:'Active Doors', value: 0, suffix:'', note:'Update weekly' },
    { id:'velocity', label:'Avg Velocity', value: 0, suffix:' u/s/wk', note:'Units per store per week' },
    { id:'wins', label:'New Wins', value: 0, suffix:'', note:'Retailer or distributor wins' },
    { id:'pipeline', label:'Pipeline', value: 0, suffix:'', money:true, note:'Open revenue pipeline' }
  ]
}

function money(n){ return Number(n||0).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}) }
function pct(n){ return `${Number(n||0).toFixed(1)}%` }
function sumWeek(w){ return ['bill','benny','tim','andy'].reduce((a,k)=>a+Number(w[k]||0),0) }
function clone(obj){ return JSON.parse(JSON.stringify(obj)) }

function Modal({title, children, onClose, onSave}){
  return <div className="modalBackdrop" onMouseDown={onClose}>
    <div className="modal" onMouseDown={e=>e.stopPropagation()}>
      <div className="modalHead"><h3>{title}</h3><button onClick={onClose}>×</button></div>
      <div className="modalBody">{children}</div>
      <div className="modalActions"><button className="ghost" onClick={onClose}>Cancel</button><button className="save" onClick={onSave}>Save update</button></div>
    </div>
  </div>
}

function App(){
  const [data,setData] = useState(()=>{ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData } catch { return defaultData } })
  const [edit,setEdit] = useState(null)
  const [draft,setDraft] = useState(null)

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) },[data])

  const totals = useMemo(()=>{
    const total = data.rockstars.reduce((a,r)=>a+Number(r.revenue||0),0)
    const goal = Number(data.goal||10000000)
    const remaining = Math.max(goal-total,0)
    const progress = goal ? (total/goal)*100 : 0
    const start = new Date('2026-05-01T00:00:00')
    const end = new Date('2027-04-30T23:59:59')
    const now = new Date()
    const totalDays = Math.ceil((end-start)/(1000*60*60*24))
    const usedDays = Math.max(1, Math.min(totalDays, Math.ceil((now-start)/(1000*60*60*24))))
    const timeUsed = (usedDays/totalDays)*100
    return { total, goal, remaining, progress, totalDays, usedDays, timeUsed, speed: total/usedDays, needed: goal/totalDays }
  },[data])

  const leaderboard = [...data.rockstars].sort((a,b)=>Number(b.revenue)-Number(a.revenue))
  const weekly = data.weeks.map(w=>({...w,total:sumWeek(w)}))
  const maxWeek = Math.max(...weekly.map(w=>w.total), 1)
  const maxPerson = Math.max(...data.rockstars.map(r=>r.revenue),1)

  function open(type, payload){ setEdit({type, payload}); setDraft(clone(payload ?? data)) }
  function save(){
    if(edit.type==='goal') setData(d=>({...d, goal:Number(draft.goal)||0, lastUpdated:new Date().toLocaleString()}))
    if(edit.type==='rockstar') setData(d=>({...d, rockstars:d.rockstars.map(r=>r.id===draft.id?{...r,revenue:Number(draft.revenue)||0,note:draft.note,role:draft.role}:r), lastUpdated:new Date().toLocaleString()}))
    if(edit.type==='weeks') setData(d=>({...d, weeks:draft.weeks.map(w=>({label:w.label,bill:Number(w.bill)||0,benny:Number(w.benny)||0,tim:Number(w.tim)||0,andy:Number(w.andy)||0})), lastUpdated:new Date().toLocaleString()}))
    if(edit.type==='kpis') setData(d=>({...d,kpis:draft.kpis.map(k=>({...k,value:Number(k.value)||0,note:k.note||''})), lastUpdated:new Date().toLocaleString()}))
    setEdit(null); setDraft(null)
  }
  function reset(){ if(confirm('Reset dashboard to original SMASHD sample data?')) { localStorage.removeItem(STORAGE_KEY); setData(defaultData) } }

  return <main>
    <header className="hero">
      <img src="/smashd-logo.png" className="logo" alt="SMASHD" />
      <div className="eyebrow">RACE TO $10M</div>
      <div className="last">Last updated: {data.lastUpdated}</div>
    </header>

    <section className="panel scoreboard">
      <div>
        <div className="label">Total Revenue Closed</div>
        <div className="big">{money(totals.total)}</div>
        <div className="sub">{money(totals.remaining)} left to smash</div>
      </div>
      <div className="goalBox">
        <button className="update" onClick={()=>open('goal',{goal:data.goal})}>✎ Update Goal</button>
        <div className="label">12 Month Revenue Target</div>
        <div className="goal">{money(totals.goal)}</div>
        <div className="progressText">{pct(totals.progress)} complete</div>
        <div className="bar"><span style={{width:`${Math.min(totals.progress,100)}%`}} /></div>
      </div>
    </section>

    <section className="panel clockGrid">
      <div><span>Day</span><strong>{totals.usedDays} / {totals.totalDays}</strong></div>
      <div><span>Time Used</span><strong>{pct(totals.timeUsed)}</strong></div>
      <div><span>Revenue Won</span><strong>{pct(totals.progress)}</strong></div>
      <div><span>Current Speed</span><strong>{money(totals.speed)}/day</strong></div>
      <div><span>Needed Speed</span><strong>{money(totals.needed)}/day</strong></div>
    </section>

    <section className="sectionHead"><h2>Rockstar Garage</h2><span>Inline updates recalculate everything instantly</span></section>
    <section className="cards">
      {data.rockstars.map(r=><article className="person" key={r.id}>
        <button className="update tiny" onClick={()=>open('rockstar', r)}>✎ Update</button>
        <img src={r.avatar} alt={r.name} />
        <div className="personBody"><div className="role">{r.role}</div><h3>{r.name}</h3><div className="rev">{money(r.revenue)}</div><p>{totals.total ? pct((r.revenue/totals.total)*100) : '0.0%'} of closed revenue</p><small>{r.note}</small></div>
      </article>)}
    </section>

    <section className="grid2">
      <div className="panel">
        <div className="panelTitle"><h2>Weekly Revenue Trend</h2><button className="update" onClick={()=>open('weeks',{weeks:data.weeks})}>✎ Update</button></div>
        <div className="lineChart">
          {weekly.map((w,i)=><div className="week" key={w.label}>
            <div className="weekBar" style={{height:`${Math.max(4,(w.total/maxWeek)*100)}%`}} title={`${w.label}: ${money(w.total)}`}></div>
            <span>{w.label.split('-')[0]}</span>
          </div>)}
        </div>
      </div>
      <div className="panel">
        <div className="panelTitle"><h2>Revenue by Rockstar</h2></div>
        <div className="hbars">
          {leaderboard.map(r=><div className="hrow" key={r.id}><span>{r.name}</span><div className="htrack"><b style={{width:`${(r.revenue/maxPerson)*100}%`}}></b></div><em>{money(r.revenue)}</em></div>)}
        </div>
      </div>
    </section>

    <section className="kpiGrid">
      {data.kpis.map(k=><div className="panel kpi" key={k.id}><button className="update tiny" onClick={()=>open('kpis',{kpis:data.kpis})}>✎ Update</button><span>{k.label}</span><strong>{k.money ? money(k.value) : Number(k.value).toLocaleString()}{k.suffix}</strong><small>{k.note}</small></div>)}
    </section>

    <section className="grid2">
      <div className="panel">
        <div className="panelTitle"><h2>Leaderboard</h2></div>
        <table><tbody>{leaderboard.map((r,i)=><tr key={r.id}><td>{['🥇','🥈','🥉','🏎️'][i] || '🏎️'}</td><td>{r.name}</td><td>{r.role}</td><td>{money(r.revenue)}</td></tr>)}</tbody></table>
      </div>
      <div className="panel">
        <div className="panelTitle"><h2>Weekly Breakdown</h2><button className="update" onClick={()=>open('weeks',{weeks:data.weeks})}>✎ Update</button></div>
        <table><thead><tr><th>Week</th><th>Bill</th><th>Benny</th><th>Tim</th><th>Andy</th><th>Total</th></tr></thead><tbody>{weekly.map(w=><tr key={w.label}><td>{w.label}</td><td>{money(w.bill)}</td><td>{money(w.benny)}</td><td>{money(w.tim)}</td><td>{money(w.andy)}</td><td>{money(w.total)}</td></tr>)}</tbody></table>
      </div>
    </section>

    <footer><button className="ghost" onClick={reset}>Reset sample data</button><p>Stay focused. Stay disciplined. <b>SMASHD.</b></p></footer>

    {edit && <Modal title={edit.type==='goal'?'Update Goal':edit.type==='rockstar'?`Update ${draft.name}`:edit.type==='weeks'?'Update Weekly Revenue':'Update KPIs'} onClose={()=>setEdit(null)} onSave={save}>
      {edit.type==='goal' && <label>Goal<input type="number" value={draft.goal} onChange={e=>setDraft({...draft,goal:e.target.value})}/></label>}
      {edit.type==='rockstar' && <div className="formGrid"><label>Revenue<input type="number" value={draft.revenue} onChange={e=>setDraft({...draft,revenue:e.target.value})}/></label><label>Role<input value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})}/></label><label className="full">Note<input value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})}/></label></div>}
      {edit.type==='weeks' && <div className="weekEdit">{draft.weeks.map((w,i)=><div className="weekEditRow" key={i}><input value={w.label} onChange={e=>{const weeks=[...draft.weeks]; weeks[i].label=e.target.value; setDraft({...draft,weeks})}}/><input type="number" placeholder="Bill" value={w.bill} onChange={e=>{const weeks=[...draft.weeks]; weeks[i].bill=e.target.value; setDraft({...draft,weeks})}}/><input type="number" placeholder="Benny" value={w.benny} onChange={e=>{const weeks=[...draft.weeks]; weeks[i].benny=e.target.value; setDraft({...draft,weeks})}}/><input type="number" placeholder="Tim" value={w.tim} onChange={e=>{const weeks=[...draft.weeks]; weeks[i].tim=e.target.value; setDraft({...draft,weeks})}}/><input type="number" placeholder="Andy" value={w.andy} onChange={e=>{const weeks=[...draft.weeks]; weeks[i].andy=e.target.value; setDraft({...draft,weeks})}}/></div>)}</div>}
      {edit.type==='kpis' && <div className="weekEdit">{draft.kpis.map((k,i)=><div className="kpiEdit" key={k.id}><strong>{k.label}</strong><input type="number" value={k.value} onChange={e=>{const kpis=[...draft.kpis]; kpis[i].value=e.target.value; setDraft({...draft,kpis})}}/><input value={k.note} onChange={e=>{const kpis=[...draft.kpis]; kpis[i].note=e.target.value; setDraft({...draft,kpis})}}/></div>)}</div>}
    </Modal>}
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
