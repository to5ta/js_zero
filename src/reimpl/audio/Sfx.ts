/**
 * Short gameplay sounds, synthesised in the browser.
 *
 * No files, so nothing to download, nothing in the asset manifest and nothing
 * to upload when a sound changes. The palette is deliberately dry — filtered
 * noise for stone, plain oscillators for the chimes — which carries further
 * than poor samples would.
 *
 * Browsers refuse to start audio before the player interacts with the page, so
 * the context is created lazily and every call is a no-op until then.
 */

type Ctor = typeof AudioContext;

export class Sfx {
    private ctx?: AudioContext;
    private master?: GainNode;
    private noiseBuffer?: AudioBuffer;
    private enabled = true;

    /**
     * Must be called from a user gesture, otherwise the context starts
     * suspended and every sound is silently dropped.
     */
    public unlock(): void {
        if (!this.enabled || this.ctx) return;

        const Ctx: Ctor | undefined =
            window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
        if (!Ctx) {
            this.enabled = false;
            return;
        }

        try {
            this.ctx = new Ctx();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.32;
            this.master.connect(this.ctx.destination);
        } catch {
            this.enabled = false;
            return;
        }

        void this.ctx.resume();
    }

    private get ready(): boolean {
        return this.enabled && !!this.ctx && !!this.master && this.ctx.state === 'running';
    }

    /** One second of white noise, reused as the source for every stone sound. */
    private getNoise(ctx: AudioContext): AudioBuffer {
        if (!this.noiseBuffer) {
            const length = ctx.sampleRate;
            this.noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }
        return this.noiseBuffer;
    }

    private tone(frequency: number, duration: number, peak: number, type: OscillatorType = 'sine', delay = 0): void {
        if (!this.ready) return;
        const ctx = this.ctx!;
        const start = ctx.currentTime + delay;

        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, start);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(this.master!);
        osc.start(start);
        osc.stop(start + duration + 0.02);
    }

    private noise(duration: number, peak: number, fromHz: number, toHz: number, q = 1, delay = 0): void {
        if (!this.ready) return;
        const ctx = this.ctx!;
        const start = ctx.currentTime + delay;

        const src = ctx.createBufferSource();
        src.buffer = this.getNoise(ctx);
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = q;
        filter.frequency.setValueAtTime(fromHz, start);
        filter.frequency.linearRampToValueAtTime(toHz, start + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.08, duration * 0.25));
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master!);
        src.start(start);
        src.stop(start + duration + 0.02);
    }

    /** A plate taking weight: short, low, mechanical. */
    public plateDown(): void {
        this.tone(150, 0.09, 0.5, 'square');
        this.noise(0.07, 0.22, 900, 420, 3);
    }

    /** A plate releasing: the same gesture, softer and lower. */
    public plateUp(): void {
        this.tone(104, 0.11, 0.3, 'square');
    }

    /** Stone sliding in its groove. */
    public gateOpen(): void {
        this.noise(1.15, 0.3, 150, 620, 1.2);
        this.tone(62, 0.9, 0.22, 'sawtooth');
    }

    /** The same slab coming back down, ending in a seated thud. */
    public gateClose(): void {
        this.noise(0.85, 0.28, 600, 130, 1.2);
        this.tone(48, 0.5, 0.26, 'sawtooth', 0.55);
    }

    /** Lifting a block: a dry scrape, no pitch. */
    public pickUp(): void {
        this.noise(0.17, 0.2, 1500, 700, 2);
    }

    /** Setting a block on stone. */
    public drop(): void {
        this.tone(88, 0.17, 0.42, 'triangle');
        this.noise(0.12, 0.16, 500, 200, 2);
    }

    /** All runes lit: three rising tones, the only melodic cue in the game. */
    public solved(): void {
        this.tone(523.25, 0.55, 0.3, 'sine', 0);
        this.tone(659.25, 0.55, 0.3, 'sine', 0.13);
        this.tone(783.99, 0.95, 0.32, 'sine', 0.26);
    }

    public dispose(): void {
        void this.ctx?.close();
        this.ctx = undefined;
        this.master = undefined;
        this.noiseBuffer = undefined;
    }
}
