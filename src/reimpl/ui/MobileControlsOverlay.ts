import * as BABYLON from '@babylonjs/core';
import { Logger } from '../core/Logger';
import { InputState } from '../systems/InputState';
import { applyIronSurface, icon, SAFE_BOTTOM, Theme } from './theme';

interface JoystickOptions {
    side: 'left' | 'right';
    label: string;
    iconMarkup: string;
    onChange: (axis: BABYLON.Vector2) => void;
}

const RING_SIZE = 96;
const KNOB_SIZE = 44;
const MAX_DISTANCE = (RING_SIZE - KNOB_SIZE) / 2;

class TouchJoystick {
    private readonly container: HTMLDivElement;
    private readonly knob: HTMLDivElement;
    private activePointerId: number | null = null;
    private readonly currentAxis: BABYLON.Vector2 = BABYLON.Vector2.Zero();

    constructor(parent: HTMLElement, private readonly options: JoystickOptions) {
        this.container = document.createElement('div');
        this.container.setAttribute('aria-label', options.label);
        this.container.style.position = 'absolute';
        this.container.style.bottom = `calc(24px + ${SAFE_BOTTOM})`;
        this.container.style.width = `${RING_SIZE}px`;
        this.container.style.height = `${RING_SIZE}px`;
        this.container.style.borderRadius = '50%';
        this.container.style.border = `1px solid ${Theme.edgeSoft}`;
        this.container.style.background = 'rgba(14, 13, 11, 0.42)';
        this.container.style.pointerEvents = 'auto';
        this.container.style.touchAction = 'none';
        this.container.style.userSelect = 'none';
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';

        if (options.side === 'left') {
            this.container.style.left = '20px';
        } else {
            this.container.style.right = '20px';
        }

        this.knob = document.createElement('div');
        this.knob.style.position = 'absolute';
        this.knob.style.width = `${KNOB_SIZE}px`;
        this.knob.style.height = `${KNOB_SIZE}px`;
        this.knob.style.display = 'flex';
        this.knob.style.alignItems = 'center';
        this.knob.style.justifyContent = 'center';
        this.knob.style.pointerEvents = 'none';
        this.knob.style.transform = 'translate(0px, 0px)';
        this.knob.style.transition = 'color 90ms linear';
        this.knob.innerHTML = options.iconMarkup;
        applyIronSurface(this.knob, '50%');
        this.container.appendChild(this.knob);

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
        this.knob.style.color = Theme.brassBright;
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
        this.knob.style.color = Theme.text;
        this.currentAxis.set(0, 0);
        this.options.onChange(this.currentAxis.clone());
        this.renderKnob();

        if (this.container.hasPointerCapture(event.pointerId)) {
            this.container.releasePointerCapture(event.pointerId);
        }
    };

    private updateAxisFromPointer(clientX: number, clientY: number): void {
        const rect = this.container.getBoundingClientRect();
        const offsetX = clientX - (rect.left + rect.width / 2);
        const offsetY = clientY - (rect.top + rect.height / 2);

        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        const clamped = Math.min(distance, MAX_DISTANCE);
        const angle = Math.atan2(offsetY, offsetX);

        this.currentAxis.set(
            (Math.cos(angle) * clamped) / MAX_DISTANCE,
            -(Math.sin(angle) * clamped) / MAX_DISTANCE
        );

        this.options.onChange(this.currentAxis.clone());
        this.renderKnob();
    }

    private renderKnob(): void {
        const x = this.currentAxis.x * MAX_DISTANCE;
        const y = -this.currentAxis.y * MAX_DISTANCE;
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
    private readonly actionButton: HTMLButtonElement;
    private readonly actionHint: HTMLDivElement;

    constructor(private readonly inputState: InputState) {
        this.root = document.createElement('div');
        this.root.style.position = 'fixed';
        this.root.style.inset = '0';
        this.root.style.zIndex = '9998';
        this.root.style.pointerEvents = 'none';
        this.root.style.touchAction = 'none';

        this.movementJoystick = new TouchJoystick(this.root, {
            side: 'left',
            label: 'Move',
            iconMarkup: icon('move'),
            onChange: (axis) => {
                this.inputState.setVirtualMovementInput(new BABYLON.Vector2(-axis.x, axis.y));
            }
        });

        this.lookJoystick = new TouchJoystick(this.root, {
            side: 'right',
            label: 'Look',
            iconMarkup: icon('look'),
            onChange: (axis) => {
                this.inputState.setVirtualLookInput(axis);
            }
        });

        // Jump and action stack between the sticks, inside right thumb reach and
        // clear of the middle of the screen.
        const centreColumn = document.createElement('div');
        centreColumn.style.position = 'absolute';
        centreColumn.style.right = '128px';
        centreColumn.style.bottom = `calc(24px + ${SAFE_BOTTOM})`;
        centreColumn.style.display = 'flex';
        centreColumn.style.flexDirection = 'column';
        centreColumn.style.gap = '10px';
        centreColumn.style.pointerEvents = 'auto';

        const jumpButton = this.createActionButton(icon('jump'), 'Jump');
        this.actionButton = this.createActionButton(icon('action'), 'Action');

        this.bindPressState(jumpButton, (pressed) => this.inputState.setVirtualJumpPressed(pressed));
        this.bindPressState(this.actionButton, (pressed) => this.inputState.setVirtualActionPressed(pressed));

        centreColumn.appendChild(this.actionButton);
        centreColumn.appendChild(jumpButton);
        this.root.appendChild(centreColumn);

        // Says the action button will do something right now, so it is not a
        // mystery control when nothing is in reach.
        this.actionHint = document.createElement('div');
        this.actionHint.style.position = 'absolute';
        this.actionHint.style.right = '128px';
        this.actionHint.style.bottom = `calc(136px + ${SAFE_BOTTOM})`;
        this.actionHint.style.padding = '5px 10px';
        this.actionHint.style.fontSize = '12px';
        this.actionHint.style.letterSpacing = '0.04em';
        this.actionHint.style.whiteSpace = 'nowrap';
        this.actionHint.style.opacity = '0';
        this.actionHint.style.transition = 'opacity 120ms linear';
        this.actionHint.style.pointerEvents = 'none';
        applyIronSurface(this.actionHint, '999px');
        this.root.appendChild(this.actionHint);

        document.body.appendChild(this.root);
        Logger.info('Mobile controls overlay created');
    }

    /** Shown while something is in reach; null hides it again. */
    public setActionHint(text: string | null): void {
        if (text) {
            this.actionHint.textContent = text;
            this.actionHint.style.opacity = '1';
            this.actionButton.style.borderColor = Theme.brass;
        } else {
            this.actionHint.style.opacity = '0';
            this.actionButton.style.borderColor = Theme.edge;
        }
    }

    private createActionButton(iconMarkup: string, label: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', label);
        button.style.width = '72px';
        button.style.height = '48px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.touchAction = 'none';
        button.style.userSelect = 'none';
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
        button.style.transition = 'background 90ms linear, color 90ms linear';
        button.innerHTML = iconMarkup;
        applyIronSurface(button, '12px');
        return button;
    }

    private bindPressState(button: HTMLButtonElement, onPressedChanged: (pressed: boolean) => void): void {
        const setPressedState = (pressed: boolean): void => {
            onPressedChanged(pressed);
            button.style.background = pressed ? Theme.ironPressed : Theme.ironRaised;
            button.style.color = pressed ? Theme.brassBright : Theme.text;
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
        Logger.info('Mobile controls overlay disposed');
    }
}
