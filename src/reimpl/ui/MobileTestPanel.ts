import { Environment } from '../core/Environment';
import { Logger } from '../core/Logger';

interface DevicePreset {
    label: string;
    width: number;
    height: number;
}

const DEVICE_PRESETS: DevicePreset[] = [
    { label: 'iPhone 14 Pro', width: 393, height: 852 },
    { label: 'Pixel 7', width: 412, height: 915 },
    { label: 'Galaxy S20', width: 360, height: 800 },
    { label: 'iPad Mini', width: 768, height: 1024 }
];

export class MobileTestPanel {
    private container?: HTMLDivElement;
    private statusLabel?: HTMLDivElement;
    private presetSelect?: HTMLSelectElement;
    private orientationButton?: HTMLButtonElement;
    private applyButton?: HTMLButtonElement;
    private desktopButton?: HTMLButtonElement;
    private activePreset: DevicePreset;
    private portrait: boolean = true;

    constructor() {
        const current = Environment.simulatedViewport;
        this.activePreset = current
            ? {
                label: current.label,
                width: current.width,
                height: current.height
            }
            : DEVICE_PRESETS[0];
        this.portrait = (current?.height ?? this.activePreset.height) >= (current?.width ?? this.activePreset.width);
        this.createUI();
        this.refreshStatus();
        Logger.info('🧪 Mobile test panel created');
    }

    private createUI(): void {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '12px';
        this.container.style.left = '12px';
        this.container.style.zIndex = '10001';
        this.container.style.width = '260px';
        this.container.style.padding = '14px';
        this.container.style.borderRadius = '16px';
        this.container.style.background = 'rgba(12, 16, 24, 0.88)';
        this.container.style.border = '1px solid rgba(255, 255, 255, 0.12)';
        this.container.style.boxShadow = '0 18px 48px rgba(0, 0, 0, 0.32)';
        this.container.style.color = '#ffffff';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.backdropFilter = 'blur(10px)';

        const title = document.createElement('div');
        title.textContent = '🧪 Mobile Test Harness';
        title.style.fontWeight = '700';
        title.style.marginBottom = '6px';
        this.container.appendChild(title);

        this.statusLabel = document.createElement('div');
        this.statusLabel.style.fontSize = '12px';
        this.statusLabel.style.lineHeight = '1.4';
        this.statusLabel.style.color = 'rgba(255, 255, 255, 0.75)';
        this.statusLabel.style.marginBottom = '12px';
        this.container.appendChild(this.statusLabel);

        const presetLabel = document.createElement('label');
        presetLabel.textContent = 'Device preset';
        presetLabel.style.display = 'block';
        presetLabel.style.fontSize = '12px';
        presetLabel.style.marginBottom = '6px';
        this.container.appendChild(presetLabel);

        this.presetSelect = document.createElement('select');
        this.presetSelect.style.width = '100%';
        this.presetSelect.style.marginBottom = '10px';
        this.presetSelect.style.padding = '10px 12px';
        this.presetSelect.style.borderRadius = '10px';
        this.presetSelect.style.border = '1px solid rgba(255,255,255,0.15)';
        this.presetSelect.style.background = 'rgba(255,255,255,0.08)';
        this.presetSelect.style.color = '#ffffff';

        DEVICE_PRESETS.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = `${preset.label} · ${preset.width}×${preset.height}`;
            option.selected = preset.label === this.activePreset.label;
            this.presetSelect!.appendChild(option);
        });

        this.presetSelect.addEventListener('change', () => {
            const selectedIndex = Number.parseInt(this.presetSelect!.value, 10);
            this.activePreset = DEVICE_PRESETS[selectedIndex] ?? DEVICE_PRESETS[0];
            this.refreshStatus();
        });
        this.container.appendChild(this.presetSelect);

        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'grid';
        buttonRow.style.gridTemplateColumns = '1fr 1fr';
        buttonRow.style.gap = '8px';
        buttonRow.style.marginBottom = '10px';

        this.orientationButton = this.createButton('↔️ Rotate');
        this.orientationButton.addEventListener('click', () => {
            this.portrait = !this.portrait;
            this.refreshStatus();
        });

        this.applyButton = this.createButton('📱 Apply');
        this.applyButton.addEventListener('click', () => {
            this.applyMobileTestMode();
        });

        buttonRow.appendChild(this.orientationButton);
        buttonRow.appendChild(this.applyButton);
        this.container.appendChild(buttonRow);

        this.desktopButton = this.createButton('🖥️ Back to desktop');
        this.desktopButton.style.width = '100%';
        this.desktopButton.addEventListener('click', () => {
            this.disableMobileTestMode();
        });
        this.container.appendChild(this.desktopButton);

        const hint = document.createElement('div');
        hint.style.fontSize = '11px';
        hint.style.lineHeight = '1.45';
        hint.style.marginTop = '10px';
        hint.style.color = 'rgba(255,255,255,0.65)';
        hint.textContent = 'Tip: pair this with browser device emulation + touch simulation for the closest mobile workflow.';
        this.container.appendChild(hint);

        document.body.appendChild(this.container);
    }

    private createButton(label: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.style.padding = '10px 12px';
        button.style.borderRadius = '10px';
        button.style.border = '1px solid rgba(255,255,255,0.15)';
        button.style.background = 'rgba(255,255,255,0.08)';
        button.style.color = '#ffffff';
        button.style.cursor = 'pointer';
        return button;
    }

    private getSelectedViewport(): { width: number; height: number; label: string } {
        const width = this.portrait ? this.activePreset.width : this.activePreset.height;
        const height = this.portrait ? this.activePreset.height : this.activePreset.width;
        const label = `${this.activePreset.label}${this.portrait ? '' : ' Landscape'}`;
        return { width, height, label };
    }

    private refreshStatus(): void {
        if (!this.statusLabel) {
            return;
        }

        const selected = this.getSelectedViewport();
        const mode = Environment.isMobileEmulated ? 'mobile emulation active' : 'desktop mode active';
        this.statusLabel.textContent = `${mode} · next preset ${selected.label} (${selected.width}×${selected.height})`;
    }

    private applyMobileTestMode(): void {
        const selected = this.getSelectedViewport();
        const url = new URL(window.location.href);
        url.searchParams.set('mobileTest', '1');
        url.searchParams.set('mobileWidth', String(selected.width));
        url.searchParams.set('mobileHeight', String(selected.height));
        url.searchParams.set('mobileLabel', selected.label);

        localStorage.setItem('jszero.mobileTest', '1');
        localStorage.setItem('jszero.mobileWidth', String(selected.width));
        localStorage.setItem('jszero.mobileHeight', String(selected.height));
        localStorage.setItem('jszero.mobileLabel', selected.label);

        window.location.href = url.toString();
    }

    private disableMobileTestMode(): void {
        const url = new URL(window.location.href);
        url.searchParams.delete('mobileTest');
        url.searchParams.delete('mobileWidth');
        url.searchParams.delete('mobileHeight');
        url.searchParams.delete('mobileLabel');

        localStorage.removeItem('jszero.mobileTest');
        localStorage.removeItem('jszero.mobileWidth');
        localStorage.removeItem('jszero.mobileHeight');
        localStorage.removeItem('jszero.mobileLabel');

        window.location.href = url.toString();
    }

    public dispose(): void {
        this.container?.remove();
        Logger.info('🧪 Mobile test panel disposed');
    }
}