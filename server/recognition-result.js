import {applyCatalogue} from './protection-catalogue.js';
import {normalizeClassification} from '../src/species-classification.js';
export const recognitionPrompt=`识别照片中的主要鸟、动物、植物、昆虫或菌类。只返回 JSON 对象，不要 markdown。
字段：name 中文名，latin 拉丁学名，category（鸟类/动物/植物/昆虫/菌类），description 中文介绍，habitat 栖息地，rarity（常见/稀有/未知，仅一般观测难度，不代表保护等级），confidence（0至1），uncertain 布尔。
先依据可见形态识别到物种。无法可靠识别到种时 uncertain=true，不要编造学名。不要推断拍摄地点。不要返回或猜测保护等级，服务器会按中文名和学名匹配内置名录；IUCN、CITES、观测稀有度都不是中国国家保护等级。`;
export function normalizeRecognitionResult(result){
 if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Invalid recognition result');
 const normalized=normalizeClassification(result);
 if(result.uncertain!==false||!String(result.name||'').trim()||!String(result.latin||'').trim())normalized.protection='未核实';
 return applyCatalogue(normalized,{recognition:true});
}
