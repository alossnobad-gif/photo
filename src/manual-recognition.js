import {landscapeTags} from './landscape-data.js';
import {provinceForCity} from './city-provinces.js';
import {normalizeProvince} from './landscape-progress.js';
import {rarityOptions,protectionOptions} from './species-classification.js';
const aliases={物种名称:'name',中文名:'name',学名:'latin',拉丁学名:'latin',分类:'category',观测稀有度:'rarity',稀有程度:'rarity',保护等级:'protection',物种介绍:'description',栖息环境:'habitat',照片标题:'title',标题:'title',省份:'province',城市:'city',地点:'location',具体地点:'location',题材:'tags',景观描述:'description',分享文案:'shareText'};
const fields={species:{name:100,latin:150,category:20,rarity:20,protection:30,description:3000,habitat:1000},landscape:{title:100,province:50,city:100,location:150,description:1500,shareText:1500}};
export function parseManualRecognition(input,kind){
 if(!['species','landscape'].includes(kind))throw Error('识别类型无效');
 let value=input;
 if(typeof input==='string'){
  if(input.length>32000)throw Error('JSON 太长，请控制在 32000 字符以内');
  const text=input.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i,'$1').trim();
  try{value=JSON.parse(text);}catch{throw Error('JSON 格式不正确：请复制完整对象，使用双引号，去掉说明文字和多余逗号');}
 }
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('请粘贴一张照片的 JSON 对象，不是数组');
 if(value.kind&&value.kind!==kind)throw Error('JSON 的物种／风光类型与当前照片不一致');
 if(value.result!==undefined){value=value.result;if(!value||typeof value!=='object'||Array.isArray(value))throw Error('result 必须是 JSON 对象');}
 const normalized={};for(const [key,val] of Object.entries(value)){const mapped=aliases[key]||key;if(Object.hasOwn(fields[kind],mapped)||kind==='landscape'&&mapped==='tags'){if(Object.hasOwn(normalized,mapped))throw Error('字段重复：'+mapped);normalized[mapped]=val;}}
 if(kind==='species'&&('title' in value||'tags' in value)&&!normalized.name)throw Error('这看起来是风光 JSON，请切换到风光任务');
 if(kind==='landscape'&&('latin' in value||'学名' in value)&&!normalized.title)throw Error('这看起来是物种 JSON，请切换到物种任务');
 if(!Object.keys(normalized).length)throw Error('没有找到可填充的字段，请参考模板');
 const result={};for(const [key,val] of Object.entries(normalized)){
  if(key==='tags'){if(!Array.isArray(val)||val.some(tag=>!landscapeTags.includes(tag)))throw Error('风光题材必须是模板支持的字符串数组');result.tags=[...new Set(val)];continue;}
  if(typeof val!=='string')throw Error(key+' 必须是文字');if(val.trim().length>fields[kind][key])throw Error(key+' 内容太长');result[key]=val.trim();
 }
 if(result.category&&!['鸟类','动物','植物','昆虫','菌类'].includes(result.category))throw Error('分类只能是鸟类、动物、植物、昆虫或菌类');
 if(result.rarity&&!rarityOptions.includes(result.rarity))throw Error('稀有度只能是未知、常见或稀有');
 if(result.protection&&!protectionOptions.includes(result.protection))throw Error('保护等级不在支持列表中，请参考模板');
 if(result.province){const province=normalizeProvince(result.province);if(!province)throw Error('省份不在支持列表中');result.province=province;}
 if(result.city&&!result.province)result.province=provinceForCity(result.city)||'';
 return result;
}
export function manualRecognitionPrompt(kind){
 const result=kind==='landscape'?{title:'',province:'',city:'',location:'',tags:['其他'],description:'',shareText:''}:{name:'',latin:'',category:'鸟类',rarity:'未知',protection:'未核实',description:'',habitat:''};
 return `请识别我提供的这张${kind==='landscape'?'风光':'物种'}照片，只回复一个 JSON 对象，按以下结构填充。无法确认的信息留空，不编造学名、地点或保护等级。不要猜测拍摄日期、GPS 或输出照片路径。${kind==='landscape'?'题材可多选，仅限：'+landscapeTags.join('、'):'分类仅限鸟类、动物、植物、昆虫、菌类；rarity 仅限未知、常见、稀有；保护等级只允许国家一级、国家二级、三有动物、地方重点保护、其他保护、未列入保护名录、未核实；无法核实时填写未核实。'}\n`+JSON.stringify({kind,result},null,2);
}
