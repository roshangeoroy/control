/**
 * Home Assistant WebSocket Client (via Proxy)
 * Provides bi-directional state synchronization.
 */
export class HAClient extends EventTarget {
  constructor() {
    super();
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.states = new Map();
    this.isConnected = false;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    console.log(`[HA] Connecting to proxy at ${wsUrl}...`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[HA] Connected to local proxy');
      this.isConnected = true;
      this.dispatchEvent(new CustomEvent('connected'));
      
      // 1. Subscribe to all state changes
      this.send({
        type: 'subscribe_events',
        event_type: 'state_changed'
      });

      // 2. Fetch initial states
      this.send({
        type: 'get_states'
      }, (msg) => {
        if (msg.success) {
          console.log('[HA] Initial states received');
          msg.result.forEach(state => {
            this.states.set(state.entity_id, state);
            this.dispatchEvent(new CustomEvent('state_update', { 
              detail: { entity_id: state.entity_id, state } 
            }));
          });
        }
      });
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      // Handle command responses (matching by ID)
      if (msg.id && this.callbacks.has(msg.id)) {
        this.callbacks.get(msg.id)(msg);
        this.callbacks.delete(msg.id);
      }

      // Handle pushed state changes
      if (msg.type === 'event' && msg.event.event_type === 'state_changed') {
        const newState = msg.event.data.new_state;
        if (newState) {
          this.states.set(newState.entity_id, newState);
          this.dispatchEvent(new CustomEvent('state_update', { 
            detail: { entity_id: newState.entity_id, state: newState } 
          }));
        }
      }
    };

    this.ws.onclose = () => {
      console.warn('[HA] Disconnected from proxy. Retrying in 5s...');
      this.isConnected = false;
      this.dispatchEvent(new CustomEvent('disconnected'));
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (err) => {
      console.error('[HA] WebSocket error:', err);
    };
  }

  /**
   * Send a message to Home Assistant via proxy.
   * @param {Object} msg - The message payload.
   * @param {Function} [callback] - Optional response callback.
   */
  send(msg, callback) {
    if (!this.isConnected) {
      console.warn('[HA] Cannot send: not connected');
      return;
    }
    const msgId = this.id++;
    const payload = { ...msg, id: msgId };
    if (callback) this.callbacks.set(msgId, callback);
    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Call an HA service.
   * @param {string} domain 
   * @param {string} service 
   * @param {Object} serviceData 
   */
  callService(domain, service, serviceData) {
    this.send({
      type: 'call_service',
      domain,
      service,
      service_data: serviceData
    });
  }

  /**
   * Get cached state for an entity.
   */
  getState(entityId) {
    return this.states.get(entityId);
  }
}

// Single instance for the app
export const ha = new HAClient();
