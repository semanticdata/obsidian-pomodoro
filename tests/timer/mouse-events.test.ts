/* eslint-disable @typescript-eslint/no-explicit-any */
import "../setup";
import PomodoroPlugin from "../../src/main";
import { PluginWithPrivates } from "../setup";
import { PomodoroTimer } from "../../src/logic/timer";
import { createStandardTestPlugin, cleanupStandardTestPlugin } from "../helpers/plugin-test-helpers";

describe("PomodoroTimer - Mouse Events", () => {
	let plugin: PomodoroPlugin;
	let timer: PomodoroTimer;

	beforeEach(async () => {
		const setup = await createStandardTestPlugin();
		plugin = setup.plugin;
		timer = (plugin as PluginWithPrivates)._timer;
	});

	afterEach(async () => {
		await cleanupStandardTestPlugin(plugin);
	});

	/**
	 * Helper to find a registered DOM event handler by event name
	 */
	function findEventHandler(eventName: string) {
		const handler = (plugin as any).domEventHandlers.find(
			(call: any) => call.event === eventName,
		);
		return handler ? handler.callback : null;
	}

	describe("Left Click Events", () => {
		it("should toggle timer on left click", () => {
			expect(timer.isRunning).toBe(false);

			const toggleTimerSpy = jest.spyOn(timer, "toggleTimer");
			const clickHandler = findEventHandler("click");

			expect(clickHandler).toBeDefined();

			// Simulate left click (button: 0)
			const clickEvent = { button: 0 } as MouseEvent;
			clickHandler(clickEvent);

			expect(toggleTimerSpy).toHaveBeenCalled();
		});

		it("should start timer when clicked while not running", () => {
			expect(timer.isRunning).toBe(false);

			const clickHandler = findEventHandler("click");
			const clickEvent = { button: 0 } as MouseEvent;
			clickHandler(clickEvent);

			expect(timer.isRunning).toBe(true);
		});

		it("should pause timer when clicked while running", () => {
			// Start timer first
			timer.toggleTimer();
			expect(timer.isRunning).toBe(true);

			const clickHandler = findEventHandler("click");
			const clickEvent = { button: 0 } as MouseEvent;
			clickHandler(clickEvent);

			expect(timer.isRunning).toBe(false);
		});
	});

	describe("Middle Click Events", () => {
		it("should cycle duration on middle click when not running", () => {
			expect(timer.isRunning).toBe(false);
			const initialTimerType = timer.timerType;

			const auxclickHandler = findEventHandler("auxclick");
			expect(auxclickHandler).toBeDefined();

			// Simulate middle click (button: 1)
			const auxclickEvent = { button: 1 } as MouseEvent;
			auxclickHandler(auxclickEvent);

			// Timer type should have cycled
			expect(timer.timerType).not.toBe(initialTimerType);
		});

		it("should attempt to cycle duration even when running", () => {
			// Note: cycleDuration checks isRunning internally and returns early if running
			// But the event handler doesn't prevent calling it
			timer.toggleTimer();
			expect(timer.isRunning).toBe(true);

			const cycleDurationSpy = jest.spyOn(timer, "cycleDuration");
			const auxclickHandler = findEventHandler("auxclick");

			const auxclickEvent = { button: 1 } as MouseEvent;
			auxclickHandler(auxclickEvent);

			// cycleDuration is called but does nothing when timer is running
			expect(cycleDurationSpy).toHaveBeenCalled();
		});
	});

	describe("Right Click Events", () => {
		it("should reset timer on right click when not running", () => {
			expect(timer.isRunning).toBe(false);

			const resetTimerSpy = jest.spyOn(timer, "resetTimer");
			const contextmenuHandler = findEventHandler("contextmenu");

			expect(contextmenuHandler).toBeDefined();

			const contextmenuEvent = {
				preventDefault: jest.fn(),
			} as unknown as MouseEvent;

			contextmenuHandler(contextmenuEvent);

			expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
			expect(resetTimerSpy).toHaveBeenCalled();
		});

		it("should not reset timer on right click when running", () => {
			timer.toggleTimer();
			expect(timer.isRunning).toBe(true);

			const resetTimerSpy = jest.spyOn(timer, "resetTimer");
			const contextmenuHandler = findEventHandler("contextmenu");

			const contextmenuEvent = {
				preventDefault: jest.fn(),
			} as unknown as MouseEvent;

			contextmenuHandler(contextmenuEvent);

			// Context menu is prevented but timer is not reset
			expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
			expect(resetTimerSpy).not.toHaveBeenCalled();
		});

		it("should always prevent default context menu", () => {
			const contextmenuHandler = findEventHandler("contextmenu");

			const contextmenuEvent = {
				preventDefault: jest.fn(),
			} as unknown as MouseEvent;

			contextmenuHandler(contextmenuEvent);

			expect(contextmenuEvent.preventDefault).toHaveBeenCalled();
		});
	});
});
