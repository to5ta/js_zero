
export interface ILevel {
    load(onFinished: () => void ): void;
    pause(): void;
    resume(): void;
}