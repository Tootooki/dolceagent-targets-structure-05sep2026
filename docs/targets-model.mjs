// Illustrative records for a structural preview, never imported account performance.
export const TARGET_REFERENCE='https://docs.google.com/spreadsheets/d/15GDQmpzYvHnZvdnSwH6NNLYuSGUCZmigYev3gntKoSQ/edit#gid=1233007547';
export const TARGET_PERIODS=Object.freeze(['30D','7D','60D','RANGE','DATE','ALL']);
export const TARGET_KINDS=Object.freeze(['All','Keywords','ASINs']);
export const TARGET_DATE_END='2026-09-05';
export const TARGET_DATE_START='2026-07-08';
export const TARGET_METRICS=Object.freeze([
  {key:'spend',label:'SPEND',format:'money'}, {key:'sales',label:'SALES',format:'money'},
  {key:'orders',label:'ORDERS',format:'integer'}, {key:'clicks',label:'CLICKS',format:'integer'},
  {key:'acos',label:'ACOS',format:'percent'}, {key:'tacos',label:'TACOS',format:'percent'},
  {key:'cpc',label:'CPC',format:'money'}, {key:'cvr',label:'CVR',format:'percent'},
  {key:'ctr',label:'CTR',format:'percent'}, {key:'impressions',label:'IMPRESSIONS',format:'integer'},
]);
export const TARGET_RECORD_TYPES=Object.freeze({campaign:'CAMPAIGN',group:'AD_GROUP',keyword:'KEYWORD',asin:'KEYWORD_ASIN',term:'SEARCH_TERM_KW',asinTerm:'SEARCH_TERM_ASIN'});
export const TARGET_COLORS=Object.freeze({positive:'rgb(183, 223, 207)',negative:'rgb(241, 198, 198)'});
const day=86400000;
const targetMoney=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
const targetInteger=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
const iso=time=>new Date(time).toISOString().slice(0,10);
const daysBefore=(date,count)=>iso(Date.parse(date+'T00:00:00Z')-count*day);
const fixtureProducts=[
  {key:'pistachio',name:'PISTACHIO',sku:'Pistachio-Cream-200g-New2',item:'CREAM200',budget:100,price:9.49,keywords:[['pistachio cream','pistachio spread'],['pistachio cream 200g','pistachio cream spread']]},
  {key:'kataifi',name:'KATAIFI',sku:'Roasted-Kataifi-400g',item:'ROAST400',budget:100,price:13.99,keywords:[['roasted kataifi','kataifi pastry'],['roasted kataifi 400g','kataifi for dubai chocolate']]},
  {key:'chocolate',name:'CHOCOLATE',sku:'Choco-Milk-200g',item:'MILK200',budget:100,price:9.59,keywords:[['milk chocolate','chocolate gift'],['milk chocolate 200g','chocolate bar gift']]},
];
let leafIndex=0;
function dailyExample(seed,price){
  return Array.from({length:60},(_,index)=>{
    const clicks=2+(seed*3+index*7)%15, orders=(seed+index)%4===0?0:Math.floor(clicks/(4+seed%5));
    const cpcCents=22+(seed*17+index*3)%115;
    return Object.freeze({date:daysBefore(TARGET_DATE_END,59-index),clicks,orders,
      impressions:clicks*(30+(seed+index)%60),spendCents:clicks*cpcCents,salesCents:orders*Math.round(price*100)});
  });
}
function buildCampaign(product,p){
  const campaign=`${product.name}_SP_MANUAL`,campaignId=`${product.key}-campaign`;
  const groups=['BROAD','EXACT','ASIN'].map((match,g)=>{
    const id=`${product.key}-${match.toLowerCase()}`,groupName=`${product.item}_${match}`;
    const children=Array.from({length:2},(_,k)=>{
      const isAsin=match==='ASIN',name=isAsin?`B0EXAMP${String(p*2+k+1).padStart(3,'0')}`:product.keywords[g][k];
      const targetId=`${id}-target-${k+1}`,bid=.65+p*.1+k*.15;
      const status=p===2&&g===0&&k===1?'Paused':'Active';
      const context={campaign,group:groupName,sku:product.sku,item:product.item,adType:'SP',
        portfolio:product.name,match:isAsin?'PRODUCT':match,status,target:name,bid,budget:product.budget,targetAcos:.3};
      const terms=(isAsin?[name]:match==='EXACT'?[name,`${name} buy`]:[`${name} for baking`,`${name} gift`]).map((term,t)=>({
        ...context,id:`${targetId}-term-${t+1}`,type:isAsin?'asinTerm':'term',name:term,children:[],daily:dailyExample(++leafIndex,product.price),
      }));
      return {...context,id:targetId,type:isAsin?'asin':'keyword',name,children:terms};
    });
    return {id,type:'group',name:groupName,campaign,group:groupName,sku:product.sku,item:product.item,
      portfolio:product.name,adType:'SP',match:match==='ASIN'?'PRODUCT':match,status:'Active',bid:.75,budget:product.budget,targetAcos:.3,children};
  });
  return {id:campaignId,type:'campaign',name:campaign,campaign,group:'',sku:product.sku,item:product.item,
    portfolio:product.name,adType:'SP',status:'Active',budget:product.budget,targetAcos:.3,children:groups};
}
const freezeTree=node=>Object.freeze({...node,children:Object.freeze(node.children.map(freezeTree)),...(node.daily?{daily:Object.freeze(node.daily)}:{})});
export const TARGET_TREE=Object.freeze(fixtureProducts.map(buildCampaign).map(freezeTree));
export const flattenTargets=(tree=TARGET_TREE)=>tree.flatMap(node=>[node,...flattenTargets(node.children)]);
export const TARGET_NODES=Object.freeze(flattenTargets());
export const createTargetsState=()=>({kind:'All',period:'30D',query:'',collapsed:[],date:TARGET_DATE_END,rangeStart:'2026-08-23',rangeEnd:TARGET_DATE_END});
export function validTargetDate(date){
  return /^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T00:00:00Z'))
    &&iso(Date.parse(date+'T00:00:00Z'))===date&&date>=TARGET_DATE_START&&date<=TARGET_DATE_END;
}
export function setTargetDate(state,key,value){
  if(!['date','rangeStart','rangeEnd'].includes(key)||!validTargetDate(value))return false;
  const next={...state,[key]:value};if(next.rangeStart>next.rangeEnd)return false;
  state[key]=value;return true;
}
export function targetPeriods(state){
  const keys=state.period==='ALL'?TARGET_PERIODS.slice(0,-1):[state.period];
  return keys.map(key=>{
    const start=key==='RANGE'?state.rangeStart:key==='DATE'?state.date:daysBefore(TARGET_DATE_END,Number.parseInt(key)-1);
    const end=key==='RANGE'?state.rangeEnd:key==='DATE'?state.date:TARGET_DATE_END;
    return {key,start,end,label:key==='RANGE'?`RANGE · ${start} — ${end}`:key==='DATE'?`DATE · ${end}`:`${Number.parseInt(key)} DAYS`,
      metrics:TARGET_METRICS.filter(metric=>metric.key!=='tacos'||key==='30D')};
  });
}
const empty=()=>({spendCents:0,salesCents:0,clicks:0,orders:0,impressions:0});
const sum=(a,b)=>{for(const key of Object.keys(a))a[key]+=b[key];return a;};
export function targetPerformance(node,period){
  const total=node.children.length?node.children.reduce((a,child)=>sum(a,targetPerformance(child,period)),empty())
    :node.daily.filter(row=>row.date>=period.start&&row.date<=period.end).reduce(sum,empty());
  const ratio=(numerator,denominator)=>denominator?numerator/denominator:null;
  return {...total,spend:total.spendCents/100,sales:total.salesCents/100,
    acos:ratio(total.spendCents,total.salesCents),tacos:null,cpc:ratio(total.spendCents/100,total.clicks),
    cvr:ratio(total.orders,total.clicks),ctr:ratio(total.clicks,total.impressions),roas:ratio(total.salesCents,total.spendCents)};
}
export function targetMetricTone(metric,value,node){
  if(value===null||value===undefined||value===0)return null;
  if(metric.key==='spend')return 'negative';
  if(metric.key==='acos')return value>node.targetAcos?'negative':'positive';
  return ['sales','orders','clicks','impressions','cvr','ctr'].includes(metric.key)?'positive':null;
}
export function formatTargetMetric(metric,value){
  if(value===null||value===undefined||!Number.isFinite(value))return '—';
  return metric.format==='money'?targetMoney.format(value)
    :metric.format==='percent'?`${(value*100).toFixed(1)}%`:targetInteger.format(value);
}
export function filteredTargets(state,status='All'){
  const query=state.query.trim().toLowerCase();
  const filter=node=>{
    if(!node.children.length){
      const kind=node.type==='asinTerm'?'ASINs':'Keywords';
      const text=[node.name,node.target,node.campaign,node.group,node.sku,node.item,node.match].join(' ').toLowerCase();
      return (state.kind==='All'||state.kind===kind)&&(status==='All'||node.status===status)&&(!query||text.includes(query))?node:null;
    }
    const children=node.children.map(filter).filter(Boolean);
    return children.length?{...node,children}:null;
  };
  return TARGET_TREE.map(filter).filter(Boolean);
}
export function targetRows(state,status='All'){
  const rows=[],periods=targetPeriods(state),tree=filteredTargets(state,status);
  const visit=(node,depth)=>{
    rows.push({...node,depth,expanded:!state.collapsed.includes(node.id),performance:periods.map(period=>targetPerformance(node,period))});
    if(!state.collapsed.includes(node.id))node.children.forEach(child=>visit(child,depth+1));
  };
  tree.forEach(node=>visit(node,0));return rows;
}
export function targetsView(state,status='All'){
  const targetRecords=targetRows(state,status),periods=targetPeriods(state),all=flattenTargets(filteredTargets(state,status));
  const headers=['Record type','Name / search term','Keyword or target',...periods.flatMap(period=>period.metrics.map(metric=>`${period.key} ${metric.label}`)), 'Match','Status','Bid','ASIN / SKU','Campaign','Ad group'];
  return {id:'ppc',kind:'targets',title:'TARGETS',headers,periods,targetRecords,
    rows:targetRecords.map(row=>[TARGET_RECORD_TYPES[row.type],row.name,row.target||'—',
      ...periods.flatMap((period,i)=>period.metrics.map(metric=>formatTargetMetric(metric,row.performance[i][metric.key]))),
      row.match||'—',row.status,row.bid===undefined?'—':formatTargetMetric({format:'money'},row.bid),row.sku,row.campaign,row.group||'—']),
    counts:{campaigns:all.filter(n=>n.type==='campaign').length,groups:all.filter(n=>n.type==='group').length,
      keywords:all.filter(n=>n.type==='keyword').length,asins:all.filter(n=>n.type==='asin').length,terms:all.filter(n=>!n.children.length).length},
    summary:`${state.kind} · ${state.period} · ${status}`,notice:'DEMO ONLY · Example performance for the Targets structure. No account changes.'};
}
