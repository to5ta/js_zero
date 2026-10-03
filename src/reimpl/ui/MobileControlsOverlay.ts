import * as BABYLON from '@babylonjs/core';
import { Logger } from '../core/Logger';
import { InputState } from '../systems/InputState';

interface JoystickOptions {
    side: 'left' | 'right';
    label: string;
    icon: string;
    onChange: (axis: BABYLON.Vector2) => void;
}

class TouchJoystick {
    private readonly container: HTMLDivElement;
    private readonly knob: HTMLDivElement;
    private activePointerId: number | null = null;
    private readonly maxDistance: number = 42;
    private readonly currentAxis: BABYLON.Vector2 = BABYLON.Vector2.Zero();

    constructor(parent: HTMLElement, private readonly options: JoystickOptions) {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.bottom = '28px';
        this.container.style.width = '148px';
        this.container.style.height = '148px';
        this.container.style.borderRadius = '50%';
        this.container.style.border = '2px solid rgba(255, 255, 255, 0.4)';
        this.container.style.background = 'rgba(20, 24, 34, 0.4)';
        this.container.style.backdropFilter = 'blur(6px)';
        this.container.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
        this.container.style.pointerEvents = 'auto';
        this.container.style.touchAction = 'none';
        this.container.style.userSelect = 'none';
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.style.opacity = '1';

        if (options.side === 'left') {
            this.container.style.left = '24px';
        } else {
            this.container.style.right = '24px';
        }

        const guideRing = document.createElement('div');
        guideRing.style.width = '92px';
        guideRing.style.height = '92px';
        guideRing.style.borderRadius = '50%';
        guideRing.style.border = '1px dashed rgba(255, 255, 255, 0.28)';
        guideRing.style.pointerEvents = 'none';
        this.container.appendChild(guideRing);

        this.knob = document.createElement('div');
        this.knob.style.position = 'absolute';
        this.knob.style.width = '64px';
        this.knob.style.height = '64px';
        this.knob.style.borderRadius = '50%';
        this.knob.style.background = 'rgba(255, 255, 255, 0.4)';
        this.knob.style.border = '2px solid rgba(255, 255, 255, 0.45)';
        this.knob.style.display = 'flex';
        this.knob.style.alignItems = 'center';
        this.knob.style.justifyContent = 'center';
        this.knob.style.fontSize = '28px';
        this.knob.style.pointerEvents = 'none';
        this.knob.style.transform = 'translate(0px, 0px)';
        this.knob.textContent = options.icon;
        this.container.appendChild(this.knob);

        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.bottom = '156px';
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';
        label.style.padding = '6px 10px';
        label.style.borderRadius = '999px';
        label.style.background = 'rgba(20, 24, 34, 0.4)';
        label.style.border = '1px solid rgba(255, 255, 255, 0.22)';
        label.style.color = '#ffffff';
        label.style.fontSize = '12px';
        label.style.fontWeight = '700';
        label.style.letterSpacing = '0.08em';
        label.style.pointerEvents = 'none';
        label.textContent = `${options.icon} ${options.label}`;
        this.container.appendChild(label);

        this.container.addEventListener('pointerdown', this.handlePointerDown);
        this.container.addEventListener('pointermove', this.handlePointerMove);
        this.container.addEventListener('pointerup', this.handlePointerEnd);
        this.container.addEventListener('pointercancel', this.handlePointerEnd);

        parent.appendChild(this.container);
    }

    private handlePointerDown = (event: PointerEvent): void => {
        event.preventDefault();
        if (this.activePointerId !== null) {
            return;
        }

        this.activePointerId = event.pointerId;
        this.container.setPointerCapture(event.pointerId);
        this.updateAxisFromPointer(event.clientX, event.clientY);
    };

    private handlePointerMove = (event: PointerEvent): void => {
        if (this.activePointerId !== event.pointerId) {
            return;
        }

        event.preventDefault();
        this.updateAxisFromPointer(event.clientX, event.clientY);
    };

    private handlePointerEnd = (event: PointerEvent): void => {
        if (this.activePointerId !== event.pointerId) {
            return;
        }

        event.preventDefault();
        this.activePointerId = null;
        this.currentAxis.set(0, 0);
        this.options.onChange(this.currentAxis.clone());
        this.renderKnob();

        if (this.container.hasPointerCapture(event.pointerId)) {
            this.container.releasePointerCapture(event.pointerId);
        }
    };

    private updateAxisFromPointer(clientX: number, clientY: number): void {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offsetX = clientX - centerX;
        const offsetY = clientY - centerY;

        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        const clampedDistance = Math.min(distance, this.maxDistance);
        const angle = Math.atan2(offsetY, offsetX);
        const clampedX = Math.cos(angle) * clampedDistance;
        const clampedY = Math.sin(angle) * clampedDistance;

        this.currentAxis.set(
            clampedX / this.maxDistance,
            -clampedY / this.maxDistance
        );

        this.options.onChange(this.currentAxis.clone());
        this.renderKnob();
    }

