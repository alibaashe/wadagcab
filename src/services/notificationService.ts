// Real-time Push, Background & Emergency Ringtone Service for Wadaage Platform (Rider & Driver)

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.permission = 'Notification' in window ? Notification.permission : 'denied';
      this.initServiceWorker();
    }
  }

  // Get or initialize AudioContext for audible alert chimes
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // CLEAR DUAL-TONE CHIME FOR NEW INCOMING ORDER (Pleasant medium alert chime)
  public startEmergencyOrderRingtone() {
    this.stopEmergencyOrderRingtone();
    try {
      const playPulse = () => {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        // Upbeat 3-tone chime sequence: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.001, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.3);
        });
      };

      playPulse();
      this.ringtoneInterval = setInterval(() => {
        playPulse();
        this.vibrateDevice([400, 150, 400]);
      }, 1200);
    } catch (_e) {}
  }

  public stopEmergencyOrderRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Custom high-priority sound alert synthesizers (Web Audio API)
  public playDriverAcceptedSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Ascending celebratory 4-tone chime: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.4, now + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.4);
      });
    } catch (_e) {}
  }

  public playDriverArrivedSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Dual-tone urgent bell chime repeated twice
      [0, 0.28].forEach((offset) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(880, now + offset);
        osc2.frequency.setValueAtTime(1318.51, now + offset);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.5, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now + offset);
        osc2.start(now + offset);
        osc1.stop(now + offset + 0.26);
        osc2.stop(now + offset + 0.26);
      });
    } catch (_e) {}
  }

  public playMessageSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Quick double pop notification chime for chat messages
      [0, 0.1].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(i === 0 ? 600 : 900, now + offset);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.14);
      });
    } catch (_e) {}
  }

  // Register service worker for background & sleeping APK push notifications
  private async initServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      this.swRegistration = reg;
    } catch (e) {
      console.warn('Service worker registration error:', e);
    }
  }

  // Request notification permissions
  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const perm = await Notification.requestPermission();
      this.permission = perm;
      return perm;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  // Trigger loud device vibration
  public vibrateDevice(pattern: number[] = [500, 100, 500, 100, 600]) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (_e) {}
    }
  }

  // Notify passenger when driver accepts the trip request
  public async notifyRiderDriverAccepted(options: {
    driverName: string;
    vehicleModel?: string;
    licensePlate?: string;
    etaMins?: number;
  }) {
    this.playDriverAcceptedSound();
    this.vibrateDevice([300, 100, 300, 100, 500]);

    const title = '🚗 Darawalkii ayaa aqbalay safarkaaga!';
    const body = `${options.driverName} (${options.vehicleModel || 'Toyota Vitz'} • ${options.licensePlate || 'SL-Plate'}) wuxuu kuusoo socdaa goobtaada.${options.etaMins ? ` Qiyaastii ${options.etaMins} daqiiqo.` : ''}`;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [300, 100, 300, 100, 500],
            tag: 'wadaage-driver-accepted',
            requireInteraction: true,
            data: { url: '/?app=rider' },
          } as any);
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-driver-accepted',
          } as any);
        }
      } catch (e) {
        console.warn('Failed to display native notification:', e);
      }
    }
  }

  // Notify passenger when driver has arrived
  public async notifyRiderDriverArrived(options: {
    driverName: string;
    licensePlate?: string;
  }) {
    this.playDriverArrivedSound();
    this.vibrateDevice([500, 150, 500, 150, 500]);

    const title = '📍 Darawalkaagu wuu soo gaadhay goobtaada!';
    const body = `${options.driverName} (${options.licensePlate || 'SL-Plate'}) wuxuu joogaa goobtaadii qaadashada. Fadlan u bax gaariga.`;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [500, 150, 500, 150, 500],
            tag: 'wadaage-driver-arrived',
            requireInteraction: true,
            data: { url: '/?app=rider' },
          } as any);
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-driver-arrived',
          } as any);
        }
      } catch (e) {
        console.warn('Failed to display native notification:', e);
      }
    }
  }

  // Notify incoming order to driver (with clear chime ringtone & background push for sleeping APK)
  public async notifyIncomingOrder(options: {
    passengerName: string;
    pickupLocation: string;
    dropoffLocation: string;
    fareUsd: number;
    fareSos: number;
    categoryName?: string;
  }) {
    // Start continuous chime ringtone
    this.startEmergencyOrderRingtone();
    this.vibrateDevice([600, 100, 600, 100, 800]);

    const title = '🚨 DALAB CUSUB! EMERGENCY RIDE ORDER (+5,000 SLSH)';
    const body = `Rakaab: ${options.passengerName}\nKa: ${options.pickupLocation} ➔ Ku: ${options.dropoffLocation}\nQiimaha: $${options.fareUsd.toFixed(2)} (${options.fareSos.toLocaleString()} SLSH)`;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [600, 100, 600, 100, 800],
            tag: 'wadaage-order-emergency-' + Date.now(),
            requireInteraction: true,
            renotify: true,
            data: { url: '/?app=driver' },
            actions: [
              { action: 'open_order', title: '🚖 Fur Dalabka (Open)' },
              { action: 'dismiss', title: 'Xidh (Dismiss)' }
            ]
          } as any);
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-order-emergency-' + Date.now(),
            requireInteraction: true,
          } as any);
        }
      } catch (e) {
        console.warn('Failed to display native notification:', e);
      }
    }
  }

  // Notify incoming chat message for both Rider & Driver
  public async notifyNewChatMessage(senderName: string, messageText: string, targetApp: 'driver' | 'rider' = 'rider') {
    this.playMessageSound();
    this.vibrateDevice([200, 80, 200]);

    const title = `💬 Fariin Cusub: ${senderName}`;
    const body = messageText;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 80, 200],
            tag: 'wadaage-chat-' + Date.now(),
            data: { url: `/?app=${targetApp}` },
          } as any);
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-chat-' + Date.now(),
          } as any);
        }
      } catch (e) {
        console.warn('Failed to display message notification:', e);
      }
    }
  }

  // General Driver Notification
  public async notifyDriver(title: string, body: string) {
    this.vibrateDevice([200, 100, 200]);
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-notice-' + Date.now(),
            data: { url: '/?app=driver' },
          });
        } else {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      } catch (_e) {}
    }
  }
}

export const notificationService = new NotificationService();
