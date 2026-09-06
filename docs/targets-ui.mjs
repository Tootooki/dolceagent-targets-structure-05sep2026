import {TARGET_PERIODS,TARGET_KINDS,TARGET_DATE_START,TARGET_DATE_END,TARGET_RECORD_TYPES,TARGET_COLORS,TARGET_NODES,targetsView,setTargetDate,formatTargetMetric,targetMetricTone,targetPerformance,targetPeriods} from './targets-model.mjs?v=77';

const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const control=(text,label,handler)=>{const button=el('button','',text);button.type='button';button.setAttribute('aria-label',label);button.addEventListener('click',handler);return button;};
const typeLabels={campaign:'CAMPAIGN',group:'AD GROUP',keyword:'KEYWORD',asin:'ASIN TARGET',term:'SEARCH TERM',asinTerm:'ASIN MATCH'};

export function createTargetsUI({state,getStatus,onKind}){
  const root=el('section','targets-workspace');root.setAttribute('aria-labelledby','targets-title');
  const top=el('div','targets-heading'),title=el('h1','','TARGETS');title.id='targets-title';
  top.append(title,el('span','targets-example','EXAMPLE'));root.append(top);
  root.append(el('p','targets-path','Campaign → Ad group → Keyword / ASIN → Search term'));
  const toolbar=el('div','targets-toolbar'),kindBar=el('div','targets-kind');kindBar.setAttribute('role','group');kindBar.setAttribute('aria-label','Target type');
  const kindButtons=TARGET_KINDS.map(kind=>{
    const button=control(kind.toUpperCase(),`Show ${kind==='All'?'all targets':kind.toLowerCase()}`,()=>{
      state.kind=kind;onKind(kind);state.collapsed=[];render();tableWrap.scrollTop=0;
    });button.dataset.targetKind=kind;kindBar.append(button);return button;
  });
  const search=el('input','targets-search');search.type='search';search.placeholder='Find keyword, ASIN, campaign…';search.setAttribute('aria-label','Search targets');
  search.addEventListener('input',()=>{state.query=search.value;if(state.query.trim())state.collapsed=[];renderTable();tableWrap.scrollTop=0;});
  toolbar.append(kindBar,search);root.append(toolbar);
  const periodRow=el('div','targets-period-row'),periodBar=el('div','targets-periods');periodBar.setAttribute('role','group');periodBar.setAttribute('aria-label','Performance period');
  const periodButtons=TARGET_PERIODS.map(period=>{
    const button=control(period==='ALL'?'ALL PERIODS':period,`Show ${period==='ALL'?'all periods':period}`,()=>{
      state.period=period;render();tableWrap.scrollLeft=0;
    });button.dataset.targetPeriod=period;periodBar.append(button);return button;
  });
  const expansion=el('div','targets-expansion');
  expansion.append(control('EXPAND','Expand all target rows',()=>{state.collapsed=[];renderTable();}),
    control('COLLAPSE','Collapse to campaigns',()=>{state.collapsed=TARGET_NODES.filter(node=>node.children.length).map(node=>node.id);renderTable();}));
  periodRow.append(periodBar,expansion);root.append(periodRow);
  const dates=el('div','targets-dates'),dateInputs={};
  for(const [key,label] of [['rangeStart','From'],['rangeEnd','To'],['date','Date']]){
    const wrapper=el('label','',label),input=el('input');input.type='date';input.min=TARGET_DATE_START;input.max=TARGET_DATE_END;
    input.setAttribute('aria-label',`Targets ${key==='date'?'selected':label.toLowerCase()} date`);input.value=state[key];dateInputs[key]=input;
    input.addEventListener('change',()=>{
      if(!setTargetDate(state,key,input.value)){
        input.value=state[key];dateError.textContent=`Choose dates from ${TARGET_DATE_START} to ${TARGET_DATE_END}, with From before To.`;return;
      }
      dateError.textContent='';renderTable();
    });wrapper.append(input);dates.append(wrapper);
  }
  const dateError=el('p','targets-date-error');dateError.setAttribute('role','alert');root.append(dates,dateError);
  const summary=el('p','targets-summary');summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');root.append(summary);
  const tableWrap=el('div','targets-scroll');tableWrap.tabIndex=0;tableWrap.setAttribute('role','region');tableWrap.setAttribute('aria-label','Targets table, scroll for more metrics');
  const table=el('table','targets-table');table.append(el('caption','workspace-sr-only','Example Targets hierarchy. Expand campaign, ad group and target rows to show their children. Parent performance totals include their matching search terms only.'));
  const thead=el('thead'),tbody=el('tbody');table.append(thead,tbody);tableWrap.append(table);root.append(tableWrap);
  const empty=el('p','targets-empty','No targets match. Clear the search or change the type or status filter.');empty.hidden=true;root.append(empty);
  const footer=el('p','targets-footnote','Scroll horizontally for metrics → · Example performance · No account changes');root.append(footer);

  const dialog=el('dialog','action-detail target-detail');dialog.id='target-detail';dialog.setAttribute('aria-labelledby','target-detail-title');dialog.setAttribute('aria-describedby','target-detail-note');
  const dialogHeader=el('div','action-detail-header'),dialogTitle=el('h2');dialogTitle.id='target-detail-title';
  let opener=null;
  const finish=()=>{(opener?.isConnected?opener:tableWrap).focus({preventScroll:true});opener=null;};
  const close=()=>{if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');finish();}};
  const closeButton=control('CLOSE','Close target details',close);closeButton.className='action-detail-close';dialogHeader.append(dialogTitle,closeButton);
  const dialogBody=el('div','action-detail-body');dialog.append(dialogHeader,dialogBody);document.body.append(dialog);
  dialog.addEventListener('close',finish);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){event.preventDefault();closeButton.focus({preventScroll:true});}
  });
  function openDetails(row,button){
    opener=button;dialogTitle.textContent=`${typeLabels[row.type]} · ${row.name}`;
    const note=el('p','action-detail-notice','Illustrative Targets example. These figures and ASINs are fictional; no live advertising account is connected.');note.id='target-detail-note';
    const context=el('dl','target-detail-fields');
    const fields=[['Record type',TARGET_RECORD_TYPES[row.type]],['Name / customer search term',row.name],['Keyword / target',row.target||'—'],
      ['Portfolio',row.portfolio],['Ad type',row.adType],['ASIN / SKU',row.sku],['Campaign',row.campaign],['Campaign budget',formatTargetMetric({format:'money'},row.budget)],
      ['Ad group',row.group||'—'],['Match type',row.match||'—'],['Status',row.status],['Bid',row.bid===undefined?'—':formatTargetMetric({format:'money'},row.bid)],['Target ACoS','30.0%']];
    for(const [label,value] of fields)context.append(el('dt','',label),el('dd','',value));
    dialogBody.replaceChildren(note,context);
    for(const period of targetPeriods(state)){
      const metrics=targetPerformance(row,period),group=el('section','target-detail-period');group.append(el('h3','',period.label));
      const list=el('dl','target-detail-fields');
      for(const metric of period.metrics)list.append(el('dt','',metric.label),el('dd','',formatTargetMetric(metric,metrics[metric.key])));
      list.append(el('dt','','ROAS'),el('dd','',metrics.roas===null?'—':metrics.roas.toFixed(2)+'×'));group.append(list);dialogBody.append(group);
    }
    dialogBody.append(el('p','action-detail-notice','TACoS is unavailable because this example does not attribute total product sales to individual targets. Parent totals are recalculated from matching search terms; target and search-term rows are not added together.'));
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');closeButton.focus({preventScroll:true});
  }
  function renderTable(){
    const view=targetsView(state,getStatus()),topRow=el('tr','targets-group-heading'),headerRow=el('tr','targets-column-heading');
    const identity=['RECORD TYPE','NAME / SEARCH TERM','KEYWORD / TARGET'];
    identity.forEach((label,i)=>{const th=el('th',`target-identity target-identity-${i}`,label);th.rowSpan=2;th.scope='col';topRow.append(th);});
    for(const period of view.periods){
      const th=el('th','target-period-heading',period.label);th.colSpan=period.metrics.length;th.scope='colgroup';topRow.append(th);
      for(const metric of period.metrics){const th=el('th','target-metric-heading',metric.label);th.scope='col';th.dataset.metric=metric.key;th.dataset.period=period.key;
        if(metric.key==='tacos')th.title='Total sales attribution is not available for this target example.';headerRow.append(th);}
    }
    const contextHead=el('th','target-period-heading','TARGET CONTEXT');contextHead.colSpan=6;contextHead.scope='colgroup';topRow.append(contextHead);
    for(const label of ['MATCH','STATUS','BID','ASIN / SKU','CAMPAIGN','AD GROUP']){const th=el('th','',label);th.scope='col';headerRow.append(th);}
    thead.replaceChildren(topRow,headerRow);
    const fragment=document.createDocumentFragment();
    for(const row of view.targetRecords){
      const tr=el('tr',`target-row target-row-${row.type}`);tr.dataset.targetId=row.id;tr.dataset.recordType=TARGET_RECORD_TYPES[row.type];tr.dataset.depth=String(row.depth);
      const type=el('td','target-identity target-identity-0',typeLabels[row.type]);type.title=TARGET_RECORD_TYPES[row.type];tr.append(type);
      const nameCell=el('th','target-identity target-identity-1');nameCell.scope='row';
      const nameWrap=el('div','target-name-content');nameWrap.style.setProperty('--target-depth',String(row.depth));
      if(row.children.length){
        const toggle=control(row.expanded?'−':'+',`${row.expanded?'Collapse':'Expand'} ${typeLabels[row.type].toLowerCase()} ${row.name}`,()=>{
          state.collapsed=state.collapsed.includes(row.id)?state.collapsed.filter(id=>id!==row.id):[...state.collapsed,row.id];
          renderTable();tbody.querySelector(`tr[data-target-id="${row.id}"] .target-toggle`)?.focus({preventScroll:true});
        });toggle.className='target-toggle';toggle.setAttribute('aria-expanded',String(row.expanded));nameWrap.append(toggle);
      }else nameWrap.append(el('span','target-leaf-mark','↳'));
      const label=el('span','target-name',row.name);label.title=row.name;nameWrap.append(label);
      const info=control('',`View ${typeLabels[row.type].toLowerCase()} details for ${row.name}`,()=>openDetails(row,info));info.className='target-info';info.dataset.targetInfo=row.id;
      info.setAttribute('aria-haspopup','dialog');info.setAttribute('aria-controls','target-detail');const icon=el('img');icon.src='action-icons/info.svg';icon.alt='';icon.width=icon.height=24;info.append(icon);nameWrap.append(info);nameCell.append(nameWrap);tr.append(nameCell);
      const parent=el('td','target-parent',row.target||'—');parent.title=row.target||'';tr.append(parent);
      view.periods.forEach((period,index)=>{
        for(const metric of period.metrics){
          const value=row.performance[index][metric.key],cell=el('td','target-metric',formatTargetMetric(metric,value));
          cell.dataset.period=period.key;cell.dataset.metric=metric.key;
          const tone=targetMetricTone(metric,value,row);
          if(tone&&!['campaign','group'].includes(row.type)){cell.style.backgroundColor=TARGET_COLORS[tone];cell.dataset.tone=tone;}
          if(metric.key==='tacos')cell.title='Unavailable: total product sales are not attributed to individual targets.';tr.append(cell);
        }
      });
      for(const value of [row.match||'—',row.status,row.bid===undefined?'—':formatTargetMetric({format:'money'},row.bid),row.sku,row.campaign,row.group||'—']){
        const cell=el('td','target-context',value);cell.title=value;tr.append(cell);
      }
      fragment.append(tr);
    }
    tbody.replaceChildren(fragment);empty.hidden=Boolean(view.targetRecords.length);tableWrap.hidden=!view.targetRecords.length;
    const c=view.counts;summary.textContent=`${c.campaigns} campaigns · ${c.groups} ad groups · ${c.keywords} keywords · ${c.asins} ASINs · ${c.terms} search terms${getStatus()==='All'?'':` · ${getStatus()}`}`;
    return view;
  }
  function render(){
    kindButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.targetKind===state.kind)));
    periodButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.targetPeriod===state.period)));
    search.value=state.query;dates.hidden=!['RANGE','DATE','ALL'].includes(state.period);dateError.textContent='';
    for(const [key,input] of Object.entries(dateInputs)){input.value=state[key];input.parentElement.hidden=key==='date'?!['DATE','ALL'].includes(state.period):!['RANGE','ALL'].includes(state.period);}
    renderTable();
  }
  return {root,render,tableWrap};
}
