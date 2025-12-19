// frontend/src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';

// =================================================
// Conexão global (reutilizável entre componentes)
// =================================================
let globalWebSocket = null;
let globalConnectionCount = 0;
let globalConnectionId = 0;

const useWebSocket = (callbacks = {}) => {
  // ---------- estado local ----------
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // ---------- refs ----------
  const callbacksRef = useRef(callbacks);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const componentIdRef = useRef(Math.random().toString(36).slice(2, 9));
  const heartbeatIntervalRef = useRef(null);

  // ---------- constantes ----------
  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 3000;
  const HEARTBEAT_INTERVAL = 25000; // 25s

  // Atualiza callbacksRef quando callbacks mudam (evita closures)
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // ---------- HEARTBEAT ----------
  const startHeartbeat = useCallback((ws) => {
    if (!ws) return;
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    heartbeatIntervalRef.current = setInterval(() => {
      try {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          // console.log('💓 Heartbeat enviado');
        }
      } catch (error) {
        console.error('❌ Erro no heartbeat:', error);
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // ---------- RECONNECTION HELPERS ----------
  const clearReconnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // ---------- CONNECT ----------
  const connect = useCallback(() => {
    // Reaproveita conexão se já aberta
    if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
      setIsConnected(true);
      callbacksRef.current.onConnected?.();
      return;
    }

    // Se já estiver conectando, espera
    if (globalWebSocket && globalWebSocket.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      clearReconnection();
      stopHeartbeat();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.REACT_APP_WS_HOST || window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      globalConnectionCount++;
      globalConnectionId++;
      const currentConnectionId = globalConnectionId;

      globalWebSocket = new WebSocket(wsUrl);

      // Timeout de conexão inicial
      const connectionTimeout = setTimeout(() => {
        if (globalWebSocket && globalWebSocket.readyState === WebSocket.CONNECTING) {
          console.warn('⏰ Timeout de conexão WebSocket - fechando tentativa');
          try { globalWebSocket.close(); } catch (e) {}
        }
      }, 10000);

      globalWebSocket.onopen = () => {
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // iniciar heartbeat
        startHeartbeat(globalWebSocket);

        // registrar usuário se houver callback
        try {
          const user = callbacksRef.current.getUser?.();
          if (user) {
            globalWebSocket.send(JSON.stringify({ type: 'register_user', user }));
          }
        } catch (e) {
          console.warn('⚠️ Falha ao registrar usuário no websocket', e);
        }

        // solicitar dados iniciais
        try {
          globalWebSocket.send(JSON.stringify({ type: 'get_dashboard' }));
        } catch (e) {
          /* swallow */
        }

        callbacksRef.current.onConnected?.();
      };

      globalWebSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);

          switch (data.type) {
            case 'dashboard_update':
            case 'dashboard_data':
              setDashboardData(data.data);
              callbacksRef.current.onDashboardUpdate?.(data.data);
              break;

            case 'new_movement': {
              const movementNotification = {
                id: Date.now(),
                type: 'info',
                title: 'Nova Movimentação',
                message: `${data.data.usuario ?? 'Usuário'} ${data.data.tipo === 'saida' ? 'retirou' : 'devolveu'} ${data.data.quantidade ?? 0}x ${data.data.item ?? ''}`,
                timestamp: new Date(),
              };
              setNotifications(prev => [...prev.slice(-3), movementNotification]);
              callbacksRef.current.onNewMovement?.(data.data);
              callbacksRef.current.onNotification?.(movementNotification);
              break;
            }

            case 'new_maintenance': {
              const maintenanceNotification = {
                id: Date.now(),
                type: 'info',
                title: 'Nova Manutenção',
                message: `Manutenção ${data.data?.tipo_manutencao ?? ''} registrada`,
                timestamp: new Date(),
              };
              setNotifications(prev => [...prev.slice(-3), maintenanceNotification]);
              callbacksRef.current.onNewMaintenance?.(data.data);
              callbacksRef.current.onNotification?.(maintenanceNotification);
              break;
            }

            case 'low_stock_alert':
            case 'stock_alert': {
              const alertData = data.data || data.alert || {};
              const alertNotification = {
                id: Date.now(),
                type: 'error',
                title: 'Alerta de Estoque',
                message: alertData.mensagem || 'Item com estoque baixo',
                timestamp: new Date(),
              };
              if (alertData.id) {
                setAlerts(prev => [alertData, ...prev].slice(0, 10));
              }
              setNotifications(prev => [...prev.slice(-3), alertNotification]);
              callbacksRef.current.onStockAlert?.(alertData);
              callbacksRef.current.onNotification?.(alertNotification);
              break;
            }

            case 'heartbeat':
              // servidor solicitou resposta
              if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
                try { globalWebSocket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() })); } catch (e) {}
              }
              break;

            case 'pong':
              // resposta de ping, opcional
              break;

            default:
              callbacksRef.current.onMessage?.(data);
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem websocket:', error);
        }
      };

      globalWebSocket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        stopHeartbeat();
        setIsConnected(false);

        // decrementa apenas se esta for a conexão corrente
        if (currentConnectionId === globalConnectionId) {
          globalConnectionCount = Math.max(0, globalConnectionCount - 1);
        }

        callbacksRef.current.onDisconnected?.(event);

        const isIntentionalClose = event?.code === 1000 || event?.code === 1001;
        const maxAttemptsReached = reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS;

        if (!isIntentionalClose && !maxAttemptsReached) {
          reconnectAttemptsRef.current++;
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (maxAttemptsReached) {
          callbacksRef.current.onReconnectFailed?.();
        }
      };

      globalWebSocket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        callbacksRef.current.onError?.(error);
      };

    } catch (error) {
      console.error('❌ Erro crítico ao conectar WebSocket:', error);
      globalConnectionCount = Math.max(0, globalConnectionCount - 1);
      callbacksRef.current.onError?.(error);
    }
  }, [startHeartbeat, stopHeartbeat, clearReconnection]);

  // ---------- DISCONNECT (solicitado pelo componente) ----------
  const disconnect = useCallback(() => {
    clearReconnection();
    stopHeartbeat();

    if (globalWebSocket) {
      try {
        globalConnectionCount = Math.max(0, globalConnectionCount - 1);
        globalWebSocket.close(1000, 'Desconexão solicitada');
      } catch (e) {
        /* swallow */
      } finally {
        globalWebSocket = null;
        setIsConnected(false);
      }
    }

    reconnectAttemptsRef.current = 0;
    callbacksRef.current.onDisconnected?.({ reason: 'Desconexão solicitada' });
  }, [stopHeartbeat, clearReconnection]);

  // ---------- SEND seguro ----------
  const send = useCallback((message) => {
    if (!globalWebSocket || globalWebSocket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket não está conectado.');
      return false;
    }
    try {
      // accept object or string
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      globalWebSocket.send(payload);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      return false;
    }
  }, []);

  // ---------- helpers públicos ----------
  const requestDashboard = useCallback(() => send({ type: 'get_dashboard' }), [send]);
  const requestAlerts = useCallback(() => send({ type: 'get_alerts' }), [send]);
  const registerUser = useCallback((userData) => send({ type: 'register_user', user: userData }), [send]);
  const markAlertAsRead = useCallback((alertId) => {
    const ok = send({ type: 'mark_alert_read', alertId });
    if (ok) setAlerts(prev => prev.filter(a => a.id !== alertId));
    return ok;
  }, [send]);
  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);
  const clearAllNotifications = useCallback(() => setNotifications([]), []);

  // ---------- efeito de montagem do hook no componente ----------
  useEffect(() => {
    console.log(`🎯 [${componentIdRef.current}] Componente montado`);
    connect();

    return () => {
      console.log(`🎯 [${componentIdRef.current}] Componente desmontado`);
      // Não fecha a conexão global para que outros componentes que usam o hook continuem conectados.
      // Limpa apenas timeouts/heartbeat do componente local.
      clearReconnection();
      stopHeartbeat();
    };
    // connect é estável (useCallback)
  }, [connect, clearReconnection, stopHeartbeat]);

  // ---------- retorno da API do hook ----------
  return {
    isConnected,
    lastMessage,
    alerts,
    dashboardData,
    notifications,

    send,
    connect,
    disconnect,
    requestDashboard,
    requestAlerts,
    registerUser,
    markAlertAsRead,
    clearNotification,
    clearAllNotifications,

    reconnectAttempts: reconnectAttemptsRef.current,
    componentId: componentIdRef.current,
    connectionCount: globalConnectionCount,
  };
};

export default useWebSocket;
