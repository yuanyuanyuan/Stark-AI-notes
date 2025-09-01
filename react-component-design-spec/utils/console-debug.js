// utils/console-debug.js
/**
 * 控制台调试工具
 * 提供结构化的调试日志输出
 */

export const consoleDebug = {
  // 组件生命周期调试
  lifecycle: {
    mount: (componentName) => {
      console.log(`🚀 [MOUNT] ${componentName} 组件已挂载`);
      console.time(`⏱️ ${componentName} 渲染时间`);
    },
    
    update: (componentName, props) => {
      console.log(`🔄 [UPDATE] ${componentName} 组件更新`);
      if (props) {
        console.log('📦 Props变化:', props);
      }
    },
    
    unmount: (componentName) => {
      console.timeEnd(`⏱️ ${componentName} 渲染时间`);
      console.log(`👋 [UNMOUNT] ${componentName} 组件已卸载`);
    }
  },
  
  // 状态调试
  state: {
    change: (componentName, stateKey, oldValue, newValue) => {
      console.log(`📊 [STATE] ${componentName}.${stateKey}:`, oldValue, '→', newValue);
    },
    
    effect: (componentName, effectKey, dependencies) => {
      console.log(`⚡ [EFFECT] ${componentName}.${effectKey} 触发`);
      if (dependencies) {
        console.log('🔗 依赖:', dependencies);
      }
    },
    
    context: (contextName, action, value) => {
      console.log(`🌐 [CONTEXT] ${contextName}.${action}:`, value);
    }
  },
  
  // 性能调试
  performance: {
    start: (label) => {
      console.time(`⚡ ${label}`);
      console.log(`🏁 [START] ${label}`);
    },
    
    end: (label) => {
      console.timeEnd(`⚡ ${label}`);
      console.log(`🏁 [END] ${label}`);
    },
    
    memory: () => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        console.log('🧠 [MEMORY] 使用情况:', {
          rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(usage.external / 1024 / 1024)}MB`
        });
      } else if (performance && performance.memory) {
        const memory = performance.memory;
        console.log('🧠 [MEMORY] 浏览器使用情况:', {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
        });
      }
    },
    
    render: (componentName, duration) => {
      if (duration > 16) {
        console.warn(`⚠️ [PERFORMANCE] ${componentName} 渲染时间过长: ${duration}ms`);
      } else {
        console.log(`⚡ [PERFORMANCE] ${componentName} 渲染时间: ${duration}ms`);
      }
    }
  },
  
  // 网络调试
  network: {
    request: (url, options) => {
      console.log(`🌐 [REQUEST] ${url}`, options);
    },
    
    response: (url, response, duration) => {
      console.log(`📥 [RESPONSE] ${url} (${duration}ms)`, response);
    },
    
    error: (url, error) => {
      console.error(`❌ [NETWORK ERROR] ${url}:`, error);
    },
    
    retry: (url, attempt, maxAttempts) => {
      console.log(`🔄 [NETWORK RETRY] ${url} (${attempt}/${maxAttempts})`);
    }
  },
  
  // 事件调试
  events: {
    emit: (componentName, eventName, data) => {
      console.log(`📢 [EVENT] ${componentName} 发出事件: ${eventName}`, data);
    },
    
    receive: (componentName, eventName, data) => {
      console.log(`👂 [EVENT] ${componentName} 接收事件: ${eventName}`, data);
    }
  },
  
  // 错误调试
  error: {
    throw: (componentName, error) => {
      console.error(`💥 [ERROR] ${componentName} 抛出错误:`, error);
    },
    
    catch: (componentName, error) => {
      console.error(`🛡️ [ERROR] ${componentName} 捕获错误:`, error);
    },
    
    boundary: (componentName, error, errorInfo) => {
      console.error(`🚨 [ERROR BOUNDARY] ${componentName} 捕获错误:`, error);
      console.log('Error Info:', errorInfo);
    }
  },
  
  // 调试工具
  utils: {
    group: (label) => {
      console.group(`🔍 [DEBUG] ${label}`);
    },
    
    groupEnd: () => {
      console.groupEnd();
    },
    
    table: (data, label) => {
      console.group(`📊 [TABLE] ${label}`);
      console.table(data);
      console.groupEnd();
    },
    
    trace: (label) => {
      console.group(`🔍 [TRACE] ${label}`);
      console.trace();
      console.groupEnd();
    },
    
    assert: (condition, message) => {
      if (!condition) {
        console.error(`❌ [ASSERT] ${message}`);
      }
    },
    
    clear: () => {
      console.clear();
    }
  }
};

// 导出默认的调试装饰器
export const withDebug = (Component, debugOptions = {}) => {
  const {
    logLifecycle = false,
    logProps = false,
    logState = false,
    logPerformance = false,
    logEvents = false,
    logNetwork = false
  } = debugOptions;

  return function DebugComponent(props) {
    const componentRef = useRef(null);
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());
    const stateRef = useRef({});

    // 生命周期调试
    useEffect(() => {
      if (logLifecycle) {
        consoleDebug.lifecycle.mount(Component.name || 'Anonymous');
      }
      
      return () => {
        if (logLifecycle) {
          consoleDebug.lifecycle.unmount(Component.name || 'Anonymous');
        }
      };
    }, []);

    // Props变化调试
    useEffect(() => {
      if (logProps && componentRef.current) {
        consoleDebug.lifecycle.update(Component.name || 'Anonymous', {
          from: componentRef.current,
          to: props
        });
      }
      componentRef.current = props;
    }, [props]);

    // 性能调试
    if (logPerformance) {
      renderCount.current += 1;
      const currentTime = Date.now();
      const renderTime = currentTime - lastRenderTime.current;
      
      consoleDebug.performance.render(Component.name || 'Anonymous', renderTime);
      
      if (renderCount.current > 10) {
        console.warn(`⚠️ [PERFORMANCE] ${Component.name} 渲染次数过多: ${renderCount.current}`);
      }
      
      lastRenderTime.current = currentTime;
    }

    return <Component {...props} ref={componentRef} />;
  };
};

// 性能调试Hook
export const usePerformanceDebug = (componentName, options = {}) => {
  const {
    logRenderTime = true,
    logRenderCount = true,
    logMemoryUsage = false,
    threshold = 16 // 60fps阈值
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const currentTime = Date.now();
    const renderTime = currentTime - lastRenderTime.current;
    
    renderCount.current += 1;
    renderTimes.current.push(renderTime);

    // 渲染时间调试
    if (logRenderTime && renderTime > threshold) {
      console.warn(`⚠️ [PERFORMANCE] ${componentName} 渲染时间过长: ${renderTime}ms`);
    }

    // 渲染次数调试
    if (logRenderCount && renderCount.current > 10) {
      console.warn(`⚠️ [PERFORMANCE] ${componentName} 渲染次数过多: ${renderCount.current}`);
    }

    // 内存使用调试
    if (logMemoryUsage && renderCount.current % 10 === 0) {
      consoleDebug.performance.memory();
    }

    lastRenderTime.current = currentTime;

    // 清理旧的渲染时间记录
    if (renderTimes.current.length > 100) {
      renderTimes.current = renderTimes.current.slice(-50);
    }
  });

  // 获取性能统计
  const getStats = () => {
    const times = renderTimes.current;
    return {
      renderCount: renderCount.current,
      averageRenderTime: times.length > 0 ? 
        times.reduce((a, b) => a + b, 0) / times.length : 0,
      maxRenderTime: Math.max(...times, 0),
      minRenderTime: Math.min(...times, 0),
      lastRenderTime: times[times.length - 1] || 0
    };
  };

  return {
    renderCount: renderCount.current,
    getStats
  };
};

// 状态调试Hook
export const useStateDebug = (initialState, componentName, stateName) => {
  const [state, setState] = useState(initialState);

  const setStateDebug = (newValue) => {
    if (process.env.NODE_ENV === 'development') {
      consoleDebug.state.change(componentName, stateName, state, newValue);
    }
    setState(newValue);
  };

  return [state, setStateDebug];
};

// Effect调试Hook
export const useEffectDebug = (effect, deps, componentName, effectName) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      consoleDebug.state.effect(componentName, effectName, deps);
    }
    return effect();
  }, deps);
};

// 网络请求调试Hook
export const useNetworkDebug = () => {
  const request = async (url, options = {}) => {
    const startTime = Date.now();
    
    if (process.env.NODE_ENV === 'development') {
      consoleDebug.network.request(url, options);
    }

    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        consoleDebug.network.response(url, {
          status: response.status,
          ok: response.ok
        }, duration);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        consoleDebug.network.error(url, error);
      }

      throw error;
    }
  };

  return { request };
};

// 错误边界调试组件
export const DebugErrorBoundary = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 调试日志
    consoleDebug.error.boundary(this.props.componentName || 'Unknown', error, errorInfo);

    // 发送错误到监控服务
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="debug-error-boundary">
          <h2>组件出现错误</h2>
          <details>
            <summary>错误详情</summary>
            <pre>{this.state.error?.toString()}</pre>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={this.handleReset}>
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
};

DebugErrorBoundary.defaultProps = {
  componentName: 'Unknown'
};

// 导出所有调试工具
export default {
  consoleDebug,
  withDebug,
  usePerformanceDebug,
  useStateDebug,
  useEffectDebug,
  useNetworkDebug,
  DebugErrorBoundary
};