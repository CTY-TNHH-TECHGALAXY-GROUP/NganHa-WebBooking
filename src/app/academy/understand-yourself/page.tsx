"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from './style.module.css';
import { T, interp, groupsData, roleNames, calculateScores, getBands } from '@/data/UnderstandYourselfData';

export default function UnderstandYourselfApp() {
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [stage, setStage] = useState(0);

  const t = T[lang];

  // Sliders state
  const [v, setV] = useState({
    risk: 50,
    flex: 50,
    performance_income: 50,
    one_to_one: 50,
    building: 50,
    hands_on: 50,
    data: 50,
    autonomy: 50,
    generalist: 50,
    physical: 50,
    data_problem: 50,
    marketing_problem: 50,
    tech_problem: 50,
    people_management: 50,
    retail_problem: 50,
    finance_problem: 50
  });

  // Choices state
  const [choices, setChoices] = useState({
    learning: 'practice',
    freelance: 'accept'
  });

  const handleSlider = (key: keyof typeof v, value: number) => {
    setV(prev => ({ ...prev, [key]: value }));
  };

  const handleChoice = (key: keyof typeof choices, value: string) => {
    setChoices(prev => ({ ...prev, [key]: value }));
  };

  const goNext = () => setStage(s => Math.min(4, s + 1));
  const goPrev = () => setStage(s => Math.max(0, s - 1));

  // --- Derived Results ---
  const results = useMemo(() => {
    const scores = calculateScores(v, choices);
    const groups = JSON.parse(JSON.stringify(groupsData[lang]));
    groups.forEach((g: any) => {
      const vals = g.members.map((m: string) => scores[m as keyof typeof scores]).sort((a: number,b: number) => b-a);
      g.score = Math.round(vals[0]*0.50 + (vals[1]||vals[0])*0.30 + (vals[2]||vals[1]||vals[0])*0.20);
    });
    groups.sort((a: any, b: any) => b.score - a.score);
    const top3 = groups.slice(0, 3);
    
    // Top Dimensions
    const dims = [
      { id: 'people', val: v.one_to_one },
      { id: 'hands', val: v.hands_on },
      { id: 'build', val: v.building },
      { id: 'auto', val: v.autonomy },
      { id: 'data', val: v.data }
    ].sort((a,b) => b.val - a.val).slice(0, 3);
    
    return { top3, scores, dims };
  }, [v, choices, lang]);

  // UI Helpers
  const stepNames = lang === 'vi' 
    ? ["Khám phá", "Hiểu bản thân", "Khám phá hướng", "Tổng hợp", "Bước tiếp theo"]
    : ["Discover", "Understand", "Explore", "Summary", "Move Forward"];

  const patternNames = lang === "vi"
    ? { people: "Con người", hands: "Thực hành", build: "Xây dựng", auto: "Tự chủ", data: "Phân tích" }
    : { people: "People", hands: "Craft", build: "Building", auto: "Autonomy", data: "Analysis" };

  const renderSlider = (key: keyof typeof v, leftLabel: string, rightLabel: string) => {
    const val = v[key];
    const bandData = interp[lang][key][getBands(val)];
    return (
      <div className={styles['scale-row']}>
        <div className={styles['scale-header']}>
          <div className={styles['scale-label']}><b>{leftLabel}</b><br/><span>{rightLabel}</span></div>
          <div className={styles['percent']}>{val}%</div>
        </div>
        <div className={styles['range-wrap']}>
          <input 
            type="range" 
            min="0" max="100" 
            value={val} 
            onChange={(e) => handleSlider(key, parseInt(e.target.value))}
            className={`${styles['live-range']} ${styles.rangeInput}`} 
            style={{background: `linear-gradient(to right, var(--ink) ${val}%, #e5e7eb ${val}%)`}}
          />
        </div>
        <div className={styles['range-hint']}>
          <span>{leftLabel}</span>
          <span>{rightLabel ? (lang === 'vi' ? 'Cân bằng' : 'Balanced') : ''}</span>
          <span>{rightLabel}</span>
        </div>
        <p className={styles['range-state']}><strong>{bandData[0]}.</strong> {bandData[1]}</p>
      </div>
    );
  };

  return (
    <div className={styles.shell}>
      <div className={styles.sidebar}>
        <div>
          <div className={styles.brand}>Oria Spa</div>
          <h1 className={`${styles.h1} ${styles['big-serif']}`} style={{marginTop: '20px'}}>{t.sideTitle}</h1>
          <p style={{fontSize: '14px', color: 'var(--textL)', marginTop: '10px'}}>{t.sideNote}</p>
        </div>
        <div className={styles.steps}>
          {stepNames.map((name, i) => (
            <div key={i} className={`${styles.step} ${i === stage ? styles.active : ''} ${i < stage ? styles.done : ''}`}>
              <div>0{i+1}</div>
              <div>
                <b>{name}</b>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.content}>
          {/* STAGE 0: DISCOVER */}
          <section className={`${styles.screen} ${stage === 0 ? styles.active : ''}`}>
            
            <div className={styles.intro}>
              <div className={styles.eyebrow}>{t.introEye}</div>
              <h2 className={`${styles.h2} ${styles['big-serif']}`}>{t.introH}</h2>
              <p>{t.introP}</p>
              <p><strong>{t.introQ}</strong></p>
              <br/><br/>
            </div>

            <div style={{marginTop: '42px'}}></div>
            <div className={styles.eyebrow}>{t.lifeEye}</div>
            <h2 className={styles.h2}>{t.lifeH}</h2>
            <div className={styles.helpText} dangerouslySetInnerHTML={{__html: t.sliderHelp}}></div>
            
            {renderSlider('risk', t.riskL, t.riskR)}
            {renderSlider('flex', t.timeL, t.timeR)}
            {renderSlider('performance_income', t.incomeL, t.incomeR)}
            <p className={styles.helpText}>{t.pctNote}</p>

            <div style={{marginTop: '42px'}}></div>
            <div className={styles.eyebrow}>{t.energyEye}</div>
            <h2 className={styles.h2}>{t.energyH}</h2>
            <div className={styles.helpText}>{t.drain}</div>
            
            {renderSlider('one_to_one', t.ePeople, "")}
            {renderSlider('building', t.eBuild, "")}
            {renderSlider('hands_on', t.eHands, "")}
            {renderSlider('data', t.eData, "")}

            <div style={{marginTop: '42px'}}></div>
            <div className={styles.eyebrow}>{t.problemEye}</div>
            <h2 className={styles.h2}>{t.problemH}</h2>
            
            {renderSlider('data_problem', t.pData, "")}
            {renderSlider('marketing_problem', t.pMarketing, "")}
            {renderSlider('tech_problem', t.pTech, "")}
            {renderSlider('people_management', t.pPeople, "")}
            {renderSlider('retail_problem', t.pRetail, "")}
            {renderSlider('finance_problem', t.pFinance, "")}

            <div style={{marginTop: '42px'}}></div>
            <div className={styles.eyebrow}>{t.styleEye}</div>
            <h2 className={styles.h2}>{t.styleH}</h2>
            
            {renderSlider('autonomy', t.structL, t.structR)}
            {renderSlider('generalist', t.specL, t.specR)}
            {renderSlider('physical', t.deskL, t.deskR)}

            <div style={{marginTop: '42px'}}></div>
            <div className={styles.eyebrow}>{t.learnEye}</div>
            <h2 className={styles.h2}>{t.learnQ}</h2>
            <div className={styles.selectable}>
              <div className={`${styles.option} ${choices.learning === 'theory' ? styles.selected : ''}`} onClick={() => handleChoice('learning', 'theory')}>{t.learnA}</div>
              <div className={`${styles.option} ${choices.learning === 'project' ? styles.selected : ''}`} onClick={() => handleChoice('learning', 'project')}>{t.learnB}</div>
              <div className={`${styles.option} ${choices.learning === 'practice' ? styles.selected : ''}`} onClick={() => handleChoice('learning', 'practice')}>{t.learnC}</div>
              <div className={`${styles.option} ${choices.learning === 'people' ? styles.selected : ''}`} onClick={() => handleChoice('learning', 'people')}>{t.learnD}</div>
            </div>

            <div style={{marginTop: '42px'}}></div>
            <div className={styles.eyebrow}>{t.realityEye}</div>
            <h2 className={styles.h2}>{t.realityQ}</h2>
            <div className={styles.selectable}>
              <div className={`${styles.option} ${choices.freelance === 'avoid' ? styles.selected : ''}`} onClick={() => handleChoice('freelance', 'avoid')}>{t.rA}</div>
              <div className={`${styles.option} ${choices.freelance === 'maybe' ? styles.selected : ''}`} onClick={() => handleChoice('freelance', 'maybe')}>{t.rB}</div>
              <div className={`${styles.option} ${choices.freelance === 'accept' ? styles.selected : ''}`} onClick={() => handleChoice('freelance', 'accept')}>{t.rC}</div>
              <div className={`${styles.option} ${choices.freelance === 'prefer' ? styles.selected : ''}`} onClick={() => handleChoice('freelance', 'prefer')}>{t.rD}</div>
            </div>

            <div className={styles.stepsRow}>
              <button className={styles.btn} onClick={goNext}>{t.seeResult}</button>
            </div>
          </section>

          {/* STAGE 1: UNDERSTAND */}
          <section className={`${styles.screen} ${stage === 1 ? styles.active : ''}`}>
            <div className={styles.eyebrow}>{t.underEye}</div>
            <h2 className={`${styles.h2} ${styles['big-serif']}`}>{t.underH}</h2>
            <div className={styles.ref}>
              <div className={styles.eyebrow}>{t.currentPattern}</div>
              <div className={styles['big-serif']} style={{fontSize:'28px', color:'var(--ink)', marginBottom:'10px'}}>
                {results.dims.map(d => (patternNames as any)[d.id]).join(" × ")}
              </div>
              <p>{lang === 'vi' ? "Kết quả hiện tại cho thấy bạn có nhiều tín hiệu cùng lúc. Vì vậy hệ thống sẽ đề xuất nhiều hướng để thử thay vì ép bạn vào một nghề duy nhất." : "Your current answers show several overlapping signals. The system should therefore offer multiple paths to test rather than force you into a single career."}</p>
            </div>
            
            <div className={styles['two-col']}>
              <div className={styles.card}>
                <h4 style={{color:'var(--ink)',marginBottom:'8px'}}>{t.card1h}</h4>
                <p>{t.card1p}</p>
              </div>
              <div className={styles.card}>
                <h4 style={{color:'var(--ink)',marginBottom:'8px'}}>{t.card2h}</h4>
                <p>{t.card2p}</p>
              </div>
            </div>
            <div className={styles.stepsRow}>
              <button className={`${styles.btn} ${styles.ghost}`} onClick={goPrev}>{t.back}</button>
              <button className={styles.btn} onClick={goNext}>{t.explore}</button>
            </div>
          </section>

          {/* STAGE 2: EXPLORE */}
          <section className={`${styles.screen} ${stage === 2 ? styles.active : ''}`}>
            <div className={styles.eyebrow}>{t.dirEye}</div>
            <h2 className={`${styles.h2} ${styles['big-serif']}`}>{t.dirH}</h2>
            
            <h3 style={{fontSize:'20px', color:'var(--ink)', marginTop:'40px', marginBottom:'10px'}}>{t.topGroupsH}</h3>
            <p>{t.topGroupsP}</p>
            
            <div className={styles['two-col']} style={{marginTop:'30px'}}>
              {results.top3.map((g: any, i: number) => {
                let memberScores = g.members.map((m: string) => [m, results.scores[m as keyof typeof results.scores]]).sort((a:any,b:any)=>b[1]-a[1]);
                if(g.key === "service"){
                  const spaItem = memberScores.find((x:any) => x[0]==="spa");
                  const others = memberScores.filter((x:any) => x[0]!=="spa");
                  memberScores = spaItem ? [spaItem, ...others] : memberScores;
                }
                memberScores = memberScores.slice(0,3);
                const meaning = g.score >= 85 ? (lang==="vi" ? "Mức phù hợp rất cao" : "Very strong fit") : g.score >= 75 ? (lang==="vi" ? "Mức phù hợp cao" : "Strong fit") : (lang==="vi" ? "Đáng khám phá" : "Worth exploring");

                return (
                  <div key={i} className={styles['group-card']}>
                    <div className={styles['group-rank']}>
                      <span>0{i+1}</span>
                      <div className={styles['group-score']}>{g.score}%</div>
                    </div>
                    <h4 style={{color:'var(--ink)',fontSize:'18px',marginBottom:'10px'}}>{g.name}</h4>
                    <p style={{fontSize:'14px',color:'var(--textL)'}}>{g.desc}</p>
                    <p style={{marginTop:'10px',fontWeight:600,color:'var(--ink)',fontSize:'14px'}}>{meaning}</p>
                    <div className={styles['group-jobs']}>
                      {memberScores.map((m: any, idx: number) => (
                         <span key={idx} style={{display:'inline-block',padding:'4px 10px',background:'#f3f4f6',borderRadius:'100px',fontSize:'13px',marginRight:'8px',marginTop:'8px',color:'var(--ink)'}}>
                           {(roleNames[lang] as any)[m[0]]}
                         </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className={styles.helpText} style={{marginTop:'20px'}}>
              {lang === 'vi' ? "* % thể hiện mức độ phù hợp của cả nhóm ngành. Các nghề bên trong là ví dụ đại diện, không phải bảng xếp hạng riêng." : "* The percentage represents fit with the overall career group. Roles shown inside are representative examples, not a second ranking."}
            </p>

            <div className={styles.stepsRow}>
              <button className={`${styles.btn} ${styles.ghost}`} onClick={goPrev}>{t.back}</button>
              <button className={styles.btn} onClick={goNext}>{t.continue}</button>
            </div>
          </section>

          {/* STAGE 3: SUMMARY */}
          <section className={`${styles.screen} ${stage === 3 ? styles.active : ''}`}>
            <div className={styles.eyebrow}>{t.reflectEye}</div>
            <h2 className={`${styles.h2} ${styles['big-serif']}`}>{t.reflectH}</h2>
            <div className={styles['two-col']} style={{marginTop:'30px'}}>
              <div className={styles.card}>
                <h4 style={{color:'var(--ink)',marginBottom:'8px'}}>{t.r1h}</h4>
                <p>{t.r1p}</p>
              </div>
              <div className={styles.card}>
                <h4 style={{color:'var(--ink)',marginBottom:'8px'}}>{t.r2h}</h4>
                <p>{t.r2p}</p>
              </div>
              <div className={styles.card}>
                <h4 style={{color:'var(--ink)',marginBottom:'8px'}}>{t.r3h}</h4>
                <p>{t.r3p}</p>
              </div>
              <div className={styles.card}>
                <h4 style={{color:'var(--ink)',marginBottom:'8px'}}>{t.r4h}</h4>
                <p>{t.r4p}</p>
              </div>
            </div>
            <div className={styles.stepsRow}>
              <button className={`${styles.btn} ${styles.ghost}`} onClick={goPrev}>{t.back}</button>
              <button className={styles.btn} onClick={goNext}>{t.nextStep}</button>
            </div>
          </section>

          {/* STAGE 4: MOVE FORWARD */}
          <section className={`${styles.screen} ${stage === 4 ? styles.active : ''}`}>
            <div className={styles.eyebrow}>{t.moveEye}</div>
            <h2 className={`${styles.h2} ${styles['big-serif']}`}>{t.moveH}</h2>
            
            <div className={styles.timeline}>
              <div className={styles.item}>
                <div className={styles.dot}></div>
                <div className={styles['t-content']}>
                  <div className={styles.time}>{t.m1}</div>
                  <h4 style={{color:'var(--ink)',marginBottom:'6px'}}>{t.m1h}</h4>
                  <p>{t.m1p}</p>
                </div>
              </div>
              <div className={styles.item}>
                <div className={styles.dot}></div>
                <div className={styles['t-content']}>
                  <div className={styles.time}>{t.m2}</div>
                  <h4 style={{color:'var(--ink)',marginBottom:'6px'}}>{t.m2h}</h4>
                  <p>{t.m2p}</p>
                </div>
              </div>
              <div className={styles.item}>
                <div className={styles.dot}></div>
                <div className={styles['t-content']}>
                  <div className={styles.time}>{t.m3}</div>
                  <h4 style={{color:'var(--ink)',marginBottom:'6px'}}>{t.m3h}</h4>
                  <p>{t.m3p}</p>
                </div>
              </div>
              <div className={styles.item}>
                <div className={styles.dot} style={{background:'var(--ink)'}}></div>
                <div className={styles['t-content']}>
                  <div className={styles.time}>{t.m4}</div>
                  <h4 style={{color:'var(--ink)',marginBottom:'6px'}}>{t.m4h}</h4>
                  <p>{t.m4p}</p>
                </div>
              </div>
            </div>
            
            <div className={styles.ref} style={{marginTop:'40px'}}>
              <p>{t.finalQ}</p>
            </div>

            <div className={styles.stepsRow}>
              <button className={`${styles.btn} ${styles.ghost}`} onClick={goPrev}>{t.back}</button>
              <button className={styles.btn} onClick={() => setStage(0)}>{t.restart}</button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
