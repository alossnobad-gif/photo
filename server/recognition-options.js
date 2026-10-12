// Only apply provider-specific switches to models documented as supporting them.
// https://platform.qianwenai.com/docs/developer-guides/text-generation/thinking
export function recognitionOptions({platform,model}) {
 return platform==='qianwenai'&&/^qwen3\.8-(?:max(?:-0902)?|flash|27b)$/.test(model)
  ? {enable_thinking:false} : {};
}
