import { DestroyRef, inject } from "@angular/core";

export interface TypewriterHook {
	/**
	 * Enqueues text to be "typed out". Each character will be emitted with a delay in between, creating a typewriter effect.
	 */
	enqueue: (text: string) => void;
	/**
	 * Returns a promise that resolves when the typewriter has finished emitting all enqueued characters. If the typewriter is already idle, it resolves immediately.
	 */
	waitForDrain: () => Promise<void>;
	/**
	 * Clears the typewriter's queue and stops any ongoing typing effect immediately. Any characters that were enqueued but not yet emitted will be discarded.
	 */
	clear: () => void;
}

const TYPEWRITER_DELAY_MS = 15;

interface TypewriterOptions {
	/**
	 * A callback function that will be called with each character as it is emitted by the typewriter. This allows you to handle the emitted characters in real-time, such as appending them to a message or updating the UI.
	 */
	onChar: (char: string) => void;
	/**
	 * The delay in milliseconds between emitting each character. Defaults to 15ms if not provided. Adjusting this value will speed up or slow down the typewriter effect.
	 *
	 */
	delayMS?: number;
}

/**
 *
 * Injects a typewriter utility that can be used to create a typewriter effect by emitting characters one at a time with a specified delay. The utility provides methods to enqueue text, wait for the queue to drain, and clear the queue. It also ensures that any ongoing typing effect is properly cleaned up when the component is destroyed.
 *
 * @param options - An object containing the configuration options for the typewriter, including the onChar callback and an optional delayMS for character emission.
 * @returns A TypewriterHook object with methods to control the typewriter effect.
 */
export const injectTypewriter = ({
	onChar,
	delayMS = TYPEWRITER_DELAY_MS,
}: TypewriterOptions): TypewriterHook => {
	const destroyRef = inject(DestroyRef);

	let queue: string[] = [];
	let running = false;
	let drainResolve: (() => void) | null = null;

	const run = (): void => {
		const char = queue.shift();

		if (char === undefined) {
			running = false;
			drainResolve?.();
			drainResolve = null;

			return;
		}

		onChar(char);
		setTimeout(run, delayMS);
	};

	const enqueue = (text: string): void => {
		queue.push(...text);

		if (running) return;

		running = true;
		run();
	};

	const waitForDrain = (): Promise<void> => {
		if (!running && queue.length === 0) {
			return Promise.resolve();
		}

		return new Promise<void>((resolve) => {
			drainResolve = resolve;
		});
	};

	const clear = (): void => {
		queue = [];
		running = false;
		drainResolve?.();
		drainResolve = null;
	};

	destroyRef.onDestroy(clear);

	return { enqueue, waitForDrain, clear };
};
