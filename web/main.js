console.log('[DeepFlex] Web Runtime Loaded');

const state = {
  llmEngine: null,
  webgpu: {
    adapter: null,
    device: null,
  },
};

function setStatus(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  if (typeof ok === 'boolean') {
    el.style.color = ok ? '#4ade80' : '#f97373';
  }
}

function setOutput(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  el.textContent = text;
}

async function initWebGPU() {
  if (!('gpu' in navigator)) {
    setStatus('webgpu-status', 'WebGPU unavailable in this browser.', false);
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      setStatus('webgpu-status', 'No WebGPU adapter found.', false);
      return { ok: false, reason: 'no-adapter' };
    }

    const device = await adapter.requestDevice();
    state.webgpu.adapter = adapter;
    state.webgpu.device = device;

    setStatus('webgpu-status', 'WebGPU adapter + device ready.', true);
    console.log('[WebGPU] Adapter and device initialized.');
    return { ok: true };
  } catch (err) {
    console.error('[WebGPU] init failed', err);
    setStatus('webgpu-status', 'WebGPU init failed: ' + err.message, false);
    return { ok: false, reason: err.message };
  }
}

async function runWebGPUTest() {
  const init = await initWebGPU();
  if (!init.ok) return null;

  const device = state.webgpu.device;
  const input = new Uint32Array([1, 2, 3, 4]);
  const byteLength = input.byteLength;

  const storageBuffer = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(storageBuffer, 0, input);

  const readBuffer = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const shaderCode = `
    @group(0) @binding(0) var<storage, read_write> data: array<u32>;

    @compute @workgroup_size(1)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let i = id.x;
      data[i] = data[i] * 2u;
    }
  `;

  const module = device.createShaderModule({ code: shaderCode });
  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module,
      entryPoint: 'main',
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: storageBuffer },
      },
    ],
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(input.length);
  pass.end();

  encoder.copyBufferToBuffer(storageBuffer, 0, readBuffer, 0, byteLength);
  device.queue.submit([encoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const mapped = readBuffer.getMappedRange();
  const output = new Uint32Array(mapped.slice(0));
  readBuffer.unmap();

  const result = Array.from(output);
  console.log('[WebGPU] test kernel result:', result);
  setOutput('webgpu-output', { input: Array.from(input), output: result });
  return result;
}

async function ensureLLMEngine() {
  if (state.llmEngine) return state.llmEngine;

  try {
    const webllm = await import('https://esm.run/@mlc-ai/web-llm');
    const model = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
    const engine = await webllm.CreateMLCEngine(model, {
      initProgressCallback: (msg) => {
        setStatus('webllm-status', 'Loading model: ' + (msg.text || '...'));
      },
    });
    state.llmEngine = engine;
    setStatus('webllm-status', 'WebLLM loaded: ' + model, true);
    console.log('[WebLLM] loaded model', model);
    return engine;
  } catch (err) {
    console.warn('[WebLLM] loader failed, using fallback:', err.message);

    const fallback = {
      async complete(prompt) {
        return 'Fallback response: ' + String(prompt || '').slice(0, 500);
      },
    };
    state.llmEngine = fallback;
    setStatus('webllm-status', 'WebLLM unavailable, fallback active.', false);
    return fallback;
  }
}

async function llm(prompt) {
  const engine = await ensureLLMEngine();

  if (engine.chat && engine.chat.completions && engine.chat.completions.create) {
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    });

    const text = response.choices && response.choices[0] && response.choices[0].message
      ? response.choices[0].message.content
      : '(empty response)';

    return text;
  }

  if (typeof engine.complete === 'function') {
    return engine.complete(prompt);
  }

  return 'No LLM backend available.';
}

const mcpRegistry = {
  echo: async (args) => ({
    tool: 'echo',
    args,
    timestamp: new Date().toISOString(),
  }),
  upper: async (args) => {
    const text = (args && args.text) ? String(args.text) : '';
    return { tool: 'upper', output: text.toUpperCase() };
  },
};

async function runMCP(toolName, args) {
  const tool = mcpRegistry[toolName];
  if (!tool) {
    throw new Error('Unknown MCP tool: ' + toolName);
  }
  const result = await tool(args);
  console.log('[WebMCP] run', toolName, args, result);
  return result;
}

