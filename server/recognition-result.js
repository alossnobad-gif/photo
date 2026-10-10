import {normalizeClassification} from '../src/species-classification.js';
export const recognitionPrompt=`识别照片中的主要鸟、动物、植物、昆虫或菌类。只返回 JSON 对象，不要 markdown。
字段：name 中文名，latin 拉丁学名，category（鸟类/动物/植物/昆虫/菌类），description 中文介绍，habitat 栖息地，rarity（常见/稀有/未知，仅一般观测难度，不代表保护等级），protection（未核实/国家一级/国家二级/三有动物/地方重点保护/其他保护/未列入保护名录），confidence（0至1），uncertain 布尔。
先依据可见形态识别到物种，再根据该物种的准确中文名和拉丁学名给出中国保护等级候选。国家一级、国家二级以中国《国家重点保护野生动物名录》（2021年调整版）和《国家重点保护野生植物名录》（2021年调整版）及你确知的后续调整为依据，三有动物以2023年名录为依据。不要把 IUCN 等级、CITES 附录或观测稀有度当作中国国家保护等级。
无法可靠识别到种时 uncertain=true，不要编造学名，protection 必须为未核实。无法确定名录、存在亚种或种群适用范围差异、或依赖未知地点的地方保护等级时也返回未核实。仅在明确知道不在适用保护名录时使用未列入保护名录，不要把不知道误判为没有保护。不要推断拍摄地点。保护等级是待用户核实的候选，不能声称已实时查验名录。`;
export function normalizeRecognitionResult(result){
 if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Invalid recognition result');
 const normalized=normalizeClassification(result);
 if(result.uncertain!==false||!String(result.name||'').trim()||!String(result.latin||'').trim())normalized.protection='未核实';
 return normalized;
}