    private renderKnob(): void {
        const x = this.currentAxis.x * this.maxDistance;
        const y = -this.currentAxis.y * this.maxDistance;
        this.knob.style.transform = `translate(${x}px, ${y}px)`;
    }

    public dispose(): void {
        this.container.removeEventListener('pointerdown', this.handlePointerDown);
        this.container.removeEventListener('pointermove', this.handlePointerMove);
        this.container.removeEventListener('pointerup', this.handlePointerEnd);
        this.container.removeEventListener('pointercancel', this.handlePointerEnd);
        this.container.remove();
    }
}

export class MobileControlsOverlay {
    private readonly root: HTMLDivElement;
    private readonly movementJoystick: TouchJoystick;
    private readonly lookJoystick: TouchJoystick;
    private readonly jumpButton: HTMLButtonElement;
    private readonly actionButton: HTMLButtonElement;

    constructor(private readonly inputState: InputState) {
        this.root = document.createElement('div');
        this.root.style.position = 'fixed';
        this.root.style.left = '0';
        this.root.style.top = '0';
        this.root.style.right = '0';
        this.root.style.bottom = '0';
        this.root.style.zIndex = '9998';
        this.root.style.pointerEvents = 'none';
        this.root.style.touchAction = 'none';

        this.movementJoystick = new TouchJoystick(this.root, {
            side: 'left',
            label: 'MOVE',
            icon: '🧭',
            onChange: (axis) => {
                this.inputState.setVirtualMovementInput(new BABYLON.Vector2(-axis.x, axis.y));
            }
        });

        this.lookJoystick = new TouchJoystick(this.root, {
            side: 'right',
            label: 'LOOK',
            icon: '👁️',
            onChange: (axis) => {
                this.inputState.setVirtualLookInput(axis);
            }
        });

        const centerButtons = document.createElement('div');
        centerButtons.style.position = 'absolute';
        centerButtons.style.left = '50%';
        centerButtons.style.bottom = '38px';
        centerButtons.style.transform = 'translateX(-50%)';
        centerButtons.style.display = 'flex';
        centerButtons.style.flexDirection = 'column';
        centerButtons.style.gap = '14px';
        centerButtons.style.pointerEvents = 'auto';

        this.jumpButton = this.createActionButton('⬆️', 'JUMP');
        this.actionButton = this.createActionButton('⚔️', 'ACTION');

        this.bindPressState(this.jumpButton, (pressed) => {
            this.inputState.setVirtualJumpPressed(pressed);
        });
        this.bindPressState(this.actionButton, (pressed) => {
            this.inputState.setVirtualActionPressed(pressed);
        });

        centerButtons.appendChild(this.jumpButton);
        centerButtons.appendChild(this.actionButton);
        this.root.appendChild(centerButtons);

        document.body.appendChild(this.root);

        Logger.info('📱 Mobile controls overlay created');
    }

    private createActionButton(icon: string, label: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.style.width = '104px';
        button.style.height = '58px';
        button.style.borderRadius = '18px';
        button.style.border = '2px solid rgba(255, 255, 255, 0.4)';
        button.style.background = 'rgba(20, 24, 34, 0.4)';
        button.style.color = '#ffffff';
        button.style.fontWeight = '700';
        button.style.fontSize = '14px';
        button.style.letterSpacing = '0.06em';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.gap = '8px';
        button.style.touchAction = 'none';
        button.style.userSelect = 'none';
        button.style.pointerEvents = 'auto';
        button.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.18)';
        button.style.backdropFilter = 'blur(6px)';
        button.innerHTML = `<span>${icon}</span><span>${label}</span>`;
        return button;
    }

    private bindPressState(button: HTMLButtonElement, onPressedChanged: (pressed: boolean) => void): void {
        const setPressedState = (pressed: boolean): void => {
            onPressedChanged(pressed);
            button.style.transform = pressed ? 'scale(0.96)' : 'scale(1)';
            button.style.background = pressed ? 'rgba(255, 255, 255, 0.4)' : 'rgba(20, 24, 34, 0.4)';
            button.style.color = pressed ? '#111827' : '#ffffff';
        };

        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            button.setPointerCapture(event.pointerId);
            setPressedState(true);
        });

        const release = (event: PointerEvent): void => {
            event.preventDefault();
            setPressedState(false);
            if (button.hasPointerCapture(event.pointerId)) {
                button.releasePointerCapture(event.pointerId);
            }
        };

        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
    }

    public dispose(): void {
        this.inputState.setVirtualMovementInput(BABYLON.Vector2.Zero());
        this.inputState.setVirtualLookInput(BABYLON.Vector2.Zero());
        this.inputState.setVirtualJumpPressed(false);
        this.inputState.setVirtualActionPressed(false);
        this.movementJoystick.dispose();
        this.lookJoystick.dispose();
        this.root.remove();
        Logger.info('📱 Mobile controls overlay disposed');
    }
}