async function connectOpenWhispr() {
  try {
    const res = await fetch('http://localhost:7777/health');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    setStatus('openwhispr-status', 'Connected: ' + data.status, true);
    setOutput('openwhispr-output', data);
    console.log('[OpenWhispr] health', data);
    return data;
  } catch (err) {
    setStatus('openwhispr-status', 'Offline (start capsule server)', false);
    setOutput('openwhispr-output', { error: err.message });
    throw err;
  }
}

async function sendOpenWhispr(message) {
  const res = await fetch('http://localhost:7777/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error('OpenWhispr run failed: HTTP ' + res.status);
  }

  const data = await res.json();
  console.log('[OpenWhispr] run', data);
  return data;
}

window.deepflex = {
  webgpu: {
    init: initWebGPU,
    runTest: runWebGPUTest,
  },
  llm,
  mcp: {
    run: runMCP,
  },
  whispr: {
    connect: connectOpenWhispr,
    send: sendOpenWhispr,
  },
};

function bindUI() {
  const webgpuBtn = document.getElementById('webgpu-run-btn');
  const llmBtn = document.getElementById('webllm-run-btn');
  const mcpBtn = document.getElementById('webmcp-run-btn');
  const whisprConnectBtn = document.getElementById('openwhispr-connect-btn');
  const whisprSendBtn = document.getElementById('openwhispr-send-btn');

  if (webgpuBtn) {
    webgpuBtn.addEventListener('click', async () => {
      try {
        await runWebGPUTest();
      } catch (err) {
        setOutput('webgpu-output', { error: err.message });
      }
    });
  }

  if (llmBtn) {
    llmBtn.addEventListener('click', async () => {
      const promptEl = document.getElementById('webllm-prompt');
      const prompt = promptEl ? promptEl.value : '';
      setStatus('webllm-status', 'Running prompt...');
      try {
        const response = await llm(prompt);
        setStatus('webllm-status', 'LLM response received.', true);
        setOutput('webllm-output', response);
      } catch (err) {
        setStatus('webllm-status', 'LLM error: ' + err.message, false);
        setOutput('webllm-output', { error: err.message });
      }
    });
  }

  if (mcpBtn) {
    mcpBtn.addEventListener('click', async () => {
      const toolEl = document.getElementById('webmcp-tool');
      const argsEl = document.getElementById('webmcp-args');
      const toolName = toolEl ? toolEl.value.trim() : '';

      let args = {};
      try {
        args = argsEl && argsEl.value ? JSON.parse(argsEl.value) : {};
      } catch (err) {
        setStatus('webmcp-status', 'Invalid JSON args.', false);
        setOutput('webmcp-output', { error: err.message });
        return;
      }

      try {
        const result = await runMCP(toolName, args);
        setStatus('webmcp-status', 'MCP tool executed: ' + toolName, true);
        setOutput('webmcp-output', result);
      } catch (err) {
        setStatus('webmcp-status', err.message, false);
        setOutput('webmcp-output', { error: err.message });
      }
    });
  }

  if (whisprConnectBtn) {
    whisprConnectBtn.addEventListener('click', async () => {
      setStatus('openwhispr-status', 'Connecting...');
      try {
        await connectOpenWhispr();
      } catch (err) {
        console.error('[OpenWhispr] connect error', err);
      }
    });
  }

  if (whisprSendBtn) {
    whisprSendBtn.addEventListener('click', async () => {
      const msgEl = document.getElementById('openwhispr-message');
      const message = msgEl ? msgEl.value : '';
      try {
        const result = await sendOpenWhispr(message);
        setStatus('openwhispr-status', 'Message sent.', true);
        setOutput('openwhispr-output', result);
      } catch (err) {
        setStatus('openwhispr-status', err.message, false);
        setOutput('openwhispr-output', { error: err.message });
      }
    });
  }
}

async function init() {
  bindUI();
  await initWebGPU();
  setStatus('webllm-status', 'Ready to load WebLLM.', true);
  setStatus('webmcp-status', 'MCP registry loaded (echo, upper).', true);
  console.log('[DeepFlex] window.deepflex ready', window.deepflex);
}

window.addEventListener('DOMContentLoaded', init);
