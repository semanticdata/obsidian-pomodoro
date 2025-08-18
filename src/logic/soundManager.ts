import { Plugin } from "obsidian";
import { PomodoroSettings } from "../types";

export class SoundManager {
	private plugin: Plugin;
	private settings: PomodoroSettings;
	private currentAudio: HTMLAudioElement | null = null;
	private readonly builtInSounds = ["chime.wav", "correct.wav", "ding.wav", "jingle.wav", "triangle.wav"];
	private readonly cdnUrls: Record<string, string> = {
		"ding.wav": "https://cdn.jsdelivr.net/gh/semanticdata/dotfiles@latest/assets/ding.wav",
		"chime.wav": "https://cdn.jsdelivr.net/gh/semanticdata/dotfiles@latest/assets/chime.wav",
		"correct.wav": "https://cdn.jsdelivr.net/gh/semanticdata/dotfiles@latest/assets/correct.wav",
		"jingle.wav": "https://cdn.jsdelivr.net/gh/semanticdata/dotfiles@latest/assets/jingle.wav",
		"triangle.wav": "https://cdn.jsdelivr.net/gh/semanticdata/dotfiles@latest/assets/triangle.wav"
	};

	constructor(plugin: Plugin, settings: PomodoroSettings) {
		this.plugin = plugin;
		this.settings = settings;
	}

	updateSettings(settings: PomodoroSettings) {
		this.settings = settings;
	}

	private getSoundUrl(soundName: string): string {
		if (this.isBuiltInSound(soundName)) {
			return this.cdnUrls[soundName] || soundName;
		}
		return soundName;
	}

	private isBuiltInSound(soundName: string): boolean {
		return this.builtInSounds.includes(soundName);
	}

	private createAudioElement(soundUrl: string): Promise<HTMLAudioElement> {
		const audio = new Audio();
		audio.volume = this.settings.soundVolume;
		audio.preload = "auto";
		
		return new Promise<HTMLAudioElement>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error("Audio loading timeout"));
			}, 5000);

			audio.addEventListener("canplaythrough", () => {
				clearTimeout(timeoutId);
				resolve(audio);
			}, { once: true });

			audio.addEventListener("error", () => {
				clearTimeout(timeoutId);
				reject(new Error(`Failed to load audio: ${soundUrl}`));
			}, { once: true });

			audio.src = soundUrl;
		}).then(loadedAudio => {
			this.currentAudio = loadedAudio;
			return loadedAudio;
		});
	}

	async playCompletionSound(): Promise<void> {
		if (!this.settings.soundEnabled) {
			return;
		}

		try {
			const soundToPlay = this.settings.customSoundUrl && this.settings.customSoundUrl.trim() !== "" 
				? this.settings.customSoundUrl.trim()
				: this.settings.selectedSound;

			await this.playSound(soundToPlay);
		} catch (error) {
			// Silently handle audio playback errors
		}
	}

	private async playSound(soundName: string): Promise<void> {
		const soundUrl = this.getSoundUrl(soundName);
		const audio = await this.createAudioElement(soundUrl);
		await audio.play();
	}


	async previewSound(soundName?: string): Promise<void> {
		try {
			const soundToPreview = soundName || 
				(this.settings.customSoundUrl && this.settings.customSoundUrl.trim() !== "" 
					? this.settings.customSoundUrl.trim()
					: this.settings.selectedSound);

			await this.playSound(soundToPreview);
		} catch (error) {
			throw error;
		}
	}

	stopCurrentAudio(): void {
		if (this.currentAudio) {
			this.currentAudio.pause();
			this.currentAudio.currentTime = 0;
			this.currentAudio = null;
		}
	}

	getBuiltInSounds(): string[] {
		return [...this.builtInSounds];
	}

	cleanup(): void {
		this.stopCurrentAudio();
	}
}