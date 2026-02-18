const { contextBridge } = require('electron');

(async () => {
  try {
    const webmcp = await import('@jason.today/webmcp');
    const webllm = await import('@mlc-ai/web-llm');
    
    contextBridge.exposeInMainWorld('deepflex', {
      mcp: webmcp,
      llm: webllm
    });
    
    console.log('✅ DeepFlex context bridge loaded');
  } catch (err) {
    console.error('⚠️ DeepFlex preload error:', err);
  }
})();